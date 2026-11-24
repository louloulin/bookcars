import 'dotenv/config'
import { jest } from '@jest/globals'
import request from 'supertest'
import nodemailer from 'nodemailer'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import app from '../src/app'
import * as databaseHelper from '../src/utils/databaseHelper'
import { runScheduledHandoverReminders } from '../src/utils/handoverReminder'
import * as testHelper from './testHelper'
import * as env from '../src/config/env.config'
import Booking from '../src/models/Booking'
import Car from '../src/models/Car'
import Location from '../src/models/Location'
import LocationValue from '../src/models/LocationValue'
import Setting from '../src/models/Setting'
import User from '../src/models/User'

const testTransporter = nodemailer.createTransport({ jsonTransport: true })

let SUPPLIER_ID: string
let DRIVER1_ID: string
let DRIVER1_TOKEN: string
let LOCATION_ID: string
let CAR1_ID: string
let initialSettings: bookcarsTypes.Setting | null = null

//
// The pick-up moment of the tests: 23:00 in the timezone of the store, so
// the night service fee applies.
//
const NIGHT_PICKUP = new Date(Date.UTC(2027, 0, 15, 15, 0))
const NIGHT_RETURN = new Date(Date.UTC(2027, 0, 18, 15, 0))

beforeAll(async () => {
  jest.spyOn(nodemailer, 'createTransport').mockReturnValue(testTransporter)
  jest.spyOn(testTransporter, 'sendMail')

  testHelper.initializeLogger()

  await databaseHelper.connect(env.DB_URI, false, false)

  await testHelper.initialize()

  SUPPLIER_ID = await testHelper.createSupplier(`${testHelper.getSupplierName()}@test.bookcars.ma`, testHelper.getSupplierName())

  const supplier = await User.findById(SUPPLIER_ID)

  if (supplier) {
    supplier.payLater = true
    await supplier.save()
  }

  const driver1 = new User({
    fullName: 'driver1',
    email: testHelper.GetRandomEmail(),
    language: testHelper.LANGUAGE,
    type: bookcarsTypes.UserType.User,
  })
  await driver1.save()
  DRIVER1_ID = driver1._id.toString()
  DRIVER1_TOKEN = await testHelper.generateToken(DRIVER1_ID)

  //
  // A store that opens from 09:00 to 21:00 in the timezone of China
  //
  const locationValue = new LocationValue({ language: 'en', value: 'China store EN' })
  await locationValue.save()
  const location = new Location({
    country: testHelper.GetRandromObjectIdAsString(),
    values: [locationValue._id],
    businessHours: '09:00 - 21:00',
    timezone: 'Asia/Shanghai',
  })
  await location.save()
  LOCATION_ID = location._id.toString()

  const payload: bookcarsTypes.CreateCarPayload = {
    loggedUser: testHelper.GetRandromObjectIdAsString(),
    name: 'BMW X1',
    supplier: SUPPLIER_ID,
    minimumAge: 21,
    locations: [LOCATION_ID],
    dailyPrice: 78,
    discountedDailyPrice: null,
    hourlyPrice: null,
    discountedHourlyPrice: null,
    biWeeklyPrice: null,
    discountedBiWeeklyPrice: null,
    weeklyPrice: null,
    discountedWeeklyPrice: null,
    monthlyPrice: null,
    discountedMonthlyPrice: null,
    deposit: 950,
    available: false,
    type: bookcarsTypes.CarType.Diesel,
    gearbox: bookcarsTypes.GearboxType.Automatic,
    aircon: true,
    seats: 5,
    doors: 4,
    fuelPolicy: bookcarsTypes.FuelPolicy.FreeTank,
    mileage: -1,
    cancellation: 0,
    amendments: 0,
    theftProtection: 9,
    collisionDamageWaiver: 12,
    fullInsurance: 20,
    additionalDriver: 0,
    range: bookcarsTypes.CarRange.Midi,
    multimedia: [bookcarsTypes.CarMultimedia.AndroidAuto],
    rating: 4,
    isDateBasedPrice: false,
    dateBasedPrices: [],
  }

  const car = new Car(payload)
  await car.save()
  CAR1_ID = car._id.toString()

  const settings = await Setting.findOne({}) ?? await Setting.create({})
  initialSettings = settings.toObject() as unknown as bookcarsTypes.Setting
})

afterAll(async () => {
  if (initialSettings) {
    await Setting.findOneAndUpdate({}, {
      minPickupHours: initialSettings.minPickupHours,
      minRentalHours: initialSettings.minRentalHours,
      minPickupDropoffHour: initialSettings.minPickupDropoffHour,
      maxPickupDropoffHour: initialSettings.maxPickupDropoffHour,
      nightServiceFee: initialSettings.nightServiceFee,
      nightServiceStartHour: initialSettings.nightServiceStartHour,
      nightServiceEndHour: initialSettings.nightServiceEndHour,
      oneWayFee: initialSettings.oneWayFee,
      mileageFee: initialSettings.mileageFee,
      mileageIncluded: initialSettings.mileageIncluded,
      overtimeFee: initialSettings.overtimeFee,
      overtimeFreeHours: initialSettings.overtimeFreeHours,
      enforceBookingRules: initialSettings.enforceBookingRules,
    })
  }

  await testHelper.close()

  await testHelper.deleteSupplier(SUPPLIER_ID)
  await Location.deleteMany({ _id: LOCATION_ID })
  await Car.deleteMany({ _id: CAR1_ID })
  await User.deleteMany({ _id: DRIVER1_ID })
  await Booking.deleteMany({ driver: DRIVER1_ID })
})

const buildCheckoutPayload = (from: Date, to: Date, dropOffLocation = LOCATION_ID) => {
  const payload: bookcarsTypes.CheckoutPayload = {
    booking: {
      supplier: SUPPLIER_ID,
      car: CAR1_ID,
      driver: DRIVER1_ID,
      pickupLocation: LOCATION_ID,
      dropOffLocation,
      from,
      to,
      status: bookcarsTypes.BookingStatus.Pending,
      cancellation: false,
      amendments: false,
      theftProtection: false,
      collisionDamageWaiver: false,
      fullInsurance: false,
      price: 0,
      additionalDriver: false,
    },
    payLater: true,
  }

  return payload
}

describe('P1: the fees of the Chinese market', () => {
  it('should charge the night service fee during the night hours of the store', () => {
    const fees = bookcarsHelper.calculateChinaFees({
      from: NIGHT_PICKUP,
      timezone: 'Asia/Shanghai',
      sameStore: true,
      settings: {
        nightServiceFee: 50,
        nightServiceStartHour: 22,
        nightServiceEndHour: 6,
        oneWayFee: 0,
      },
    })

    expect(fees.total).toBe(50)
    expect(fees.items.length).toBe(1)
    expect(fees.items[0].code).toBe('nightService')
  })

  it('should not charge the night service fee during the day hours of the store', () => {
    const fees = bookcarsHelper.calculateChinaFees({
      from: new Date(Date.UTC(2027, 0, 15, 2, 0)),
      timezone: 'Asia/Shanghai',
      sameStore: true,
      settings: {
        nightServiceFee: 50,
        nightServiceStartHour: 22,
        nightServiceEndHour: 6,
        oneWayFee: 0,
      },
    })

    expect(fees.total).toBe(0)
    expect(fees.items.length).toBe(0)
  })

  it('should charge the one way fee when the car is returned to another store', () => {
    const fees = bookcarsHelper.calculateChinaFees({
      from: new Date(Date.UTC(2027, 0, 15, 2, 0)),
      timezone: 'Asia/Shanghai',
      sameStore: false,
      settings: {
        nightServiceFee: 50,
        nightServiceStartHour: 22,
        nightServiceEndHour: 6,
        oneWayFee: 200,
      },
    })

    expect(fees.total).toBe(200)
    expect(fees.items[0].code).toBe('oneWay')
  })

  it('should charge the overtime fee over the free overtime hours', () => {
    const fees = bookcarsHelper.calculateOvertimeFee({
      returnDate: new Date(Date.UTC(2027, 0, 15, 6, 0)),
      bookedTo: new Date(Date.UTC(2027, 0, 15, 4, 0)),
      settings: {
        overtimeFee: 30,
        overtimeFreeHours: 1,
      },
    })

    expect(fees.total).toBe(30)
    expect(fees.items[0].code).toBe('overtime')
  })

  it('should charge the mileage fee over the included mileage', () => {
    const fees = bookcarsHelper.calculateMileageFee({
      kilometres: 250,
      settings: {
        mileageFee: 2,
        mileageIncluded: 200,
      },
    })

    expect(fees.total).toBe(100)
    expect(fees.items[0].code).toBe('mileage')
  })

  it('should store the fees of the booking and add them to the price', async () => {
    await Setting.findOneAndUpdate({}, {
      enforceBookingRules: false,
      nightServiceFee: 50,
      nightServiceStartHour: 22,
      nightServiceEndHour: 6,
      oneWayFee: 0,
    })

    const res = await request(app)
      .post('/api/checkout')
      .set(env.X_ACCESS_TOKEN, DRIVER1_TOKEN)
      .send(buildCheckoutPayload(NIGHT_PICKUP, NIGHT_RETURN))

    expect(res.statusCode).toBe(200)

    const booking = await Booking.findOne({ driver: DRIVER1_ID, from: NIGHT_PICKUP })

    expect(booking).toBeTruthy()
    expect(booking?.fees?.total).toBe(50)
    expect(booking?.fees?.items.length).toBe(1)
    expect(booking?.price).toBeGreaterThan(50)

    await Booking.deleteMany({ driver: DRIVER1_ID })
  })
})

describe('P1: the booking rules of the store are enforced by the server', () => {
  it('should reject a booking that is shorter than the minimum duration', async () => {
    await Setting.findOneAndUpdate({}, {
      enforceBookingRules: true,
      minRentalHours: 48,
      minPickupHours: 0,
    })

    const res = await request(app)
      .post('/api/checkout')
      .set(env.X_ACCESS_TOKEN, DRIVER1_TOKEN)
      .send(buildCheckoutPayload(NIGHT_PICKUP, new Date(Date.UTC(2027, 0, 16, 15, 0))))

    expect(res.statusCode).toBe(400)
    expect(res.text).toContain('shorter than the minimum duration')

    await Booking.deleteMany({ driver: DRIVER1_ID })
  })

  it('should reject a pick-up that is too close', async () => {
    await Setting.findOneAndUpdate({}, {
      enforceBookingRules: true,
      minRentalHours: 1,
      minPickupHours: 48,
    })

    const from = new Date(Date.now() + (2 * 1000 * 60 * 60))
    const to = new Date(Date.now() + (4 * 1000 * 60 * 60))

    const res = await request(app)
      .post('/api/checkout')
      .set(env.X_ACCESS_TOKEN, DRIVER1_TOKEN)
      .send(buildCheckoutPayload(from, to))

    expect(res.statusCode).toBe(400)
    expect(res.text).toContain('too close')

    await Booking.deleteMany({ driver: DRIVER1_ID })
  })

  it('should reject a pick-up outside the opening hours of the store', async () => {
    await Setting.findOneAndUpdate({}, {
      enforceBookingRules: true,
      minRentalHours: 1,
      minPickupHours: 0,
    })

    // 23:00 in the timezone of the store, the store closes at 21:00
    const res = await request(app)
      .post('/api/checkout')
      .set(env.X_ACCESS_TOKEN, DRIVER1_TOKEN)
      .send(buildCheckoutPayload(NIGHT_PICKUP, NIGHT_RETURN))

    expect(res.statusCode).toBe(400)
    expect(res.text).toContain('opening hours')

    await Booking.deleteMany({ driver: DRIVER1_ID })
  })

  it('checks the return store’s own timezone and closing minute', async () => {
    await Setting.findOneAndUpdate({}, { enforceBookingRules: true, minRentalHours: 1, minPickupHours: 0 })
    const dropOff = await Location.create({
      country: testHelper.GetRandromObjectIdAsString(), businessHours: '09:30 - 17:15', timezone: 'Asia/Tokyo',
    })
    const submit = (hour: number, minute: number) => request(app).post('/api/checkout')
      .set(env.X_ACCESS_TOKEN, DRIVER1_TOKEN)
      .send(buildCheckoutPayload(new Date('2027-01-15T02:00:00Z'), new Date(Date.UTC(2027, 0, 16, hour, minute)), String(dropOff._id)))
    try {
      const closed = await submit(8, 15)
      expect(closed.statusCode).toBe(400)
      expect(closed.text).toContain('drop-off time')
      expect((await submit(8, 14)).statusCode).toBe(200)
    } finally {
      await Location.deleteOne({ _id: dropOff._id })
      await Booking.deleteMany({ driver: DRIVER1_ID })
    }
  })

  it.each([['14:29', false], ['14:30', true], ['22:14', true], ['22:15', false], ['01:29', false], ['01:30', true], ['02:14', true], ['02:15', false]])(
    'checks minute boundaries at UTC %s', (utc, open) => {
      const hours = utc.startsWith('14') || utc.startsWith('22') ? '22:30 - 06:15' : '09:30 - 10:15'
      expect(bookcarsHelper.isWithinBusinessHours(new Date(`2027-01-15T${utc}:00Z`), hours, 'Asia/Shanghai')).toBe(open)
    },
  )

  it('should accept the same booking when the rules are not enforced', async () => {
    await Setting.findOneAndUpdate({}, {
      enforceBookingRules: false,
      minRentalHours: 48,
      minPickupHours: 48,
    })

    const res = await request(app)
      .post('/api/checkout')
      .set(env.X_ACCESS_TOKEN, DRIVER1_TOKEN)
      .send(buildCheckoutPayload(NIGHT_PICKUP, NIGHT_RETURN))

    expect(res.statusCode).toBe(200)

    await Booking.deleteMany({ driver: DRIVER1_ID })
  })
})

it('records the store handover in order and calculates return fees once', async () => {
  const { BookingStatus, HandoverStage } = bookcarsTypes
  await Setting.findOneAndUpdate({}, { mileageFee: 2, mileageIncluded: 50, overtimeFee: 10, overtimeFreeHours: 1 })
  const booking = await Booking.create({
    supplier: SUPPLIER_ID,
    driver: DRIVER1_ID,
    car: CAR1_ID,
    pickupLocation: LOCATION_ID,
    dropOffLocation: LOCATION_ID,
    status: BookingStatus.Reserved,
    from: new Date(Date.now() - 86_400_000),
    to: new Date(Date.now() - 7_200_000),
    price: 300,
  })
  const url = `/api/booking-handover/${booking._id}`
  const reminderUrl = `${url}/reminder`
  const token = await testHelper.generateToken(SUPPLIER_ID)
  const otherSupplier = await testHelper.createSupplier(testHelper.GetRandomEmail(), testHelper.getSupplierName())
  const otherToken = await testHelper.generateToken(otherSupplier)
  const post = (stage: bookcarsTypes.HandoverStage, fields = {}) => request(app).post(url).set(env.X_ACCESS_TOKEN, token).send({ stage, ...fields })
  const inspection = { odometer: 1000, fuelPercent: 90, condition: 'No new damage' }

  expect((await request(app).get(url).set(env.X_ACCESS_TOKEN, DRIVER1_TOKEN)).statusCode).toBe(403)
  expect((await request(app).get(url).set(env.X_ACCESS_TOKEN, otherToken)).statusCode).toBe(404)
  expect((await post(HandoverStage.Ready)).statusCode).toBe(409)
  const concurrent = await Promise.all([post(HandoverStage.Accepted), post(HandoverStage.Accepted)])
  expect(concurrent.map((response) => response.statusCode).sort()).toEqual([200, 409])
  expect((await post(HandoverStage.Preparing)).statusCode).toBe(200)
  expect((await post(HandoverStage.Ready)).statusCode).toBe(200)
  expect((await request(app).post(reminderUrl).set(env.X_ACCESS_TOKEN, otherToken)).statusCode).toBe(404)
  expect((await post(HandoverStage.PickedUp, inspection)).statusCode).toBe(400)
  expect((await post(HandoverStage.PickedUp, { ...inspection, contractVersion: 'CN-1', documentsVerified: true })).statusCode).toBe(200)
  expect((await post(HandoverStage.Returned, { ...inspection, odometer: 999 })).statusCode).toBe(400)
  const returned = await post(HandoverStage.Returned, { ...inspection, odometer: 1075 })
  expect(returned.statusCode).toBe(200)
  expect(returned.body.fees.items[0].code).toBe('overtime')
  expect(returned.body.fees.items[0].amount).toBeCloseTo(10, 0)
  expect(returned.body.fees.items[1]).toEqual({ code: 'mileage', amount: 50 })
  expect(returned.body.fees.total).toBeCloseTo(60, 0)
  const receipt = { method: 'wechat', reference: ' WX-DEMO-01 ', amount: 1, currency: 'CNY' }
  expect((await post(HandoverStage.Settled, { returnFeeReceipt: { ...receipt, method: 'invalid' } })).statusCode).toBe(400)
  expect((await post(HandoverStage.Settled, { returnFeeReceipt: { ...receipt, reference: '  ' } })).statusCode).toBe(400)
  const settlement = await post(HandoverStage.Settled, { returnFeeReceipt: receipt })
  expect(settlement.statusCode).toBe(200)
  const expectedReceipt = { method: 'wechat', reference: 'WX-DEMO-01', amount: returned.body.fees.total, currency: returned.body.currency }
  expect(settlement.body.events.at(-1).returnFeeReceipt).toEqual(expectedReceipt)
  expect((await post(HandoverStage.Settled, { returnFeeReceipt: { ...receipt, reference: 'OTHER' } })).statusCode).toBe(409)
  expect((await request(app).post(reminderUrl).set(env.X_ACCESS_TOKEN, token)).statusCode).toBe(409)
  const stored = await request(app).get(url).set(env.X_ACCESS_TOKEN, token)
  expect(stored.body.events.map((event: bookcarsTypes.HandoverEvent) => event.stage)).toEqual(Object.values(HandoverStage))
  expect(stored.body.events.every((event: bookcarsTypes.HandoverEvent) => event.operator === SUPPLIER_ID)).toBe(true)
  expect(stored.body.nextStage).toBeUndefined()
  expect(stored.body.events.at(-1).returnFeeReceipt).toEqual(expectedReceipt)
  expect((await Booking.findById(booking._id))?.handover).toBeUndefined()
  await Booking.deleteOne({ _id: booking._id })
})

it('claims scheduled reminders once across workers and exposes the result to the store only', async () => {
  const { BookingStatus, HandoverStage, HandoverReminderKind } = bookcarsTypes
  const now = new Date('2030-05-01T12:00:00Z')
  const hour = 3_600_000
  const near = new Date(now.getTime() + hour)
  const past = new Date(now.getTime() - hour)
  const late = new Date(now.getTime() + 25 * hour)
  const create = (stages: bookcarsTypes.HandoverStage[], from: Date, to: Date, status = BookingStatus.Reserved) => Booking.create({
    supplier: SUPPLIER_ID, driver: DRIVER1_ID, car: CAR1_ID,
    pickupLocation: LOCATION_ID, dropOffLocation: LOCATION_ID, status, from, to, price: 300,
    handover: { events: stages.map((stage) => ({ stage, at: past, operator: SUPPLIER_ID })) },
  })
  const pickedUp = [HandoverStage.Ready, HandoverStage.PickedUp]
  const pickup = await create([HandoverStage.Ready], near, late)
  const upcomingReturn = await create(pickedUp, past, near)
  const overdue = await create(pickedUp, new Date(past.getTime() - hour), past)
  await create([...pickedUp, HandoverStage.Returned], new Date(past.getTime() - hour), past)
  await create([HandoverStage.Ready], near, late, BookingStatus.Cancelled)
  await create([HandoverStage.Ready], late, new Date(late.getTime() + hour))

  const deliver = jest.fn(async (_booking: Pick<env.Booking, '_id'>, kind: bookcarsTypes.HandoverReminderKind) => kind !== HandoverReminderKind.Overdue)
  await Promise.all([runScheduledHandoverReminders(now, deliver), runScheduledHandoverReminders(now, deliver)])
  const actual = deliver.mock.calls.map(([booking, kind]) => [String(booking._id), kind])
  expect(actual).toHaveLength(3)
  expect(actual).toEqual(expect.arrayContaining([
    [String(pickup._id), HandoverReminderKind.Pickup],
    [String(upcomingReturn._id), HandoverReminderKind.Return],
    [String(overdue._id), HandoverReminderKind.Overdue],
  ]))
  expect(await runScheduledHandoverReminders(now, deliver)).toEqual({ sent: 0, failed: 0 })
  expect((await Booking.findById(overdue._id).select('+scheduledReminders'))?.scheduledReminders?.overdue?.status).toBe('failed')
  expect((await Booking.findById(pickup._id))?.scheduledReminders).toBeUndefined()
  const url = `/api/booking-handover/${pickup._id}`
  const token = await testHelper.generateToken(SUPPLIER_ID)
  const store = await request(app).get(url).set(env.X_ACCESS_TOKEN, token)
  expect(store.body.scheduledReminders.pickup.status).toBe('sent')
  expect((await request(app).get(url).set(env.X_ACCESS_TOKEN, DRIVER1_TOKEN)).statusCode).toBe(403)
})

it('accepts one invoice request after settlement and records issuance only for the owning store', async () => {
  const { BookingStatus, HandoverStage } = bookcarsTypes
  const booking = await Booking.create({
    supplier: SUPPLIER_ID, driver: DRIVER1_ID, car: CAR1_ID,
    pickupLocation: LOCATION_ID, dropOffLocation: LOCATION_ID,
    status: BookingStatus.Reserved, from: new Date(Date.now() - 86_400_000), to: new Date(), price: 300,
  })
  const url = `/api/bookings/${booking._id}/invoice`
  const store = await testHelper.generateToken(SUPPLIER_ID)
  const anotherStore = await testHelper.createSupplier(testHelper.GetRandomEmail(), testHelper.getSupplierName())
  const otherToken = await testHelper.generateToken(anotherStore)
  const submit = (token: string, body: object) => request(app).post(url).set(env.X_ACCESS_TOKEN, token).send(body)
  try {
    expect((await submit(DRIVER1_TOKEN, { title: '示例公司' })).statusCode).toBe(409)
    await Booking.updateOne({ _id: booking._id }, { $set: {
      'handover.events': [{ stage: HandoverStage.Settled, at: new Date(), operator: SUPPLIER_ID }],
    } })
    expect((await submit(DRIVER1_TOKEN, { title: '示例公司', taxId: 'bad' })).statusCode).toBe(400)
    const results = await Promise.all([1, 2].map(() => submit(DRIVER1_TOKEN, { title: ' 示例公司 ', taxId: '123456789012345' })))
    expect(results.map((response) => response.statusCode).sort()).toEqual([200, 409])
    expect((await submit(otherToken, { reference: 'TEST-01' })).statusCode).toBe(404)
    expect((await submit(DRIVER1_TOKEN, { reference: 'TEST-01' })).statusCode).toBe(409)
    expect((await submit(store, { reference: 'TEST-01' })).statusCode).toBe(200)
    expect((await submit(store, { reference: 'TEST-02' })).statusCode).toBe(409)
    const response = await request(app).get(url).set(env.X_ACCESS_TOKEN, DRIVER1_TOKEN)
    expect(response.body.invoice).toMatchObject({ title: '示例公司', taxId: '123456789012345', reference: 'TEST-01' })
    expect((await Booking.findById(booking._id))?.invoice).toBeUndefined()
  } finally {
    await Booking.deleteOne({ _id: booking._id })
  }
})

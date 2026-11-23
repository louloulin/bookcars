import 'dotenv/config'
import { jest } from '@jest/globals'
import request from 'supertest'
import nodemailer from 'nodemailer'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import app from '../src/app'
import * as databaseHelper from '../src/utils/databaseHelper'
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

  const settings = await Setting.findOne({})
  initialSettings = (settings?.toObject() as unknown as bookcarsTypes.Setting) ?? null
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

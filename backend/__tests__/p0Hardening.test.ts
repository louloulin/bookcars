import 'dotenv/config'
import { jest } from '@jest/globals'
import request from 'supertest'
import nodemailer from 'nodemailer'
import path from 'node:path'
import url from 'node:url'
import asyncFs from 'node:fs/promises'
import { nanoid } from 'nanoid'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import app from '../src/app'
import * as databaseHelper from '../src/utils/databaseHelper'
import * as testHelper from './testHelper'
import * as helper from '../src/utils/helper'
import * as env from '../src/config/env.config'
import Booking from '../src/models/Booking'
import Car from '../src/models/Car'
import Location from '../src/models/Location'
import User from '../src/models/User'
import stripeAPI from '../src/payment/stripe'

const testTransporter = nodemailer.createTransport({ jsonTransport: true })

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LICENSE = 'contract1.pdf'
const LICENSE_PATH = path.join(__dirname, `./contracts/${LICENSE}`)

let SUPPLIER_ID: string
let DRIVER1_ID: string
let DRIVER1_TOKEN: string
let LOCATION_ID: string
let CAR1_ID: string

//
// Connecting and initializing the database before running the test suite
//
beforeAll(async () => {
  jest.spyOn(nodemailer, 'createTransport').mockReturnValue(testTransporter)
  jest.spyOn(testTransporter, 'sendMail')

  testHelper.initializeLogger()

  await databaseHelper.connect(env.DB_URI, false, false)

  await testHelper.initialize()

  SUPPLIER_ID = await testHelper.createSupplier(`${testHelper.getSupplierName()}@test.bookcars.ma`, testHelper.getSupplierName())

  const driver1 = new User({
    fullName: 'driver1',
    email: testHelper.GetRandomEmail(),
    language: testHelper.LANGUAGE,
    type: bookcarsTypes.UserType.User,
  })
  await driver1.save()
  DRIVER1_ID = driver1._id.toString()
  DRIVER1_TOKEN = await testHelper.generateToken(DRIVER1_ID)

  LOCATION_ID = await testHelper.createLocation('Location 1 EN', 'Location 1 FR')

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
})

afterAll(async () => {
  await testHelper.close()

  await testHelper.deleteSupplier(SUPPLIER_ID)
  await testHelper.deleteLocation(LOCATION_ID)
  await Car.deleteMany({ _id: CAR1_ID })
  await User.deleteMany({ _id: DRIVER1_ID })
  await Booking.deleteMany({ driver: DRIVER1_ID })
})

const buildCheckoutPayload = (paymentIntentId: string, customerId: string, price: number) => {
  const from = new Date(2025, 8, 1)
  const to = new Date(2025, 8, 4)

  const payload: bookcarsTypes.CheckoutPayload = {
    booking: {
      supplier: SUPPLIER_ID,
      car: CAR1_ID,
      driver: DRIVER1_ID,
      pickupLocation: LOCATION_ID,
      dropOffLocation: LOCATION_ID,
      from,
      to,
      status: bookcarsTypes.BookingStatus.Pending,
      cancellation: false,
      amendments: false,
      theftProtection: false,
      collisionDamageWaiver: false,
      fullInsurance: false,
      price,
      additionalDriver: false,
    },
    payLater: false,
    paymentIntentId,
    customerId,
  }

  return payload
}

describe('P0 hardening: payment consistency', () => {
  it('should not mark a booking as paid when the payment capture fails', async () => {
    const from = new Date(2025, 8, 1)
    const to = new Date(2025, 8, 4)
    const car = await Car.findById(CAR1_ID)
    const expectedBasePrice = bookcarsHelper.calculateTotalPrice(
      car!.toObject() as unknown as bookcarsTypes.Car,
      from,
      to,
      0,
      {
        cancellation: false,
        amendments: false,
        theftProtection: false,
        collisionDamageWaiver: false,
        fullInsurance: false,
        additionalDriver: false,
      }
    )

    const paymentIntentId = `pi_test_${nanoid()}`
    const customerId = `cus_test_${nanoid()}`
    const retrieveSpy = jest.spyOn(stripeAPI.paymentIntents, 'retrieve').mockResolvedValue({
      id: paymentIntentId,
      status: 'requires_capture',
      amount: helper.toCents(expectedBasePrice),
      currency: env.BASE_CURRENCY.toLowerCase(),
      customer: customerId,
    } as never)
    const captureSpy = jest.spyOn(stripeAPI.paymentIntents, 'capture').mockRejectedValue(new Error('capture failed'))

    try {
      const res = await request(app)
        .post('/api/checkout')
        .set(env.X_ACCESS_TOKEN, DRIVER1_TOKEN)
        .send(buildCheckoutPayload(paymentIntentId, customerId, expectedBasePrice))

      expect(res.statusCode).toBe(500)

      const booking = await Booking.findOne({ paymentIntentId })

      // The booking is stored as a pending reservation, it is never
      // reported as paid when the money was not collected
      expect(booking).toBeTruthy()
      expect(booking?.status).toBe(bookcarsTypes.BookingStatus.Void)
      expect(booking?.expireAt).toBeTruthy()
      expect(booking?.paidAmount).toBe(0)
    } finally {
      retrieveSpy.mockRestore()
      captureSpy.mockRestore()
      // The pending reservation holds the car until it expires, it is
      // removed here so the next test starts with a free car
      await Booking.deleteMany({ paymentIntentId })
    }
  })

  it('should recover a pending booking when the customer retries the payment', async () => {
    const from = new Date(2025, 8, 1)
    const to = new Date(2025, 8, 4)
    const car = await Car.findById(CAR1_ID)
    const expectedBasePrice = bookcarsHelper.calculateTotalPrice(
      car!.toObject() as unknown as bookcarsTypes.Car,
      from,
      to,
      0,
      {
        cancellation: false,
        amendments: false,
        theftProtection: false,
        collisionDamageWaiver: false,
        fullInsurance: false,
        additionalDriver: false,
      }
    )

    const paymentIntentId = `pi_test_${nanoid()}`
    const customerId = `cus_test_${nanoid()}`
    const retrieveSpy = jest.spyOn(stripeAPI.paymentIntents, 'retrieve').mockResolvedValue({
      id: paymentIntentId,
      status: 'requires_capture',
      amount: helper.toCents(expectedBasePrice),
      currency: env.BASE_CURRENCY.toLowerCase(),
      customer: customerId,
    } as never)
    const captureSpy = jest.spyOn(stripeAPI.paymentIntents, 'capture')
      .mockRejectedValueOnce(new Error('capture failed'))
      .mockResolvedValueOnce({
        id: paymentIntentId,
        status: 'succeeded',
        amount: helper.toCents(expectedBasePrice),
      } as never)

    try {
      const payload = buildCheckoutPayload(paymentIntentId, customerId, expectedBasePrice)

      const first = await request(app)
        .post('/api/checkout')
        .set(env.X_ACCESS_TOKEN, DRIVER1_TOKEN)
        .send(payload)

      expect(first.statusCode).toBe(500)

      // The customer retries the checkout with the same payment intent
      const second = await request(app)
        .post('/api/checkout')
        .set(env.X_ACCESS_TOKEN, DRIVER1_TOKEN)
        .send(payload)

      expect(second.statusCode).toBe(200)
      expect(second.body.bookingId).toBeTruthy()

      const booking = await Booking.findOne({ paymentIntentId })

      expect(booking?.status).toBe(bookcarsTypes.BookingStatus.Paid)
      expect(booking?.paidAmount).toBeGreaterThan(0)
      expect(booking?.expireAt).toBeFalsy()
    } finally {
      retrieveSpy.mockRestore()
      captureSpy.mockRestore()
    }
  })

  it('should refuse a payment intent that belongs to a cancelled booking', async () => {
    const paymentIntentId = `pi_test_${nanoid()}`
    const customerId = `cus_test_${nanoid()}`

    const booking = new Booking({
      supplier: SUPPLIER_ID,
      car: CAR1_ID,
      driver: DRIVER1_ID,
      pickupLocation: LOCATION_ID,
      dropOffLocation: LOCATION_ID,
      from: new Date(2025, 8, 1),
      to: new Date(2025, 8, 4),
      status: bookcarsTypes.BookingStatus.Cancelled,
      price: 100,
      paymentIntentId,
    })
    await booking.save()

    try {
      const res = await request(app)
        .post('/api/checkout')
        .set(env.X_ACCESS_TOKEN, DRIVER1_TOKEN)
        .send(buildCheckoutPayload(paymentIntentId, customerId, 100))

      expect(res.statusCode).toBe(400)
      expect(res.text).toContain('has already been used')
    } finally {
      await booking.deleteOne()
    }
  })
})

describe('P0 hardening: personal documents', () => {
  it('should not serve the licence documents from the public CDN', async () => {
    const fileName = `${DRIVER1_ID}.pdf`
    const filePath = path.join(env.CDN_LICENSES, fileName)

    await helper.mkdir(env.CDN_LICENSES)
    await asyncFs.copyFile(LICENSE_PATH, filePath)

    try {
      const res = await request(app).get(`/cdn/bookcars/licenses/${fileName}`)

      expect(res.statusCode).toBe(403)
    } finally {
      if (await helper.pathExists(filePath)) {
        await asyncFs.unlink(filePath)
      }
    }
  })

  it('should only allow the owner or an admin to download a licence', async () => {
    const fileName = `${DRIVER1_ID}.pdf`
    const filePath = path.join(env.CDN_LICENSES, fileName)

    await helper.mkdir(env.CDN_LICENSES)
    await asyncFs.copyFile(LICENSE_PATH, filePath)

    const driver = await User.findById(DRIVER1_ID)
    driver!.license = fileName
    await driver!.save()

    try {
      // No token
      const anonymous = await request(app).get(`/api/download-license/${DRIVER1_ID}`)
      expect(anonymous.statusCode).toBe(403)

      // The owner
      const owner = await request(app)
        .get(`/api/download-license/${DRIVER1_ID}`)
        .set(env.X_ACCESS_TOKEN, DRIVER1_TOKEN)
      expect(owner.statusCode).toBe(200)

      // Another customer
      const other = new User({
        fullName: 'other driver',
        email: testHelper.GetRandomEmail(),
        language: testHelper.LANGUAGE,
        type: bookcarsTypes.UserType.User,
      })
      await other.save()
      const otherToken = await testHelper.generateToken(other._id.toString())

      const otherRes = await request(app)
        .get(`/api/download-license/${DRIVER1_ID}`)
        .set(env.X_ACCESS_TOKEN, otherToken)
      expect(otherRes.statusCode).toBe(403)

      await other.deleteOne()
    } finally {
      driver!.license = undefined
      await driver!.save()
      if (await helper.pathExists(filePath)) {
        await asyncFs.unlink(filePath)
      }
    }
  })
})

describe('P0 hardening: dashboard access and revenue', () => {
  it('should refuse the dashboard to a customer', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set(env.X_ACCESS_TOKEN, DRIVER1_TOKEN)

    expect(res.statusCode).toBe(403)
  })

  it('should count the collected amount and not the rental price', async () => {
    const adminToken = await testHelper.generateToken(testHelper.getAdminUserId())

    const before = await request(app)
      .get('/api/dashboard/stats')
      .set(env.X_ACCESS_TOKEN, adminToken)

    const booking = new Booking({
      supplier: SUPPLIER_ID,
      car: CAR1_ID,
      driver: DRIVER1_ID,
      pickupLocation: LOCATION_ID,
      dropOffLocation: LOCATION_ID,
      from: new Date(2025, 8, 1),
      to: new Date(2025, 8, 4),
      status: bookcarsTypes.BookingStatus.Deposit,
      price: 1000,
      paidAmount: 250,
    })
    await booking.save()

    try {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set(env.X_ACCESS_TOKEN, adminToken)

      expect(res.statusCode).toBe(200)
      // The deposit booking contributes the collected amount (250), not the
      // rental price (1000)
      expect(res.body.totalRevenue - before.body.totalRevenue).toBe(250)
    } finally {
      await booking.deleteOne()
    }
  })

  it('should not count a reserved (unpaid) booking as revenue', async () => {
    const adminToken = await testHelper.generateToken(testHelper.getAdminUserId())

    const before = await request(app)
      .get('/api/dashboard/stats')
      .set(env.X_ACCESS_TOKEN, adminToken)

    const booking = new Booking({
      supplier: SUPPLIER_ID,
      car: CAR1_ID,
      driver: DRIVER1_ID,
      pickupLocation: LOCATION_ID,
      dropOffLocation: LOCATION_ID,
      from: new Date(2025, 8, 1),
      to: new Date(2025, 8, 4),
      status: bookcarsTypes.BookingStatus.Reserved,
      price: 5000,
    })
    await booking.save()

    try {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set(env.X_ACCESS_TOKEN, adminToken)

      expect(res.statusCode).toBe(200)
      expect(res.body.totalRevenue - before.body.totalRevenue).toBe(0)
    } finally {
      await booking.deleteOne()
    }
  })
})

describe('P0 hardening: stripe webhook', () => {
  it('should refuse the webhook when no signing secret is configured', async () => {
    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', 't=1,v1=abc')
      .send({ type: 'payment_intent.succeeded' })

    expect(res.statusCode).toBe(501)
  })
})

describe('P0 hardening: phone validation', () => {
  const createUserWithPhone = async (phone: string) => {
    const user = new User({
      fullName: 'phone tester',
      email: testHelper.GetRandomEmail(),
      language: testHelper.LANGUAGE,
      type: bookcarsTypes.UserType.User,
      phone,
    })

    try {
      await user.save()

      return true
    } catch {
      return false
    } finally {
      await User.deleteOne({ _id: user._id })
    }
  }

  it('should accept a Chinese mobile number', async () => {
    expect(await createUserWithPhone('+8613912345678')).toBe(true)
  })

  it('should accept a foreign mobile number', async () => {
    expect(await createUserWithPhone('+447911123456')).toBe(true)
    expect(await createUserWithPhone('+33612345678')).toBe(true)
  })

  it('should reject an invalid number', async () => {
    expect(await createUserWithPhone('09090909')).toBe(false)
    expect(await createUserWithPhone('unknown')).toBe(false)
    expect(await createUserWithPhone('+861391234')).toBe(false)
  })
})

describe('P1: location model for the Chinese market', () => {
  it('should store the address, the opening hours and the pick-up instructions', async () => {
    const location = await Location.findById(LOCATION_ID)

    location!.address = 'No. 1 Century Avenue, Pudong, Shanghai'
    location!.businessHours = '09:00 - 21:00'
    location!.adcode = '310115'
    location!.pickupInstructions = 'Meet the agent at the parking level 2.'
    location!.acceptCards = ['UnionPay', 'Mastercard']
    location!.timezone = 'Asia/Shanghai'
    await location!.save()

    const reloaded = await Location.findById(LOCATION_ID)

    expect(reloaded!.address).toBe('No. 1 Century Avenue, Pudong, Shanghai')
    expect(reloaded!.businessHours).toBe('09:00 - 21:00')
    expect(reloaded!.adcode).toBe('310115')
    expect(reloaded!.pickupInstructions).toBe('Meet the agent at the parking level 2.')
    expect(reloaded!.acceptCards).toEqual(['UnionPay', 'Mastercard'])
    expect(reloaded!.timezone).toBe('Asia/Shanghai')
  })
})

import { Schema, model } from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'
import * as env from '../config/env.config'

export const BOOKING_EXPIRE_AT_INDEX_NAME = 'expireAt'

const reminderEntry = new Schema({
  status: { type: String, enum: ['sending', 'sent', 'failed'], required: true },
  at: { type: Date, required: true },
}, { _id: false })

const bookingSchema = new Schema<env.Booking>(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'User',
      index: true,
    },
    car: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'Car',
    },
    driver: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'User',
      index: true,
    },
    pickupLocation: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'Location',
    },
    dropOffLocation: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'Location',
    },
    from: {
      type: Date,
      required: [true, "can't be blank"],
    },
    to: {
      type: Date,
      required: [true, "can't be blank"],
    },
    status: {
      type: String,
      enum: [
        bookcarsTypes.BookingStatus.Void,
        bookcarsTypes.BookingStatus.Pending,
        bookcarsTypes.BookingStatus.Deposit,
        bookcarsTypes.BookingStatus.Paid,
        bookcarsTypes.BookingStatus.PaidInFull,
        bookcarsTypes.BookingStatus.Reserved,
        bookcarsTypes.BookingStatus.Cancelled,
      ],
      required: [true, "can't be blank"],
    },
    cancellation: {
      type: Boolean,
      default: false,
    },
    amendments: {
      type: Boolean,
      default: false,
    },
    theftProtection: {
      type: Boolean,
      default: false,
    },
    collisionDamageWaiver: {
      type: Boolean,
      default: false,
    },
    fullInsurance: {
      type: Boolean,
      default: false,
    },
    additionalDriver: {
      type: Boolean,
      default: false,
    },
    _additionalDriver: {
      type: Schema.Types.ObjectId,
      ref: 'AdditionalDriver',
    },
    price: {
      type: Number,
      required: [true, "can't be blank"],
    },
    //
    // The amount that was actually charged for this booking.
    //
    // `price` is the rental price, while the charged amount depends on the
    // payment option (deposit only, or rental price + deposit) and on the
    // supplier price change rate. It is stored so that the revenue reports
    // never have to infer it.
    //
    paidAmount: {
      type: Number,
      default: 0,
    },
    //
    // The fees of the Chinese market (night service, one way) that were
    // added to the rental price when the booking was created.
    //
    fees: {
      type: new Schema(
        {
          items: {
            type: [
              new Schema(
                {
                  code: {
                    type: String,
                    required: true,
                  },
                  amount: {
                    type: Number,
                    required: true,
                  },
                },
                { _id: false }
              ),
            ],
            default: [],
          },
          total: {
            type: Number,
            default: 0,
          },
        },
        { _id: false }
      ),
      default: undefined,
    },
    invoice: {
      type: new Schema({
        title: { type: String, required: true, maxlength: 160 },
        taxId: { type: String, maxlength: 20 },
        requestedAt: { type: Date, required: true },
        issuedAt: Date,
        reference: { type: String, maxlength: 64 },
      }, { _id: false }),
      select: false,
    },
    scheduledReminders: {
      type: new Schema({ pickup: reminderEntry, return: reminderEntry, overdue: reminderEntry }, { _id: false }),
      select: false,
    },
    handover: {
      type: new Schema({
        events: [new Schema({
          stage: { type: String, enum: Object.values(bookcarsTypes.HandoverStage), required: true },
          at: { type: Date, required: true },
          operator: { type: String, required: true },
          odometer: Number,
          fuelPercent: Number,
          condition: String,
          contractVersion: String,
          documentsVerified: Boolean,
          returnFeeReceipt: new Schema({
            method: { type: String, enum: Object.values(bookcarsTypes.ReturnFeePaymentMethod), required: true },
            reference: { type: String, required: true, maxlength: 64 },
            amount: { type: Number, required: true, min: 0 },
            currency: { type: String, required: true },
          }, { _id: false }),
        }, { _id: false })],
        fees: new Schema({
          items: [new Schema({ code: String, amount: Number }, { _id: false })],
          total: Number,
        }, { _id: false }),
        currency: String,
      }, { _id: false }),
      select: false,
    },
    cancelRequest: {
      type: Boolean,
      default: false,
    },
    sessionId: {
      type: String,
      index: true,
    },
    paymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    customerId: {
      type: String,
    },
    isDeposit: {
      type: Boolean,
      default: false,
    },
    isPayedInFull: {
      type: Boolean,
      default: false,
    },
    paypalOrderId: {
      type: String,
    },
    expireAt: {
      //
      // Bookings created from checkout with Stripe are temporary and
      // are automatically deleted if the payment checkout session expires.
      //
      type: Date,
      index: { name: BOOKING_EXPIRE_AT_INDEX_NAME, expireAfterSeconds: env.BOOKING_EXPIRE_AT, background: true },
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'Booking',
  },
)

// Common filter for every query
bookingSchema.index({ 'supplier._id': 1, status: 1, expireAt: 1 })

// Optional filters (can combine with the above depending on frequency)
bookingSchema.index({ 'driver._id': 1 })
bookingSchema.index({ 'car._id': 1 })
bookingSchema.index({ from: 1, to: 1 }) // For date range filtering
bookingSchema.index({ 'pickupLocation._id': 1 })
bookingSchema.index({ 'dropOffLocation._id': 1 })

// If keyword is used often with regex, and performance is an issue:
bookingSchema.index({ 'supplier.fullName': 1 }) // Consider text index if full-text search is needed
bookingSchema.index({ 'driver.fullName': 1 })
bookingSchema.index({ 'car.name': 1 })

const Booking = model<env.Booking>('Booking', bookingSchema)

export default Booking

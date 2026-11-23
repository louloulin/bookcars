import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const locationSchema = new Schema<env.Location>(
  {
    country: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'Country',
      index: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    values: {
      type: [Schema.Types.ObjectId],
      ref: 'LocationValue',
      required: [true, "can't be blank"],
      validate: (value: any): boolean => Array.isArray(value),
    },
    image: {
      type: String,
    },
    parkingSpots: {
      type: [Schema.Types.ObjectId],
      ref: 'ParkingSpot',
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    parentLocation: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
    },
    address: {
      type: String,
      trim: true,
    },
    businessHours: {
      type: String,
      trim: true,
    },
    // The administrative district code of the location, it is filled by the
    // map service (e.g. `310115` for Shanghai) and is used for the city
    // based pricing and for the store filtering.
    adcode: {
      type: String,
      trim: true,
    },
    // The instructions the customer receives for the vehicle handover.
    pickupInstructions: {
      type: String,
      trim: true,
    },
    // The payment cards the store accepts on site (e.g. `UnionPay`,
    // `Mastercard`, `WeChat Pay`, `Alipay`).
    acceptCards: {
      type: [String],
      default: [],
    },
    // The IANA timezone of the store, all the business hours of the
    // location are interpreted in this timezone.
    timezone: {
      type: String,
      trim: true,
      default: 'Asia/Shanghai',
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'Location',
  },
)

// Add custom indexes
locationSchema.index({ values: 1 })

const Location = model<env.Location>('Location', locationSchema)

export default Location

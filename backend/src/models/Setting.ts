import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const settingSchema = new Schema<env.Setting>({
  minPickupHours: {
    type: Number,
    default: 1,
    min: 1,
  },
  minRentalHours: {
    type: Number,
    default: 1,
    min: 1,
  },
  minPickupDropoffHour: {
    type: Number,
    default: 0,
    min: 0,
    max: 23,
  },
  maxPickupDropoffHour: {
    type: Number,
    default: 23,
    min: 0,
    max: 23,
  },
  // Chinese market fees
  nightServiceFee: {
    type: Number,
    default: 0,
    min: 0,
  },
  nightServiceStartHour: {
    type: Number,
    default: 22,
    min: 0,
    max: 23,
  },
  nightServiceEndHour: {
    type: Number,
    default: 6,
    min: 0,
    max: 23,
  },
  oneWayFee: {
    type: Number,
    default: 0,
    min: 0,
  },
  overtimeFee: {
    type: Number,
    default: 0,
    min: 0,
  },
  overtimeFreeHours: {
    type: Number,
    default: 0,
    min: 0,
  },
  mileageFee: {
    type: Number,
    default: 0,
    min: 0,
  },
  //
  // The booking rules of the store (minimum duration, minimum lead time and
  // the opening hours of the pick-up point) are enforced on the server when
  // this flag is enabled.
  //
  enforceBookingRules: {
    type: Boolean,
    default: false,
  },
  mileageIncluded: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
  strict: true,
  collection: 'Setting',
})

const Setting = model<env.Setting>('Setting', settingSchema)

export default Setting

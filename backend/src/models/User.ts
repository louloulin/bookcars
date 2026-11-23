import validator from 'validator'
import { Schema, model } from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import * as env from '../config/env.config'

export const USER_EXPIRE_AT_INDEX_NAME = 'expireAt'

const userSchema = new Schema<env.User>(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "can't be blank"],
      validate: [validator.isEmail, 'is not valid'],
      index: true,
      trim: true,
    },
    phone: {
      type: String,
      set: (value: string) => {
        const trimmed = (value || '').trim()

        if (!trimmed) {
          return trimmed
        }

        const normalized = bookcarsHelper.normalizePhoneNumber(trimmed)

        // A value that holds no digit at all is invalid: it is kept as it
        // is so the validator can reject it instead of storing an empty
        // phone number
        return normalized || trimmed
      },
      validate: {
        validator: (value: string) => {
          // Check if value is empty then return true.
          if (!value) {
            return true
          }

          // An international number is validated against the pattern of
          // its country, a national number against the default country
          return bookcarsHelper.isValidPhoneNumber(value)
        },
        message: '{VALUE} is not valid',
      },
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
    },
    birthDate: {
      type: Date,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    active: {
      type: Boolean,
      default: false,
    },
    language: {
      // ISO 639-1 (alpha-2 code)
      type: String,
      default: env.DEFAULT_LANGUAGE,
      lowercase: true,
      minlength: 2,
      maxlength: 2,
    },
    enableEmailNotifications: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
    },
    bio: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        bookcarsTypes.UserType.Admin,
        bookcarsTypes.UserType.Supplier,
        bookcarsTypes.UserType.User,
      ],
      default: bookcarsTypes.UserType.User,
    },
    blacklisted: {
      type: Boolean,
      default: false,
    },
    payLater: {
      type: Boolean,
      default: true,
    },
    customerId: {
      type: String,
    },
    contracts: [{
      language: {
        type: String,
        required: [true, "can't be blank"],
        trim: true,
        lowercase: true,
        minLength: 2,
        maxLength: 2,
      },
      file: String,
    }],
    licenseRequired: {
      type: Boolean,
      default: false,
    },
    license: {
      type: String,
    },
    minimumRentalDays: {
      type: Number,
    },
    priceChangeRate: {
      type: Number,
    },
    supplierCarLimit: {
      type: Number,
    },
    notifyAdminOnNewCar: {
      type: Boolean,
    },
    expireAt: {
      //
      // Non verified and active users created from checkout with Stripe are temporary and
      // are automatically deleted if the payment checkout session expires.
      //
      type: Date,
      index: { name: USER_EXPIRE_AT_INDEX_NAME, expireAfterSeconds: env.USER_EXPIRE_AT, background: true },
    },
    isSocial: {
      //
      // Indicates whether the user account was created via social login
      // (e.g., Google, Facebook, Apple OAuth) rather than password credentials.
      //
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'User',
  },
)

// Add custom indexes
userSchema.index({ type: 1, expireAt: 1, fullName: 1 })
userSchema.index({ type: 1, expireAt: 1, email: 1 })
userSchema.index({ type: 1, expireAt: 1, fullName: 1, _id: 1 })
userSchema.index({ type: 1, expireAt: 1, email: 1, _id: 1 })

const User = model<env.User>('User', userSchema)

export default User

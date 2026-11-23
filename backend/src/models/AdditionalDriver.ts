import validator from 'validator'
import { Schema, model } from 'mongoose'
import * as bookcarsHelper from ':bookcars-helper'
import * as env from '../config/env.config'

const additionalDriverSchema = new Schema<env.AdditionalDriver>(
  {
    fullName: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
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

        return normalized || trimmed
      },
      validate: {
        validator: (value: string) => {
          // Check if value is empty then return false.
          if (!value) {
            return false
          }

          // An international number is validated against the pattern of
          // its country, a national number against the default country
          return bookcarsHelper.isValidPhoneNumber(value)
        },
        message: '{VALUE} is not valid',
      },
      trim: true,
    },
    birthDate: {
      type: Date,
      required: [true, "can't be blank"],
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'AdditionalDriver',
  },
)

const AdditionalDriver = model<env.AdditionalDriver>('AdditionalDriver', additionalDriverSchema)

export default AdditionalDriver

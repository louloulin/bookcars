import React, { useEffect, useState } from 'react'
import {
  MenuItem,
  OutlinedInput,
  Select,
} from '@mui/material'
import * as bookcarsHelper from ':bookcars-helper'

interface PhoneInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: boolean
  helperText?: string
  required?: boolean
  autoComplete?: string
}

/**
 * Phone number input with a country dialing code selector.
 *
 * The value that is emitted is always the international format
 * (`+<country code><number>`), so it is unambiguous for the customer
 * service and for the notifications.
 */
const PhoneInput = ({
  label,
  value,
  onChange,
  error,
  helperText,
  required,
  autoComplete,
}: PhoneInputProps) => {
  const [country, setCountry] = useState(bookcarsHelper.DEFAULT_PHONE_COUNTRY)
  const [nationalNumber, setNationalNumber] = useState('')

  useEffect(() => {
    const digits = (value || '').replace(/\D/g, '')

    if (!digits) {
      setNationalNumber('')
      return
    }

    const detected = bookcarsHelper.findPhoneCountry(value)

    if (detected && (value || '').trim().startsWith('+')) {
      setCountry(detected.code)
      setNationalNumber(digits.slice(detected.dial.length - 1))
      return
    }

    setNationalNumber(digits)
  }, [value])

  const emit = (nextNationalNumber: string, nextCountry: string = country) => {
    const info = bookcarsHelper.PHONE_COUNTRIES.find((item) => item.code === nextCountry)
      || bookcarsHelper.PHONE_COUNTRIES[0]
    const digits = nextNationalNumber.replace(/\D/g, '')

    onChange(digits ? `${info.dial}${digits}` : '')
  }

  return (
    <div className="phone-input-wrapper">
      <div className="phone-input">
        <Select
          className="phone-input-country"
          value={country}
          onChange={(event) => {
            const nextCountry = event.target.value as string
            setCountry(nextCountry)
            emit(nationalNumber, nextCountry)
          }}
          input={<OutlinedInput />}
        >
          {bookcarsHelper.PHONE_COUNTRIES.map((item) => (
            <MenuItem key={item.code} value={item.code}>
              {`${item.dial} ${item.name}`}
            </MenuItem>
          ))}
        </Select>
        <OutlinedInput
          className="phone-input-number"
          type="tel"
          value={nationalNumber}
          error={!!error}
          onChange={(event) => {
            setNationalNumber(event.target.value)
            emit(event.target.value)
          }}
          onBlur={() => emit(nationalNumber)}
          label={label}
          autoComplete={autoComplete || 'tel'}
          required={required}
        />
      </div>
      {helperText && (
        <div className="phone-input-helper">{helperText}</div>
      )}
    </div>
  )
}

export default PhoneInput

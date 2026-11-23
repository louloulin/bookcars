import * as bookcarsTypes from ':bookcars-types'
import CurrencyConverter, { currencies } from ':currency-converter'

/**
 * Format a number.
 *
 * @export
 * @param {number} x
 * @param {string} language ISO 639-1 language code
 * @returns {string}
 */
export const formatNumber = (x: number, language: string): string => {
  const parts: string[] = String(x % 1 !== 0 ? x.toFixed(2) : x).split('.')
  const separator = language === 'en' ? ',' : ' '
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  return parts.join('.')
}

/**
 * Format a Date number to two digits.
 *
 * @export
 * @param {number} n
 * @returns {string}
 */
export const formatDatePart = (n: number): string => {
  return n > 9 ? String(n) : '0' + n
}

/**
 * Capitalize a string.
 *
 * @export
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Check if a value is a Date.
 *
 * @export
 * @param {?*} [value]
 * @returns {boolean}
 */
export const isDate = (value?: any): boolean => {
  return value instanceof Date && !Number.isNaN(value.valueOf())
}

/**
 * Join two url parts.
 *
 * @param {?string} [part1]
 * @param {?string} [part2]
 * @returns {string}
 */
export const joinURL = (part1?: string, part2?: string) => {
  if (!part1 || !part2) {
    const msg = '[joinURL] part undefined'
    console.log(msg)
    throw new Error(msg)
  }

  if (part1.charAt(part1.length - 1) === '/') {
    part1 = part1.substring(0, part1.length - 1)
  }
  if (part2.charAt(0) === '/') {
    part2 = part2.substring(1)
  }
  return part1 + '/' + part2
}

/**
 * Check if a string is an integer.
 *
 * @param {string} val
 * @returns {boolean}
 */
export const isInteger = (val: string) => {
  return /^\d+$/.test(val)
}

/**
 * Check if a string is a year.
 *
 * @param {string} val
 * @returns {boolean}
 */
export const isYear = (val: string) => {
  return /^\d{2}$/.test(val)
}

/**
 * Check if a string is a CVV.
 *
 * @param {string} val
 * @returns {boolean}
 */
export const isCvv = (val: string) => {
  return /^\d{3,4}$/.test(val)
}

/**
 * Check if two arrays are equal.
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
export const arrayEqual = (a: any, b: any) => {
  if (a === b) {
    return true
  }
  if (a == null || b == null) {
    return false
  }
  if (a.length !== b.length) {
    return false
  }

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false
    }
  }
  return true
}

/**
 * Clone an object or array.
 *
 * @param {*} obj
 * @returns {*}
 */
export const clone = (obj: any) => {
  return Array.isArray(obj) ? Array.from(obj) : Object.assign({}, obj)
}

/**
 * Clone an array.
 *
 * @export
 * @template T
 * @param {T[]} arr
 * @returns {(T[] | undefined | null)}
 */
export const cloneArray = <T>(arr: T[]): T[] | undefined | null => {
  if (typeof arr === 'undefined') {
    return undefined
  }
  if (arr == null) {
    return null
  }
  return [...arr]
}

/**
 * Check if two filters are equal.
 *
 * @param {?(bookcarsTypes.Filter | null)} [a]
 * @param {?(bookcarsTypes.Filter | null)} [b]
 * @returns {boolean}
 */
export const filterEqual = (a?: bookcarsTypes.Filter | null, b?: bookcarsTypes.Filter | null) => {
  if (a === b) {
    return true
  }
  if (a == null || b == null) {
    return false
  }

  if (a.from !== b.from) {
    return false
  }
  if (a.to !== b.to) {
    return false
  }
  if (a.pickupLocation !== b.pickupLocation) {
    return false
  }
  if (a.dropOffLocation !== b.dropOffLocation) {
    return false
  }
  if (a.keyword !== b.keyword) {
    return false
  }

  return true
}

/**
 * Flatten Supplier array.
 *
 * @param {bookcarsTypes.User[]} suppliers
 * @returns {string[]}
 */
export const flattenSuppliers = (suppliers: bookcarsTypes.User[]): string[] =>
  suppliers.map((supplier) => supplier._id ?? '')

/**
 * Get number of days between two dates.
 * Rounded so that a daylight saving time change (a 23 or 25 hour day) does not add or drop a day.
 *
 * @param {?Date} [from]
 * @param {?Date} [to]
 * @returns {number}
 */
export const days = (from?: Date, to?: Date) =>
  (from && to && Math.round((to.getTime() - from.getTime()) / (1000 * 3600 * 24))) || 0

/**
 * Get number of hours between two dates.
 * Rounded on full-day boundaries so that a daylight saving time change (a 23 or 25 hour day) does not add or drop an hour.
 *
 * @param {?Date} [from] 
 * @param {?Date} [to] 
 * @returns {number} 
 */
export const hours = (from?: Date, to?: Date): number => {
  if (!from || !to) {
    return 0
  }
  const ms = to.getTime() - from.getTime()
  const hrs = ms / (1000 * 60 * 60)
  // Round to avoid DST +/- 1 hour drift on full-day boundaries
  const roundedDays = Math.round(hrs / 24)
  const actualHours = Math.round(hrs)
  if (Math.abs(actualHours - roundedDays * 24) <= 1) {
    return roundedDays * 24
  }
  return Math.ceil(hrs)
}

/**
 * Check if currency is written from right to left.
 *
 * @returns {*}
 */
export const currencyRTL = (currencySymbol: string) => {
  const isRTL = ['$', '£'].includes(currencySymbol)
  return isRTL
}

/**
 * Format price
 *
 * @param {number} price
 * @param {string} currency
 * @param {string} language ISO 639-1 language code
 * @returns {boolean}
 */
export const formatPrice = (price: number, currency: string, language: string) => {
  const formatedPrice = formatNumber(price, language)

  if (currencyRTL(currency)) {
    return `${currency}${formatedPrice}`
  }

  return `${formatedPrice} ${currency}`
}

/**
 * Calculate total price.
 *
 * @param {bookcarsTypes.Car} car
 * @param {Date} from
 * @param {Date} to
 * @param {number} priceChangeRate
 * @param {?bookcarsTypes.CarOptions} [options]
 * @returns {number}
 */
export const calculateTotalPrice = (car: bookcarsTypes.Car, from: Date, to: Date, priceChangeRate: number, options?: bookcarsTypes.CarOptions) => {
  let totalPrice = 0
  let totalDays = days(from, to)
  // Per-day options use the rounded day count from days(), as the option labels and the date-based branch do.
  const optionDays = days(from, to)

  if (car.isDateBasedPrice) {
    let currentDate = new Date(from)

    // Reset time to 00:00:00 before loop
    currentDate.setHours(0, 0, 0, 0)

    // Loop until the last day is reached
    let currentDay = 1
    while (currentDay <= totalDays) {
      let applicableRate = (car.discountedDailyPrice || car.dailyPrice)

      // Check if a custom rate applies
      for (const dateBasedPrice of car.dateBasedPrices) {
        // Ensure startDate and endDate are also normalized
        const _startDate = new Date(dateBasedPrice.startDate!)
        _startDate.setHours(0, 0, 0, 0)
        const _endDate = new Date(dateBasedPrice.endDate!)
        _endDate.setHours(0, 0, 0, 0)

        if (currentDate.getTime() >= _startDate.getTime() && currentDate.getTime() <= _endDate.getTime()) {
          applicableRate = Number(dateBasedPrice.dailyPrice)
          break
        }
      }

      totalPrice += applicableRate
      currentDate.setDate(currentDate.getDate() + 1)
      currentDate.setHours(0, 0, 0, 0) // Ensure time is reset
      currentDay += 1
    }
  } else {
    const totalHours = hours(from, to)
    totalDays = Math.floor(totalHours / 24)
    const remainingHours = totalHours % 24

    const dayRates: { days: number; price: number }[] = [
      { days: 1, price: car.discountedDailyPrice || car.dailyPrice },
    ]

    if (car.discountedBiWeeklyPrice || car.biWeeklyPrice) {
      dayRates.push({ days: 3, price: (car.discountedBiWeeklyPrice || car.biWeeklyPrice)! })
    }
    if (car.discountedWeeklyPrice || car.weeklyPrice) {
      dayRates.push({ days: 7, price: (car.discountedWeeklyPrice || car.weeklyPrice)! })
    }
    if (car.discountedMonthlyPrice || car.monthlyPrice) {
      dayRates.push({ days: 30, price: (car.discountedMonthlyPrice || car.monthlyPrice)! })
    }

    if (totalDays > 0) {
      // Allocate array up to totalDays + 1 to eliminate circular buffer corruption for long rentals
      const dp = new Array<number>(totalDays + 1).fill(Number.POSITIVE_INFINITY)
      dp[0] = 0

      for (let day = 1; day <= totalDays; day += 1) {
        for (const rate of dayRates) {
          if (day >= rate.days) {
            dp[day] = Math.min(dp[day], dp[day - rate.days] + rate.price)
          }
        }
      }

      totalPrice += dp[totalDays]
    }

    // Handle hours if less than a day OR leftover time
    if (totalDays === 0 || remainingHours > 0) {
      const hourlyRate = car.discountedHourlyPrice || car.hourlyPrice
      if (hourlyRate) {
        totalPrice += hourlyRate * remainingHours
      } else if (car.dailyPrice || car.discountedDailyPrice) {
        // fallback to daily rate if no hourly price
        totalPrice += (car.discountedDailyPrice || car.dailyPrice)
      }
    }
  }

  // add extra options
  if (options) {
    if (options.cancellation && car.cancellation > 0) {
      totalPrice += car.cancellation
    }
    if (options.amendments && car.amendments > 0) {
      totalPrice += car.amendments
    }
    if (options.theftProtection && car.theftProtection > 0) {
      totalPrice += car.theftProtection * optionDays
    }
    if (options.collisionDamageWaiver && car.collisionDamageWaiver > 0) {
      totalPrice += car.collisionDamageWaiver * optionDays
    }
    if (options.fullInsurance && car.fullInsurance > 0) {
      totalPrice += car.fullInsurance * optionDays
    }
    if (options.additionalDriver && car.additionalDriver > 0) {
      totalPrice += car.additionalDriver * optionDays
    }
  }

  // apply price change rate
  totalPrice += totalPrice * (priceChangeRate / 100)

  return Number(totalPrice.toFixed(2))
}

/**
 * Convert price from a given currency to another.
 *
 * @async
 * @param {number} amount
 * @param {string} from
 * @param {string} to
 * @returns {Promise<number>}
 */
export const convertPrice = async (amount: number, from: string, to: string): Promise<number> => {
  if (!checkCurrency(from)) {
    throw new Error(`Currency ${from} not supported`)
  }
  if (!checkCurrency(to)) {
    throw new Error(`Currency ${to} not supported`)
  }
  if (from === to) {
    return amount
  }
  const cc = new CurrencyConverter({ from, to, amount })
  const res = await cc.convert()
  return Number(res.toFixed(2))
}

/**
 * Check if currency is supported.
 *
 * @param {string} currency
 * @returns {boolean}
 */
export const checkCurrency = (currency: string) => currencies.findIndex((c) => c === currency) > -1

/**
 * Check whether language is french
 *
 * @param {string} language
 * @returns {boolean}
 */
export const isFrench = (language?: string) => language === 'fr'

/**
 * Return all car types.
 *
 * @returns {bookcarsTypes.CarType[]}
 */
export const getAllCarTypes = () => [
  bookcarsTypes.CarType.Diesel,
  bookcarsTypes.CarType.Gasoline,
  bookcarsTypes.CarType.Electric,
  bookcarsTypes.CarType.Hybrid,
  bookcarsTypes.CarType.PlugInHybrid,
  bookcarsTypes.CarType.Unknown
]

/**
 * Randomize (shuffle) an array.
 *
 * @param {any[]} array
 */
export const shuffle = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

/**
 * Return all user types.
 *
 * @returns {bookcarsTypes.UserType[]}
 */
export const getAllUserTypes = () => [
  bookcarsTypes.UserType.Admin,
  bookcarsTypes.UserType.Supplier,
  bookcarsTypes.UserType.User,
]

/**
 * Return all car ranges.
 *
 * @returns {bookcarsTypes.CarRange[]}
 */
export const getAllRanges = () => [
  bookcarsTypes.CarRange.Mini,
  bookcarsTypes.CarRange.Midi,
  bookcarsTypes.CarRange.Maxi,
  bookcarsTypes.CarRange.Scooter,
  bookcarsTypes.CarRange.Bus,
  bookcarsTypes.CarRange.Truck,
  bookcarsTypes.CarRange.Caravan,
]

/**
 * Return all multimedia types.
 *
 * @returns {bookcarsTypes.CarMultimedia[]}
 */
export const getAllMultimedias = () => [
  bookcarsTypes.CarMultimedia.Touchscreen,
  bookcarsTypes.CarMultimedia.Bluetooth,
  bookcarsTypes.CarMultimedia.AndroidAuto,
  bookcarsTypes.CarMultimedia.AppleCarPlay,
]

/**
 * Return all fuel policies.
 *
 * @returns {bookcarsTypes.FuelPolicy[]}
 */
export const getAllFuelPolicies = () => [
  bookcarsTypes.FuelPolicy.FreeTank,
  bookcarsTypes.FuelPolicy.LikeForLike,
  bookcarsTypes.FuelPolicy.FullToFull,
  bookcarsTypes.FuelPolicy.FullToEmpty,
]

/**
 * Return all statuses.
 *
 * @returns {bookcarsTypes.BookingStatus[]}
 */
export const getAllBookingStatuses = () => [
  bookcarsTypes.BookingStatus.Void,
  bookcarsTypes.BookingStatus.Pending,
  bookcarsTypes.BookingStatus.Deposit,
  bookcarsTypes.BookingStatus.Paid,
  bookcarsTypes.BookingStatus.PaidInFull,
  bookcarsTypes.BookingStatus.Reserved,
  bookcarsTypes.BookingStatus.Cancelled,
]

/**
 * Calculate distance between two points on map.
 *
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @param {('K' | 'M')} unit
 * @returns {number}
 */
export const distance = (lat1: number, lon1: number, lat2: number, lon2: number, unit: 'K' | 'M') => {
  const radlat1 = (Math.PI * lat1) / 180
  const radlat2 = (Math.PI * lat2) / 180
  const theta = lon1 - lon2
  const radtheta = (Math.PI * theta) / 180
  let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
  dist = Math.acos(dist)
  dist = (dist * 180) / Math.PI
  dist = dist * 60 * 1.1515
  if (unit === 'K') {
    dist *= 1.609344
  } else if (unit === 'M') {
    dist *= 0.8684
  }
  return dist
}

/**
 * Format distance in Km/m.
 *
 * @param {number} d distance
 * @param {string} language
 * @returns {string}
 */
export const formatDistance = (d: number, language: string): string => {
  if (d > 0) {
    if (d < 1) {
      d *= 1000
    }
    const parts: string[] = String(d % 1 !== 0 ? d.toFixed(2) : d).split('.')
    const separator = language === 'en' ? ',' : ' '
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    if (parts.length > 1 && parts[1] === '00') {
      parts.splice(1, 1)
    }
    return `${parts.join('.')} ${d < 1 ? 'm' : 'Km'}`
  }
  return ''
}

/**
 * Removes a start line terminator character from a string.
 *
 * @export
 * @param {string} str
 * @param {string} char
 * @returns {string}
 */
export const trimStart = (str: string, char: string): string => {
  let res = str
  while (res.charAt(0) === char) {
    res = res.substring(1, res.length)
  }
  return res
}

/**
 * Removes a leading and trailing line terminator character from a string.
 *
 * @export
 * @param {string} str
 * @param {string} char
 * @returns {string}
 */
export const trimEnd = (str: string, char: string): string => {
  let res = str
  while (res.charAt(res.length - 1) === char) {
    res = res.substring(0, res.length - 1)
  }
  return res
}

/**
 * Removes a stating, leading and trailing line terminator character from a string.
 *
 * @export
 * @param {string} str
 * @param {string} char
 * @returns {string}
 */
export const trim = (str: string, char: string): string => {
  let res = trimStart(str, char)
  res = trimEnd(res, char)
  return res
}

/**
 * Wait a certain time in milliseconds.
 *
 * @param {number} milliseconds
 * @returns {Promise<unknown>}
 */
export const delay = (milliseconds: number) => new Promise((resolve) => {
  setTimeout(resolve, milliseconds)
})

/**
 * Truncates a string.
 *
 * @param {string} str 
 * @param {number} maxLength 
 * @returns {string} 
 */
export const truncateString = (str: string, maxLength: number) => {
  if (str.length <= maxLength) {
    return str
  }

  if (maxLength >= 6) {
    return `${str.slice(0, maxLength - 3)}...`
  }

  return str.slice(0, maxLength)
}

/**
 * A country that can be used in a phone number.
 */
export interface PhoneCountry {
  /** ISO 3166-1 alpha-2 country code */
  code: string
  /** English country name */
  name: string
  /** International dialing code, e.g. `+86` */
  dial: string
  /** Pattern of the national (country code free) mobile number */
  pattern: RegExp
}

/**
 * The countries that are supported for phone numbers.
 *
 * The list covers the Chinese market and the main source markets of the
 * inbound travellers, so a guest can enter a phone number in the format
 * they know.
 */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: 'CN', name: 'China', dial: '+86', pattern: /^1[3-9]\d{9}$/ },
  { code: 'HK', name: 'Hong Kong SAR', dial: '+852', pattern: /^[569]\d{7}$/ },
  { code: 'MO', name: 'Macao SAR', dial: '+853', pattern: /^6\d{7}$/ },
  { code: 'TW', name: 'Taiwan', dial: '+886', pattern: /^9\d{8}$/ },
  { code: 'US', name: 'United States', dial: '+1', pattern: /^[2-9]\d{2}[2-9]\d{6}$/ },
  { code: 'CA', name: 'Canada', dial: '+1', pattern: /^[2-9]\d{2}[2-9]\d{6}$/ },
  { code: 'GB', name: 'United Kingdom', dial: '+44', pattern: /^7\d{9}$/ },
  { code: 'AU', name: 'Australia', dial: '+61', pattern: /^4\d{8}$/ },
  { code: 'NZ', name: 'New Zealand', dial: '+64', pattern: /^2\d{8,9}$/ },
  { code: 'JP', name: 'Japan', dial: '+81', pattern: /^(?:70|80|90)\d{8}$/ },
  { code: 'KR', name: 'South Korea', dial: '+82', pattern: /^1[0-26-9]\d{7,8}$/ },
  { code: 'SG', name: 'Singapore', dial: '+65', pattern: /^[89]\d{7}$/ },
  { code: 'MY', name: 'Malaysia', dial: '+60', pattern: /^1[0-46-9]\d{7,8}$/ },
  { code: 'TH', name: 'Thailand', dial: '+66', pattern: /^6\d{8}$/ },
  { code: 'VN', name: 'Vietnam', dial: '+84', pattern: /^(?:3\d|5[2-9]|7[0-9]|8[1-9]|9\d)\d{7}$/ },
  { code: 'ID', name: 'Indonesia', dial: '+62', pattern: /^8[1-9]\d{7,10}$/ },
  { code: 'PH', name: 'Philippines', dial: '+63', pattern: /^9\d{9}$/ },
  { code: 'IN', name: 'India', dial: '+91', pattern: /^[6-9]\d{9}$/ },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', pattern: /^5[024-68]\d{7}$/ },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', pattern: /^5[013-689]\d{7}$/ },
  { code: 'DE', name: 'Germany', dial: '+49', pattern: /^1[5-7]\d{8,11}$/ },
  { code: 'FR', name: 'France', dial: '+33', pattern: /^[67]\d{8}$/ },
  { code: 'IT', name: 'Italy', dial: '+39', pattern: /^3\d{9}$/ },
  { code: 'ES', name: 'Spain', dial: '+34', pattern: /^[67]\d{8}$/ },
  { code: 'NL', name: 'Netherlands', dial: '+31', pattern: /^6[1-9]\d{7}$/ },
  { code: 'RU', name: 'Russia', dial: '+7', pattern: /^9\d{9}$/ },
  { code: 'BR', name: 'Brazil', dial: '+55', pattern: /^[1-9]\d{9,10}$/ },
  { code: 'TR', name: 'Türkiye', dial: '+90', pattern: /^5\d{9}$/ },
  { code: 'SE', name: 'Sweden', dial: '+46', pattern: /^7[02369]\d{7}$/ },
  { code: 'NO', name: 'Norway', dial: '+47', pattern: /^4[01589]\d{7}$/ },
  { code: 'DK', name: 'Denmark', dial: '+45', pattern: /^[2-9]\d{7}$/ },
]

/**
 * The country that is used for a phone number without an international
 * dialing code.
 */
export const DEFAULT_PHONE_COUNTRY = 'CN'

/**
 * Normalize a phone number: the separators are removed and the number is
 * stored in the international format (`+<country code><number>`).
 *
 * @export
 * @param {string} phone
 * @returns {string}
 */
export const normalizePhoneNumber = (phone: string): string => {
  const trimmed = (phone || '').trim()
  if (!trimmed) {
    return ''
  }

  const isInternational = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')

  return isInternational ? `+${digits}` : digits
}

/**
 * Find the country of an international phone number.
 *
 * @export
 * @param {string} phone
 * @returns {PhoneCountry | undefined}
 */
export const findPhoneCountry = (phone: string): PhoneCountry | undefined => {
  const normalized = normalizePhoneNumber(phone)

  if (!normalized.startsWith('+')) {
    return undefined
  }

  const digits = normalized.slice(1)

  return [...PHONE_COUNTRIES]
    .sort((first, second) => second.dial.length - first.dial.length)
    .find((country) => digits.startsWith(country.dial.slice(1)))
}

/**
 * Check that a phone number is valid.
 *
 * An international number is validated against the pattern of its country,
 * a national number against the pattern of the default country.
 *
 * @export
 * @param {string} phone
 * @param {string} [defaultCountry=DEFAULT_PHONE_COUNTRY]
 * @returns {boolean}
 */
export const isValidPhoneNumber = (phone: string, defaultCountry: string = DEFAULT_PHONE_COUNTRY): boolean => {
  const normalized = normalizePhoneNumber(phone)

  if (!normalized) {
    return false
  }

  const digits = normalized.replace('+', '')

  if (!/^\d+$/.test(digits) || digits.length < 6 || digits.length > 15) {
    return false
  }

  if (normalized.startsWith('+')) {
    const country = findPhoneCountry(normalized)

    if (!country) {
      return false
    }

    return country.pattern.test(digits.slice(country.dial.length - 1))
  }

  const country = PHONE_COUNTRIES.find((item) => item.code === defaultCountry)

  if (!country) {
    return false
  }

  return country.pattern.test(digits)
}

/**
 * Get the country of a phone number, falling back to the default country.
 *
 * @export
 * @param {string} phone
 * @param {string} [defaultCountry=DEFAULT_PHONE_COUNTRY]
 * @returns {PhoneCountry}
 */
export const getPhoneCountry = (phone: string, defaultCountry: string = DEFAULT_PHONE_COUNTRY): PhoneCountry => {
  const country = findPhoneCountry(phone)

  if (country) {
    return country
  }

  return PHONE_COUNTRIES.find((item) => item.code === defaultCountry) || PHONE_COUNTRIES[0]
}

/**
 * Fees of the Chinese rental market.
 *
 * The thresholds are configured in the back office (settings) and are
 * evaluated by the shared helper, so the quote shown to the customer and
 * the price stored by the backend are always the same.
 */
export interface ChinaFeeSettings {
  /** Fee charged when the car is picked up or returned during the night */
  nightServiceFee?: number
  /** First hour of the night service (inclusive) */
  nightServiceStartHour?: number
  /** First hour of the day time (exclusive) */
  nightServiceEndHour?: number
  /** Fee charged when the car is returned to another store */
  oneWayFee?: number
  /** Fee charged per hour of overtime */
  overtimeFee?: number
  /** Free overtime, in hours */
  overtimeFreeHours?: number
  /** Fee charged per driven kilometre over the included mileage */
  mileageFee?: number
  /** Mileage included in the rental price, in kilometres */
  mileageIncluded?: number
}

export type ChinaFeeCode = bookcarsTypes.ChinaFeeCode

export const DEFAULT_CHINA_TIMEZONE = 'Asia/Shanghai'

/**
 * Get the local hour of a date in a given time zone.
 *
 * @export
 * @param {Date} date
 * @param {string} [timezone=DEFAULT_CHINA_TIMEZONE]
 * @returns {number} the local hour (0-23)
 */
export const getLocalHour = (date: Date, timezone: string = DEFAULT_CHINA_TIMEZONE): number => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const hour = Number(formatter.formatToParts(date).find((part) => part.type === 'hour')?.value)

    if (!Number.isFinite(hour)) {
      return date.getHours()
    }

    return hour % 24
  } catch {
    return date.getHours()
  }
}

/**
 * Check that an hour belongs to the night service window.
 *
 * The window can wrap the midnight (22:00 - 06:00 by default).
 *
 * @export
 * @param {number} hour
 * @param {number} [startHour=22]
 * @param {number} [endHour=6]
 * @returns {boolean}
 */
export const isNightHour = (hour: number, startHour: number = 22, endHour: number = 6): boolean => {
  if (startHour === endHour) {
    return false
  }

  if (startHour < endHour) {
    return hour >= startHour && hour < endHour
  }

  return hour >= startHour || hour < endHour
}

/**
 * Calculate the fees that can be known when the booking is created.
 *
 * The overtime and the mileage fees are settled when the car is returned,
 * they are calculated by calculateOvertimeFee and calculateMileageFee.
 *
 * @export
 * @param {object} params
 * @param {Date} params.from - the pick-up date
 * @param {string} [params.timezone] - the time zone of the store
 * @param {boolean} [params.sameStore=true] - false when the car is returned to another store
 * @param {ChinaFeeSettings} [params.settings]
 * @returns {ChinaFeeBreakdown}
 */
export const calculateChinaFees = (params: {
  from: Date
  timezone?: string
  sameStore?: boolean
  settings?: ChinaFeeSettings
}): bookcarsTypes.ChinaFeeBreakdown => {
  const items: bookcarsTypes.ChinaFeeItem[] = []
  const settings = params.settings || {}

  const nightServiceFee = Number(settings.nightServiceFee) || 0
  const pickupHour = getLocalHour(params.from, params.timezone || DEFAULT_CHINA_TIMEZONE)

  if (
    nightServiceFee > 0
    && isNightHour(pickupHour, Number(settings.nightServiceStartHour ?? 22), Number(settings.nightServiceEndHour ?? 6))
  ) {
    items.push({ code: 'nightService', amount: Number(nightServiceFee.toFixed(2)) })
  }

  const oneWayFee = Number(settings.oneWayFee) || 0

  if (oneWayFee > 0 && params.sameStore === false) {
    items.push({ code: 'oneWay', amount: Number(oneWayFee.toFixed(2)) })
  }

  const total = Number(items.reduce((sum, item) => sum + item.amount, 0).toFixed(2))

  return { items, total }
}

/**
 * Calculate the overtime fee, charged when the car is returned later than
 * the booked return date.
 *
 * @export
 * @param {object} params
 * @param {Date} params.returnDate - the actual return date
 * @param {Date} params.bookedTo - the booked return date
 * @param {ChinaFeeSettings} [params.settings]
 * @returns {ChinaFeeBreakdown}
 */
export const calculateOvertimeFee = (params: {
  returnDate: Date
  bookedTo: Date
  settings?: ChinaFeeSettings
}): bookcarsTypes.ChinaFeeBreakdown => {
  const items: bookcarsTypes.ChinaFeeItem[] = []
  const settings = params.settings || {}
  const overtimeFee = Number(settings.overtimeFee) || 0
  const freeHours = Number(settings.overtimeFreeHours) || 0
  const overtimeHours = (params.returnDate.getTime() - params.bookedTo.getTime()) / (1000 * 60 * 60)

  if (overtimeFee > 0 && overtimeHours > freeHours) {
    const amount = Number(((overtimeHours - freeHours) * overtimeFee).toFixed(2))

    if (amount > 0) {
      items.push({ code: 'overtime', amount })
    }
  }

  const total = Number(items.reduce((sum, item) => sum + item.amount, 0).toFixed(2))

  return { items, total }
}

/**
 * Calculate the mileage fee, charged for the kilometres driven over the
 * mileage included in the rental price.
 *
 * @export
 * @param {object} params
 * @param {number} params.kilometres - the driven distance
 * @param {ChinaFeeSettings} [params.settings]
 * @returns {ChinaFeeBreakdown}
 */
export const calculateMileageFee = (params: {
  kilometres: number
  settings?: ChinaFeeSettings
}): bookcarsTypes.ChinaFeeBreakdown => {
  const items: bookcarsTypes.ChinaFeeItem[] = []
  const settings = params.settings || {}
  const mileageFee = Number(settings.mileageFee) || 0
  const mileageIncluded = Number(settings.mileageIncluded) || 0
  const extraKilometres = (Number(params.kilometres) || 0) - mileageIncluded

  if (mileageFee > 0 && extraKilometres > 0) {
    items.push({ code: 'mileage', amount: Number((extraKilometres * mileageFee).toFixed(2)) })
  }

  const total = Number(items.reduce((sum, item) => sum + item.amount, 0).toFixed(2))

  return { items, total }
}

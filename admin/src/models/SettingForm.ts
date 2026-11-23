import { z } from 'zod'
import { strings as commonStrings } from '@/lang/common'

// const numberRegex = /^\d+(\.\d+)?$/
const numberRegex = /^\d+$/

const validateHour = (val: string) => {
  const hour = parseFloat(val)
  return Number.isFinite(hour) && hour >= 0 && hour <= 23
}

export const schema = z.object({
  minPickupHours: z.string().refine((val) => !val || (numberRegex.test(val) && Number.parseFloat(val) >= 1), { message: commonStrings.FIELD_NOT_VALID }),
  minRentalHours: z.string().refine((val) => !val || (numberRegex.test(val) && Number.parseFloat(val) >= 1), { message: commonStrings.FIELD_NOT_VALID }),
  minPickupDropoffHour: z.string().refine((val) => !val || (numberRegex.test(val) && validateHour(val)), { message: commonStrings.FIELD_NOT_VALID }),
  maxPickupDropoffHour: z.string().refine((val) => !val || (numberRegex.test(val) && validateHour(val)), { message: commonStrings.FIELD_NOT_VALID }),
  nightServiceFee: z.string().refine((val) => !val || numberRegex.test(val), { message: commonStrings.FIELD_NOT_VALID }),
  nightServiceStartHour: z.string().refine((val) => !val || (numberRegex.test(val) && validateHour(val)), { message: commonStrings.FIELD_NOT_VALID }),
  nightServiceEndHour: z.string().refine((val) => !val || (numberRegex.test(val) && validateHour(val)), { message: commonStrings.FIELD_NOT_VALID }),
  oneWayFee: z.string().refine((val) => !val || numberRegex.test(val), { message: commonStrings.FIELD_NOT_VALID }),
  overtimeFee: z.string().refine((val) => !val || numberRegex.test(val), { message: commonStrings.FIELD_NOT_VALID }),
  overtimeFreeHours: z.string().refine((val) => !val || numberRegex.test(val), { message: commonStrings.FIELD_NOT_VALID }),
  mileageFee: z.string().refine((val) => !val || numberRegex.test(val), { message: commonStrings.FIELD_NOT_VALID }),
  mileageIncluded: z.string().refine((val) => !val || numberRegex.test(val), { message: commonStrings.FIELD_NOT_VALID }),
  enforceBookingRules: z.boolean(),
})

export type FormFields = z.infer<typeof schema>

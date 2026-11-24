export enum UserType {
  Admin = 'admin',
  Supplier = 'supplier',
  User = 'user',
}

export enum AppType {
  Admin = 'admin',
  Frontend = 'frontend',
}

export enum CarType {
  Diesel = 'diesel',
  Gasoline = 'gasoline',
  Electric = 'electric',
  Hybrid = 'hybrid',
  PlugInHybrid = 'plugInHybrid',
  Unknown = 'unknown',
}

export enum CarRange {
  Mini = 'mini', // car
  Midi = 'midi', // suv
  Maxi = 'maxi', // van
  Scooter = 'scooter',
  Bus = 'bus',
  Truck = 'truck',
  Caravan = 'caravan',
}

export enum CarMultimedia {
  Touchscreen = 'touchscreen',
  Bluetooth = 'bluetooth',
  AndroidAuto = 'androidAuto',
  AppleCarPlay = 'appleCarPlay',
}

export enum GearboxType {
  Manual = 'manual',
  Automatic = 'automatic',
}

export enum FuelPolicy {
  LikeForLike = 'likeForlike',
  FreeTank = 'freeTank',
  FullToFull = 'fullToFull',
  FullToEmpty = 'FullToEmpty',
}

export enum BookingStatus {
  Void = 'void',
  Pending = 'pending',
  Deposit = 'deposit',
  Paid = 'paid',
  PaidInFull = 'paidInFull',
  Reserved = 'reserved',
  Cancelled = 'cancelled',
}

export enum Mileage {
  Limited = 'limited',
  Unlimited = 'unlimited',
}

export enum Availablity {
  Available = 'available',
  Unavailable = 'unavailable',
}

export enum RecordType {
  Admin = 'admin',
  Supplier = 'supplier',
  User = 'user',
  Car = 'car',
  Location = 'location',
  Country = 'country',
}

export enum PaymentGateway {
  PayPal = 'payPal',
  Stripe = 'stripe',
}

export enum HandoverStage {
  Accepted = 'accepted',
  Preparing = 'preparing',
  Ready = 'ready',
  PickedUp = 'pickedUp',
  Returned = 'returned',
  Settled = 'settled',
}

export enum ReturnFeePaymentMethod {
  WeChat = 'wechat',
  Alipay = 'alipay',
  Card = 'card',
  Cash = 'cash',
}

export interface ReturnFeeReceipt {
  method: ReturnFeePaymentMethod
  reference: string
  amount: number
  currency: string
}

export interface HandoverEvent {
  stage: HandoverStage
  at: Date
  operator: string
  odometer?: number
  fuelPercent?: number
  condition?: string
  contractVersion?: string
  documentsVerified?: boolean
  returnFeeReceipt?: ReturnFeeReceipt
}

export enum HandoverReminderKind {
  Pickup = 'pickup',
  Return = 'return',
  Overdue = 'overdue',
}

export type HandoverReminderLog = Partial<Record<HandoverReminderKind, {
  status: 'sending' | 'sent' | 'failed'
  at: Date
}>>

export interface BookingHandover {
  scheduledReminders?: HandoverReminderLog
  events: HandoverEvent[]
  fees?: ChinaFeeBreakdown
  currency?: string
  nextStage?: HandoverStage
}

export interface BookingInvoice {
  title: string
  taxId?: string
  requestedAt: Date
  issuedAt?: Date
  reference?: string
}

export interface BookingInvoiceView {
  canRequest: boolean
  invoice?: BookingInvoice
}

export interface Booking {
  _id?: string
  supplier: string | User
  car: string | Car
  driver?: string | User
  pickupLocation: string | Location
  dropOffLocation: string | Location
  from: Date
  to: Date
  status: BookingStatus
  cancellation?: boolean
  amendments?: boolean
  theftProtection?: boolean
  collisionDamageWaiver?: boolean
  fullInsurance?: boolean
  additionalDriver?: boolean
  _additionalDriver?: string | AdditionalDriver
  cancelRequest?: boolean
  price?: number
  //
  // The amount that was actually charged (deposit only, or rental price
  // plus deposit). It differs from `price`, which is the rental price.
  //
  paidAmount?: number
  fees?: ChinaFeeBreakdown
  sessionId?: string
  paymentIntentId?: string
  customerId?: string
  expireAt?: Date
  isDeposit?: boolean
  isPayedInFull?: boolean
  paypalOrderId?: string
}

export interface CheckoutPayload {
  driver?: User
  booking?: Booking
  additionalDriver?: AdditionalDriver
  payLater: boolean
  sessionId?: string
  paymentIntentId?: string
  customerId?: string
  payPal?: boolean
}

export interface Filter {
  from?: Date
  dateBetween?: Date
  to?: Date
  keyword?: string
  pickupLocation?: string
  dropOffLocation?: string
}

export interface GetBookingsPayload {
  suppliers: string[]
  statuses: string[]
  user?: string
  car?: string
  filter?: Filter
}

export interface AdditionalDriver {
  fullName: string
  email: string
  phone: string
  birthDate: Date
}

export interface UpsertBookingPayload {
  booking: Booking
  additionalDriver?: AdditionalDriver
}

export interface LocationName {
  language: string
  name: string
}

export interface CountryName {
  language: string
  name: string
}

export interface UpsertLocationPayload {
  country: string
  longitude?: number
  latitude?: number
  names: LocationName[]
  image?: string | null
  parkingSpots?: ParkingSpot[]
  supplier?: string
  parentLocation?: string
  /**
   * Street address of the pickup point, used by the map service and shown to
   * the customer before the booking is confirmed.
   */
  address?: string
  /**
   * Opening hours of the pickup point, e.g. '09:00 - 21:00'.
   */
  businessHours?: string
  /**
   * Administrative district code of the pickup point, filled by the map
   * service (e.g. '310115').
   */
  adcode?: string
  /**
   * Instructions for the vehicle handover, shown to the customer.
   */
  pickupInstructions?: string
  /**
   * The payment cards that are accepted on site.
   */
  acceptCards?: string[]
  /**
   * The IANA timezone of the pickup point, e.g. 'Asia/Shanghai'.
   */
  timezone?: string
}

export interface UpdateSupplierPayload {
  _id: string
  fullName: string
  phone: string
  location: string
  bio: string
  payLater: boolean
  licenseRequired: boolean
  minimumRentalDays?: number
  priceChangeRate?: number
  supplierCarLimit?: number
  notifyAdminOnNewCar?: boolean
  blacklisted?: boolean
}

export interface CreateCarPayload {
  loggedUser: string
  name: string
  licensePlate?: string
  supplier: string
  minimumAge: number
  locations: string[]

  // price fields
  hourlyPrice: number | null
  discountedHourlyPrice: number | null
  dailyPrice: number
  discountedDailyPrice: number | null
  biWeeklyPrice: number | null
  discountedBiWeeklyPrice: number | null
  weeklyPrice: number | null
  discountedWeeklyPrice: number | null
  monthlyPrice: number | null
  discountedMonthlyPrice: number | null
  // date based price
  isDateBasedPrice: boolean
  dateBasedPrices: DateBasedPrice[]

  deposit: number
  available: boolean
  fullyBooked?: boolean
  comingSoon?: boolean
  type: string
  gearbox: string
  aircon: boolean
  image?: string
  seats: number
  doors: number
  fuelPolicy: string
  mileage: number
  cancellation: number
  amendments: number
  theftProtection: number
  collisionDamageWaiver: number
  fullInsurance: number
  additionalDriver: number
  range: string
  multimedia: string[]
  rating?: number
  co2?: number
  blockOnPay?: boolean
}

export interface UpdateCarPayload extends CreateCarPayload {
  _id: string
}

export interface CarSpecs {
  aircon?: boolean,
  moreThanFourDoors?: boolean,
  moreThanFiveSeats?: boolean,
}

export interface GetCarsPayload {
  suppliers?: string[]
  carSpecs?: CarSpecs
  carType?: string[]
  gearbox?: string[]
  mileage?: string[]
  fuelPolicy?: string[]
  deposit?: number
  availability?: string[]
  pickupLocation?: string
  ranges?: string[]
  multimedia?: string[]
  rating?: number
  seats?: number
  includeAlreadyBookedCars?: boolean
  includeComingSoonCars?: boolean
  from?: Date
  to?: Date
}

export interface SignUpPayload {
  email: string
  password: string
  fullName: string
  phone?: string
  language: string
  active?: boolean
  verified?: boolean
  blacklisted?: boolean
  type?: string
  avatar?: string
  birthDate?: number | Date
}

export type Contract = { language: string, file: string | null }

export interface CreateUserPayload {
  email?: string
  phone: string
  location: string
  bio: string
  fullName: string
  type?: string
  avatar?: string
  birthDate?: number | Date
  language?: string
  password?: string
  verified?: boolean
  blacklisted?: boolean
  payLater?: boolean
  supplier?: string
  contracts?: Contract[]
  licenseRequired?: boolean
  minimumRentalDays?: number
  license?: string
  priceChangeRate?: number
  supplierCarLimit?: number
  notifyAdminOnNewCar?: boolean
}

export interface UpdateUserPayload extends CreateUserPayload {
  _id: string
  enableEmailNotifications?: boolean
}

export interface CheckPasswordPayload {
  _id: string
  password: string
}

export interface ChangePasswordPayload {
  _id: string
  password: string
  newPassword: string
  strict: boolean
}

export interface ActivatePayload {
  userId: string
  token: string
  password: string
}

export interface ValidateEmailPayload {
  email: string
  appType?: AppType
}

export enum SocialSignInType {
  Facebook = 'facebook',
  Apple = 'apple',
  Google = 'google'
}

export interface SignInPayload {
  email?: string
  password?: string
  stayConnected?: boolean
  mobile?: boolean
  fullName?: string
  avatar?: string
  accessToken?: string
  socialSignInType?: SocialSignInType
}

export interface ResendLinkPayload {
  email?: string
}

export interface UpdateEmailNotificationsPayload {
  _id: string
  enableEmailNotifications: boolean
}

export interface UpdateLanguagePayload {
  id: string
  language: string
}

export interface ValidateSupplierPayload {
  fullName: string
}

export interface ValidateLocationPayload {
  language: string
  name: string
}

export interface ValidateCountryPayload {
  language: string
  name: string
}

export interface UpdateStatusPayload {
  ids: string[]
  status: string
}

export interface User {
  _id?: string
  supplier?: User | string
  fullName: string
  email?: string
  phone?: string
  password?: string
  birthDate?: Date
  verified?: boolean
  verifiedAt?: Date
  active?: boolean
  language?: string
  enableEmailNotifications?: boolean
  avatar?: string
  bio?: string
  location?: string
  type?: string
  blacklisted?: boolean
  payLater?: boolean
  accessToken?: string
  checked?: boolean
  customerId?: string
  carCount?: number
  contracts?: Contract[]
  licenseRequired?: boolean
  license?: string | null
  minimumRentalDays?: number
  priceChangeRate?: number
  supplierCarLimit?: number
  notifyAdminOnNewCar?: boolean
  isSocial?: boolean
}

export interface Option {
  _id: string
  name?: string
  image?: string
}

export interface LocationValue {
  _id?: string
  language: string
  value?: string
}

export interface ParkingSpot {
  _id?: string
  longitude: number | string
  latitude: number | string
  name?: string
  values?: LocationValue[]
}

/**
 * A point of interest returned by the map service.
 */
export interface MapPlace {
  id?: string
  name: string
  address?: string
  city?: string
  district?: string
  longitude: number
  latitude: number
  type?: string
}

/**
 * An address resolved from coordinates by the map service.
 */
export interface MapAddress {
  address?: string
  city?: string
  district?: string
  township?: string
  adcode?: string
}

/**
 * Driving distance between two coordinates.
 */
export interface MapDistance {
  /**
   * Distance in meters.
   */
  distance: number
  /**
   * Duration in seconds.
   */
  duration: number
  /**
   * 'amap' when the value comes from the map provider, 'estimate' when it is
   * a straight line estimation computed locally.
   */
  source: string
}

export interface Location {
  _id: string
  country?: Country
  longitude?: number
  latitude?: number
  name?: string
  values?: LocationValue[]
  image?: string
  parkingSpots?: ParkingSpot[]
  supplier?: User
  parentLocation?: Location
  address?: string
  businessHours?: string
  adcode?: string
  pickupInstructions?: string
  acceptCards?: string[]
  timezone?: string
}

export interface Country {
  _id: string
  name?: string
  values?: LocationValue[]
  supplier?: User
}

export interface CountryInfo extends Country {
  locations?: Location[]
}

export interface UpsertCountryPayload {
  names: CountryName[]
  supplier?: string
}

export interface DateBasedPrice {
  _id?: string
  startDate: Date | null
  endDate: Date | null
  dailyPrice: number | string
}

export interface Car {
  _id: string
  name: string
  licensePlate?: string
  supplier: User
  minimumAge: number
  locations: Location[]

  // price fields
  dailyPrice: number
  discountedDailyPrice: number | null
  hourlyPrice: number | null
  discountedHourlyPrice: number | null
  biWeeklyPrice: number | null
  discountedBiWeeklyPrice: number | null
  weeklyPrice: number | null
  discountedWeeklyPrice: number | null
  monthlyPrice: number | null
  discountedMonthlyPrice: number | null

  // date based price fields
  isDateBasedPrice: boolean
  dateBasedPrices: DateBasedPrice[]

  deposit: number
  available: boolean
  fullyBooked?: boolean
  comingSoon?: boolean
  type: CarType
  gearbox: GearboxType
  aircon: boolean
  image?: string
  seats: number
  doors: number
  fuelPolicy: FuelPolicy
  mileage: number
  cancellation: number
  amendments: number
  theftProtection: number
  collisionDamageWaiver: number
  fullInsurance: number
  additionalDriver: number
  range: string
  multimedia: CarMultimedia[] | undefined
  rating?: number
  trips: number
  co2?: number
  blockOnPay?: boolean
  [propKey: string]: any
}

export interface Data<T> {
  rows: T[]
  rowCount: number
}

export interface GetBookingCarsPayload {
  supplier: string
  pickupLocation: string
}

export interface Notification {
  _id: string
  user: string
  message: string
  booking?: string
  car?: string
  isRead?: boolean
  checked?: boolean
  createdAt?: Date
}

export interface NotificationCounter {
  _id: string
  user: string
  count: number
}

export interface ResultData<T> {
  pageInfo: { totalRecords: number }
  resultData: T[]
}

export type Result<T> = [ResultData<T>] | [] | undefined | null

export interface GetUsersBody {
  user: string
  types: UserType[]
}

export interface CreatePaymentPayload {
  amount: number
  /**
   * Three-letter ISO currency code, in lowercase.
   * Must be a supported currency: https://docs.stripe.com/currencies
   *
   * @type {string}
   */
  currency: string
  /**
   * The IETF language tag of the locale Checkout is displayed in. If blank or auto, the browser's locale is used.
   *
   * @type {string}
   */
  locale: string
  receiptEmail: string
  customerName: string
  name: string
  description?: string
}

export interface CreatePayPalOrderPayload {
  bookingId: string
  amount: number
  currency: string
  name: string
  description: string
}

export interface PaymentResult {
  sessionId?: string
  paymentIntentId?: string
  customerId: string
  clientSecret: string | null
}

export interface SendEmailPayload {
  from: string
  subject: string
  message: string
  isContactForm: boolean
  recaptchaToken?: string
}

export interface Response<T> {
  status: number
  data: T
}

export interface BankDetails {
  _id: string
  accountHolder: string
  bankName: string
  iban: string
  swiftBic: string
  showBankDetailsPage: boolean
}

export interface UpsertBankDetailsPayload {
  _id?: string
  accountHolder: string
  bankName: string
  iban: string
  swiftBic: string
  showBankDetailsPage: boolean
}

export type ChinaFeeCode = 'nightService' | 'oneWay' | 'overtime' | 'mileage'

export interface ChinaFeeItem {
  code: ChinaFeeCode
  amount: number
}

export interface ChinaFeeBreakdown {
  items: ChinaFeeItem[]
  total: number
}

export interface Setting {
  _id: string
  minPickupHours: number
  minRentalHours: number
  minPickupDropoffHour: number
  maxPickupDropoffHour: number
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
  /**
   * Enforce the booking rules of the store on the server (minimum duration,
   * minimum lead time and the opening hours of the pick-up point).
   */
  enforceBookingRules?: boolean
  /** Mileage included in the rental price, in kilometres */
  mileageIncluded?: number
}

export interface UpdateSettingsPayload {
  minPickupHours: number
  minRentalHours: number
  minPickupDropoffHour: number
  maxPickupDropoffHour: number
  nightServiceFee?: number
  nightServiceStartHour?: number
  nightServiceEndHour?: number
  oneWayFee?: number
  overtimeFee?: number
  overtimeFreeHours?: number
  mileageFee?: number
  mileageIncluded?: number
  enforceBookingRules?: boolean
}

// 
// React types
//
export type DataEvent<T> = (data?: Data<T>) => void

export interface StatusFilterItem {
  label: string
  value: BookingStatus
  checked?: boolean
}

export interface CarFilter {
  pickupLocation: Location
  dropOffLocation: Location
  from: Date
  to: Date
}

export type CarFilterSubmitEvent = (filter: CarFilter) => void

export interface CarOptions {
  cancellation?: boolean
  amendments?: boolean
  theftProtection?: boolean
  collisionDamageWaiver?: boolean
  fullInsurance?: boolean
  additionalDriver?: boolean
}

import { BookingStatus, HandoverReminderKind, HandoverStage } from ':bookcars-types'
import { SMTP_FROM, TIMEZONE, type Booking as BookingDocument } from '../config/env.config'
import Booking from '../models/Booking'
import Location from '../models/Location'
import User from '../models/User'
import { sendMail } from './mailHelper'
import * as logger from './logger'

export const handoverStatuses = [BookingStatus.Reserved, BookingStatus.Deposit, BookingStatus.Paid, BookingStatus.PaidInFull]

const subjects = {
  [HandoverReminderKind.Pickup]: ['取车提醒', 'Pickup reminder'],
  [HandoverReminderKind.Return]: ['还车提醒', 'Return reminder'],
  [HandoverReminderKind.Overdue]: ['还车逾期提醒', 'Overdue return reminder'],
}

export const deliverHandoverReminder = async (booking: Pick<BookingDocument, '_id' | 'driver' | 'pickupLocation' | 'dropOffLocation' | 'from' | 'to'>, kind: HandoverReminderKind) => {
  const pickup = kind === HandoverReminderKind.Pickup
  const [driver, location] = await Promise.all([
    User.findById(booking.driver).select('email language').lean(),
    Location.findById(pickup ? booking.pickupLocation : booking.dropOffLocation).select('timezone').lean(),
  ])
  if (!driver?.email) {
    return false
  }

  const chinese = driver.language === 'zh'
  const options = { dateStyle: 'medium', timeStyle: 'short' } as const
  const date = pickup ? booking.from : booking.to
  const locale = chinese ? 'zh-CN' : 'en'
  let timeZone = location?.timezone || TIMEZONE
  let formatter: Intl.DateTimeFormat
  try {
    formatter = new Intl.DateTimeFormat(locale, { ...options, timeZone })
  } catch {
    timeZone = 'UTC'
    formatter = new Intl.DateTimeFormat(locale, { ...options, timeZone })
  }
  const time = formatter.format(date)
  const subject = subjects[kind][chinese ? 0 : 1]
  const text = chinese
    ? `订单 ${booking._id}\n${subject}。预约时间 ${time}（${timeZone}）。如需协助，请联系预订门店。`
    : `Booking ${booking._id}\n${subject}. Scheduled time ${time} (${timeZone}). Contact your rental store for help.`
  const result = await sendMail({ from: SMTP_FROM, to: driver.email, subject, text })
  return Array.isArray(result.accepted) && result.accepted.length > 0
}

export const runScheduledHandoverReminders = async (now = new Date(), deliver = deliverHandoverReminder) => {
  const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const jobs = [
    { kind: HandoverReminderKind.Pickup, date: { from: { $gt: now, $lte: cutoff } }, stage: HandoverStage.Ready, next: HandoverStage.PickedUp },
    { kind: HandoverReminderKind.Return, date: { to: { $gt: now, $lte: cutoff } }, stage: HandoverStage.PickedUp, next: HandoverStage.Returned },
    { kind: HandoverReminderKind.Overdue, date: { to: { $lte: now } }, stage: HandoverStage.PickedUp, next: HandoverStage.Returned },
  ]
  const result = { sent: 0, failed: 0 }
  for (const { kind, date, stage, next } of jobs) {
    const field = `scheduledReminders.${kind}`
    const eligible = {
      ...date,
      status: { $in: handoverStatuses },
      'handover.events.stage': { $all: [stage], $ne: next },
      [field]: { $exists: false },
    }
    const candidates = await Booking.find(eligible).select('_id').sort({ _id: 1 }).limit(100).lean()
    for (const { _id } of candidates) {
      const claimed = await Booking.findOneAndUpdate({ ...eligible, _id }, {
        $set: { [field]: { status: 'sending', at: new Date() } },
      }, { returnDocument: 'after' }).select('driver pickupLocation dropOffLocation from to').lean()
      if (!claimed) {
        continue
      }
      let sent = false
      try {
        sent = await deliver(claimed, kind)
      } catch (error) {
        logger.error(`[handover.reminder] ${kind} failed for order ${_id}`, error)
      }
      const status = sent ? 'sent' : 'failed'
      await Booking.updateOne({ _id }, { $set: { [field]: { status, at: new Date() } } })
      result[status] += 1
    }
  }
  return result
}

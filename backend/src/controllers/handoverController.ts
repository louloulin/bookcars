import { Request, Response } from 'express'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { BASE_CURRENCY } from '../config/env.config'
import Booking from '../models/Booking'
import Setting from '../models/Setting'
import { isValidObjectId } from '../utils/helper'
import { deliverHandoverReminder, handoverStatuses } from '../utils/handoverReminder'
import * as logger from '../utils/logger'

const { HandoverReminderKind, HandoverStage, ReturnFeePaymentMethod, UserType } = bookcarsTypes
const stages = Object.values(HandoverStage)

export const handover = async (req: Request, res: Response) => {
  const id = req.params.id as string
  if (!isValidObjectId(id)) {
    res.sendStatus(400)
    return
  }

  const operator = req.user!._id
  const scope = req.user!.type === UserType.Admin ? { _id: id } : { _id: id, supplier: operator }
  const booking = await Booking.findOne(scope).select('+handover +scheduledReminders').lean()
  if (!booking) {
    res.sendStatus(404)
    return
  }

  const events = booking.handover?.events ?? []
  const nextStage = handoverStatuses.includes(booking.status) ? stages[events.length] : undefined
  const { scheduledReminders } = booking
  if (req.method === 'GET') {
    res.json({ ...booking.handover, events, nextStage, scheduledReminders })
    return
  }

  const { stage, odometer, fuelPercent, condition, contractVersion, documentsVerified, returnFeeReceipt } = req.body ?? {}
  if (!nextStage || stage !== nextStage) {
    res.sendStatus(409)
    return
  }

  const event: bookcarsTypes.HandoverEvent = { stage: nextStage, at: new Date(), operator }
  if (nextStage === HandoverStage.PickedUp || nextStage === HandoverStage.Returned) {
    if (!Number.isInteger(odometer) || odometer < 0 || !Number.isInteger(fuelPercent) || fuelPercent < 0 || fuelPercent > 100
        || typeof condition !== 'string' || !condition.trim() || condition.length > 500) {
      res.sendStatus(400)
      return
    }
    event.odometer = odometer
    event.fuelPercent = fuelPercent
    event.condition = condition.trim()
  }

  if (nextStage === HandoverStage.PickedUp) {
    if (documentsVerified !== true || typeof contractVersion !== 'string' || !contractVersion.trim() || contractVersion.length > 80) {
      res.sendStatus(400)
      return
    }
    event.documentsVerified = true
    event.contractVersion = contractVersion.trim()
  }

  if (returnFeeReceipt !== undefined) {
    const { method, reference } = returnFeeReceipt ?? {}
    const amount = booking.handover?.fees?.total
    const currency = booking.handover?.currency
    if (nextStage !== HandoverStage.Settled || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || !currency
        || !Object.values(ReturnFeePaymentMethod).includes(method)
        || typeof reference !== 'string' || !reference.trim() || reference.trim().length > 64 || /[\r\n]/.test(reference)) {
      res.sendStatus(400)
      return
    }
    event.returnFeeReceipt = { method, reference: reference.trim(), amount, currency }
  }

  const record = { ...booking.handover, events: [...events, event] }
  if (nextStage === HandoverStage.Returned) {
    const pickup = events.find((entry) => entry.stage === HandoverStage.PickedUp)
    if (pickup?.odometer === undefined || odometer < pickup.odometer) {
      res.sendStatus(400)
      return
    }
    const settings = await Setting.findOne().lean() ?? undefined
    const overtime = bookcarsHelper.calculateOvertimeFee({ returnDate: event.at, bookedTo: booking.to, settings })
    const mileage = bookcarsHelper.calculateMileageFee({ kilometres: odometer - pickup.odometer, settings })
    record.fees = { items: [...overtime.items, ...mileage.items], total: Number((overtime.total + mileage.total).toFixed(2)) }
    record.currency = BASE_CURRENCY
  }

  const updated = await Booking.updateOne({
    ...scope,
    status: booking.status,
    car: booking.car,
    to: booking.to,
    [`handover.events.${events.length}`]: { $exists: false },
  }, { $set: { handover: record } }, { runValidators: true })
  if (updated.modifiedCount !== 1) {
    res.sendStatus(409)
    return
  }
  res.json({ ...record, nextStage: stages[events.length + 1], scheduledReminders })
}

export const sendHandoverReminder = async (req: Request, res: Response) => {
  const id = req.params.id as string
  if (!isValidObjectId(id)) {
    res.sendStatus(400)
    return
  }

  const operator = req.user!
  const scope = operator.type === UserType.Admin ? { _id: id } : { _id: id, supplier: operator._id }
  const booking = await Booking.findOne(scope).select('+handover').lean()
  if (!booking) {
    res.sendStatus(404)
    return
  }

  const stage = booking.handover?.events.at(-1)?.stage
  const pickup = stage === HandoverStage.Ready
  if (!handoverStatuses.includes(booking.status) || (!pickup && stage !== HandoverStage.PickedUp)) {
    res.sendStatus(409)
    return
  }

  const returnKind = booking.to.getTime() <= Date.now() ? HandoverReminderKind.Overdue : HandoverReminderKind.Return
  try {
    const sent = await deliverHandoverReminder(booking, pickup ? HandoverReminderKind.Pickup : returnKind)
    res.sendStatus(sent ? 204 : 422)
  } catch (error) {
    logger.error(`[booking.handover] Delivery failed for order ${id}`, error)
    res.sendStatus(502)
  }
}

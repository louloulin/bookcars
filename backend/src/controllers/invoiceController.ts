import { Request, Response } from 'express'
import { BookingStatus, HandoverStage, UserType } from ':bookcars-types'
import Booking from '../models/Booking'
import { isValidObjectId } from '../utils/helper'

const eligibility = {
  status: { $in: [BookingStatus.Reserved, BookingStatus.Deposit, BookingStatus.Paid, BookingStatus.PaidInFull] },
  'handover.events.stage': HandoverStage.Settled,
}

export const invoice = async (req: Request, res: Response) => {
  const id = req.params.id as string
  if (!isValidObjectId(id)) {
    res.sendStatus(400)
    return
  }

  const user = req.user!
  const customer = user.type === UserType.User
  if (!customer && user.type !== UserType.Admin && user.type !== UserType.Supplier) {
    res.sendStatus(403)
    return
  }
  const scope = {
    _id: id,
    ...(customer ? { driver: user._id } : user.type === UserType.Supplier ? { supplier: user._id } : {}),
  }
  const booking = await Booking.findOne(scope).select('status +invoice +handover').lean()
  if (!booking) {
    res.sendStatus(404)
    return
  }

  const canRequest = customer && eligibility.status.$in.includes(booking.status)
    && booking.handover?.events.at(-1)?.stage === HandoverStage.Settled && !booking.invoice
  if (req.method === 'GET') {
    res.json({ canRequest, invoice: booking.invoice })
    return
  }

  if (customer ? !canRequest : !booking.invoice || booking.invoice.issuedAt) {
    res.sendStatus(409)
    return
  }

  const { title, taxId, reference } = req.body ?? {}
  if (customer && (typeof title !== 'string' || !title.trim() || title.trim().length > 160
    || (taxId !== undefined && (typeof taxId !== 'string' || !/^[A-Z0-9]{15,20}$/i.test(taxId.trim()))))) {
    res.sendStatus(400)
    return
  }
  if (!customer && (typeof reference !== 'string' || !reference.trim() || reference.trim().length > 64)) {
    res.sendStatus(400)
    return
  }

  const now = new Date()
  const updated = customer
    ? await Booking.findOneAndUpdate({ ...scope, ...eligibility, invoice: { $exists: false } }, {
      $set: { invoice: { title: title.trim(), taxId: taxId?.trim().toUpperCase(), requestedAt: now } },
    }, { returnDocument: 'after', runValidators: true }).select('+invoice').lean()
    : await Booking.findOneAndUpdate({ ...scope, 'invoice.requestedAt': { $exists: true }, 'invoice.issuedAt': { $exists: false } }, {
      $set: { 'invoice.reference': reference.trim(), 'invoice.issuedAt': now },
    }, { returnDocument: 'after', runValidators: true }).select('+invoice').lean()

  if (!updated) {
    res.sendStatus(409)
    return
  }
  res.json({ canRequest: false, invoice: updated.invoice })
}

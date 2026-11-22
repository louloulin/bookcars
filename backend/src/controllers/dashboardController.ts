import mongoose from 'mongoose'
import { Request, Response } from 'express'
import * as bookcarsTypes from ':bookcars-types'
import Booking from '../models/Booking'
import Car from '../models/Car'
import Location from '../models/Location'
import User from '../models/User'
import i18n from '../lang/i18n'
import * as logger from '../utils/logger'

// Bookings that represent collected (or committed) money.
const REVENUE_STATUSES = [
  bookcarsTypes.BookingStatus.Deposit,
  bookcarsTypes.BookingStatus.Paid,
  bookcarsTypes.BookingStatus.PaidInFull,
  bookcarsTypes.BookingStatus.Reserved,
]

const MONTHS_BACK = 6

/**
 * Get the month key (YYYY-MM) of a date.
 *
 * @param {Date} date
 * @returns {string}
 */
const monthKey = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Get admin dashboard statistics.
 *
 * Returns KPI counters, a revenue trend and the latest bookings.
 * Suppliers only see their own data, admins see the whole platform.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    const sessionUser = await User.findById(req.user?._id)

    if (!sessionUser) {
      res.status(403).send('Forbidden: You cannot get dashboard information')
      return
    }

    const isAdmin = sessionUser.type === bookcarsTypes.UserType.Admin
    const supplierId = new mongoose.Types.ObjectId(sessionUser._id)
    const bookingFilter = isAdmin ? {} : { supplier: supplierId }
    const carFilter = isAdmin ? {} : { supplier: supplierId }

    const [statusAggregation, revenueAggregation, trendAggregation, totalCars, totalLocations, totalSuppliers, totalDrivers, recentBookings] = await Promise.all([
      Booking.aggregate([
        { $match: bookingFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        { $match: { ...bookingFilter, status: { $in: REVENUE_STATUSES } } },
        { $group: { _id: null, total: { $sum: '$price' } } },
      ]),
      Booking.aggregate([
        { $match: bookingFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: {
              $sum: {
                $cond: [{ $in: ['$status', REVENUE_STATUSES] }, '$price', 0],
              },
            },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Car.countDocuments(carFilter),
      Location.countDocuments({}),
      User.countDocuments({ type: bookcarsTypes.UserType.Supplier }),
      User.countDocuments({ type: bookcarsTypes.UserType.User }),
      Booking.find(bookingFilter)
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('car', 'name licensePlate')
        .populate('driver', 'fullName')
        .populate('supplier', 'fullName')
        .lean(),
    ])

    // Build a continuous 6 month trend, months without bookings included.
    const now = new Date()
    const trend: { month: string, label: string, revenue: number, bookings: number }[] = []
    const trendMap = new Map<string, { revenue: number, bookings: number }>()

    for (const item of trendAggregation) {
      trendMap.set(item._id, { revenue: item.revenue, bookings: item.bookings })
    }

    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = monthKey(date)
      const entry = trendMap.get(key) || { revenue: 0, bookings: 0 }
      trend.push({
        month: key,
        label: date.toLocaleString('en-US', { month: 'short' }),
        revenue: entry.revenue,
        bookings: entry.bookings,
      })
    }

    const bookingsByStatus: Record<string, number> = {}
    for (const status of Object.values(bookcarsTypes.BookingStatus)) {
      bookingsByStatus[status] = 0
    }
    for (const item of statusAggregation) {
      bookingsByStatus[item._id] = item.count
    }

    const totalBookings = statusAggregation.reduce((acc: number, item: any) => acc + item.count, 0)

    res.json({
      isAdmin,
      totalBookings,
      bookingsByStatus,
      totalRevenue: revenueAggregation[0]?.total || 0,
      totalCars,
      totalLocations,
      totalSuppliers,
      totalDrivers,
      trend,
      recentBookings,
    })
  } catch (err) {
    logger.error(`[dashboard.getStats] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

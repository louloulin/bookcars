import express from 'express'
import routeNames from '../config/bookingRoutes.config'
import authJwt from '../middlewares/authJwt'
import rateLimiter, { createRateLimiter } from '../middlewares/rateLimiter'
import * as bookingController from '../controllers/bookingController'
import { handover, sendHandoverReminder } from '../controllers/handoverController'
import { invoice } from '../controllers/invoiceController'

const routes = express.Router()

routes.route('/api/bookings/:id/invoice').all(authJwt.verifyToken).get(invoice).post(invoice)

routes.route('/api/booking-handover/:id')
  .all(authJwt.verifyToken, authJwt.authSupplier)
  .get(handover)
  .post(handover)
routes.post('/api/booking-handover/:id/reminder', authJwt.verifyToken, authJwt.authSupplier, createRateLimiter('handover-reminder', true), sendHandoverReminder)

routes.route(routeNames.create).post(authJwt.verifyToken, authJwt.authSupplier, bookingController.create)
routes.route(routeNames.checkout).post(rateLimiter, authJwt.verifyTokenOptional, bookingController.checkout)
routes.route(routeNames.update).put(authJwt.verifyToken, authJwt.authSupplier, bookingController.update)
routes.route(routeNames.updateStatus).post(authJwt.verifyToken, authJwt.authSupplier, bookingController.updateStatus)
routes.route(routeNames.delete).post(authJwt.verifyToken, authJwt.authSupplier, bookingController.deleteBookings)
routes.route(routeNames.deleteTempBooking).delete(bookingController.deleteTempBooking)
routes.route(routeNames.getBooking).get(authJwt.verifyTokenOptional, bookingController.getBooking)
routes.route(routeNames.getBookingId).get(bookingController.getBookingId)
routes.route(routeNames.getBookings).post(authJwt.verifyToken, bookingController.getBookings)
routes.route(routeNames.hasBookings).get(authJwt.verifyToken, bookingController.hasBookings)
routes.route(routeNames.cancelBooking).post(authJwt.verifyToken, bookingController.cancelBooking)

export default routes

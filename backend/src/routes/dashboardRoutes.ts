import express from 'express'
import routeNames from '../config/dashboardRoutes.config'
import authJwt from '../middlewares/authJwt'
import * as dashboardController from '../controllers/dashboardController'

const routes = express.Router()

// The dashboard is only available for the platform admin and the suppliers,
// a customer has no access to the aggregated figures.
routes.route(routeNames.getStats).get(authJwt.verifyToken, authJwt.authSupplier, dashboardController.getStats)

export default routes

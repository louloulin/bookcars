import express from 'express'
import routeNames from '../config/dashboardRoutes.config'
import authJwt from '../middlewares/authJwt'
import * as dashboardController from '../controllers/dashboardController'

const routes = express.Router()

routes.route(routeNames.getStats).get(authJwt.verifyToken, dashboardController.getStats)

export default routes

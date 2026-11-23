import express from 'express'
import routeNames from '../config/mapRoutes.config'
import * as mapController from '../controllers/mapController'

const routes = express.Router()

routes.route(routeNames.geocode).get(mapController.geocode)
routes.route(routeNames.reverseGeocode).get(mapController.reverseGeocode)
routes.route(routeNames.placeSearch).get(mapController.placeSearch)
routes.route(routeNames.distance).get(mapController.distance)

export default routes

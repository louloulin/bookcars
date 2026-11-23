import * as Sentry from '@sentry/node'
import express, { NextFunction, Request, Response } from 'express'
import compression from 'compression'
import helmet from 'helmet'
import nocache from 'nocache'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import i18n from './lang/i18n'
import * as env from './config/env.config'
import cors from './middlewares/cors'
import allowedMethods from './middlewares/allowedMethods'
import supplierRoutes from './routes/supplierRoutes'
import bookingRoutes from './routes/bookingRoutes'
import locationRoutes from './routes/locationRoutes'
import notificationRoutes from './routes/notificationRoutes'
import carRoutes from './routes/carRoutes'
import userRoutes from './routes/userRoutes'
import stripeRoutes from './routes/stripeRoutes'
import countryRoutes from './routes/countryRoutes'
import paypalRoutes from './routes/paypalRoutes'
import ipinfoRoutes from './routes/ipinfoRoutes'
import bankDetailsRoutes from './routes/bankDetailsRoutes'
import settingRoutes from './routes/settingRoutes'
import dashboardRoutes from './routes/dashboardRoutes'
import mapRoutes from './routes/mapRoutes'
import { webhook as stripeWebhook } from './controllers/stripeController'
import * as helper from './utils/helper'

const app = express()

app.set('trust proxy' , 1)

app.use(helmet.contentSecurityPolicy())
app.use(helmet.dnsPrefetchControl())
app.use(helmet.crossOriginEmbedderPolicy())
app.use(helmet.frameguard())
app.use(helmet.hidePoweredBy())
app.use(helmet.hsts())
app.use(helmet.ieNoOpen())
app.use(helmet.noSniff())
app.use(helmet.permittedCrossDomainPolicies())
app.use(helmet.referrerPolicy())
app.use(helmet.xssFilter())
app.use(helmet.originAgentCluster())
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }))
app.use(helmet.crossOriginOpenerPolicy())

app.use(nocache())
app.use(compression({ threshold: 0 }))

//
// The Stripe webhook verifies its signature against the raw request body,
// so it is mounted before the JSON body parser
//
app.post('/api/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), stripeWebhook)

app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(express.json({ limit: '50mb' }))

app.use(cors())
// app.options('*', cors())
app.use(cookieParser(env.COOKIE_SECRET))
app.use(allowedMethods)

//
// Driver licenses are private documents: they are never served from the
// public CDN, they are only accessible through the authenticated
// download endpoint. The temporary folder keeps its random (unguessable)
// file names, because the upload preview relies on it
//
const privateCdnPaths = [env.CDN_LICENSES].map((folder) => {
  const relative = path.relative(env.CDN_ROOT, folder).split(path.sep).join('/')
  return `/${relative}`
})

app.use('/cdn', (req: Request, res: Response, next: NextFunction) => {
  const requestPath = decodeURIComponent(req.path)
  if (privateCdnPaths.some((privatePath) => requestPath.startsWith(privatePath))) {
    res.status(403).send('Forbidden')
    return
  }
  next()
})

// Serve static files from the CDN directory
app.use('/cdn', express.static(env.CDN_ROOT))

app.use('/', supplierRoutes)
app.use('/', bookingRoutes)
app.use('/', locationRoutes)
app.use('/', notificationRoutes)
app.use('/', carRoutes)
app.use('/', userRoutes)
app.use('/', stripeRoutes)
app.use('/', countryRoutes)
app.use('/', paypalRoutes)
app.use('/', ipinfoRoutes)
app.use('/', bankDetailsRoutes)
app.use('/', settingRoutes)
app.use('/', dashboardRoutes)
app.use('/', mapRoutes)

if (env.ENABLE_SENTRY) {
  Sentry.setupExpressErrorHandler(app)
}

i18n.locale = env.DEFAULT_LANGUAGE

await helper.mkdir(env.CDN_USERS)
await helper.mkdir(env.CDN_TEMP_USERS)
await helper.mkdir(env.CDN_CARS)
await helper.mkdir(env.CDN_TEMP_CARS)
await helper.mkdir(env.CDN_LOCATIONS)
await helper.mkdir(env.CDN_TEMP_LOCATIONS)
await helper.mkdir(env.CDN_CONTRACTS)
await helper.mkdir(env.CDN_TEMP_CONTRACTS)
await helper.mkdir(env.CDN_LICENSES)
await helper.mkdir(env.CDN_TEMP_LICENSES)

export default app

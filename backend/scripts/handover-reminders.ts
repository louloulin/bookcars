import 'dotenv/config'
import mongoose from 'mongoose'
import { DB_URI, DB_SSL, DB_SSL_CERT, DB_SSL_CA } from '../src/config/env.config'
import { runScheduledHandoverReminders } from '../src/utils/handoverReminder'
import * as logger from '../src/utils/logger'
import { closeTransporter } from '../src/utils/mailHelper'

try {
  await mongoose.connect(DB_URI, {
    autoIndex: false,
    ...(DB_SSL && { tls: true, tlsCertificateKeyFile: DB_SSL_CERT, tlsCAFile: DB_SSL_CA }),
  })
  const { sent, failed } = await runScheduledHandoverReminders()
  logger.info(`[handover.reminder] Sent ${sent}, failed ${failed}`)
  if (failed) {
    process.exitCode = 1
  }
} catch (error) {
  logger.error('[handover.reminder] Scheduled run failed', error)
  process.exitCode = 1
} finally {
  await Promise.all([mongoose.disconnect(), closeTransporter()])
}

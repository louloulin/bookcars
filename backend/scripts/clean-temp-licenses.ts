import 'dotenv/config'
import { readdir, stat, unlink } from 'node:fs/promises'
import path from 'node:path'
import { allowedLicenseExtensions, CDN_TEMP_LICENSES } from '../src/config/env.config'

const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
let removed = 0
for (const entry of await readdir(CDN_TEMP_LICENSES, { withFileTypes: true })) {
  if (!entry.isFile() || !allowedLicenseExtensions.includes(path.extname(entry.name).toLowerCase())) {
    continue
  }
  const file = path.join(CDN_TEMP_LICENSES, entry.name)
  try {
    if ((await stat(file)).mtimeMs < cutoff) {
      await unlink(file)
      removed += 1
    }
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
      throw error
    }
  }
}
console.log(`Removed ${removed} temporary license uploads`)

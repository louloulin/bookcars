
/**
 * AMap (Gaode) JavaScript API 2.0 loader for the admin app.
 *
 * The security code (`jscode`) has to be set on `window._AMapSecurityConfig`
 * before the SDK script is appended to the document.
 */

declare global {
  interface Window {
    AMap?: any
    _AMapSecurityConfig?: {
      securityJsCode?: string
    }
  }
}

const AMAP_SCRIPT_ID = 'bookcars-admin-amap-sdk'

let amapPromise: Promise<any> | null = null

export const loadAmap = (key: string, securityJsCode?: string): Promise<any> => {
  if (amapPromise) {
    return amapPromise
  }

  amapPromise = new Promise((resolve, reject) => {
    if (securityJsCode) {
      window._AMapSecurityConfig = { securityJsCode }
    }

    const script = document.createElement('script')
    script.id = AMAP_SCRIPT_ID
    script.type = 'text/javascript'
    script.async = true
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}&plugin=AMap.PlaceSearch,AMap.Geocoder,AMap.ToolBar`

    script.onload = () => {
      if (window.AMap) {
        resolve(window.AMap)
      } else {
        amapPromise = null
        reject(new Error('The AMap SDK did not initialise'))
      }
    }

    script.onerror = () => {
      amapPromise = null
      reject(new Error('Unable to load the AMap SDK'))
    }

    document.head.appendChild(script)
  })

  return amapPromise
}

/**
 * Convert a GCJ-02 coordinate (AMap) into WGS-84 (GPS), which is the
 * coordinate system stored in the database.
 */
export const gcj02ToWgs84 = (
  longitude: number,
  latitude: number,
  AMapInstance?: any
): { longitude: number, latitude: number } => {
  if (!AMapInstance || !AMapInstance.convertTo) {
    return { longitude, latitude }
  }

  try {
    const converted = AMapInstance.convertTo([longitude, latitude], 'gps')

    if (converted && converted.length === 2) {
      return { longitude: converted[0], latitude: converted[1] }
    }
  } catch {
    // fall through, the GCJ-02 coordinate is used as is
  }

  return { longitude, latitude }
}

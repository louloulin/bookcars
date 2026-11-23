
/**
 * AMap (Gaode) JavaScript API 2.0 loader.
 *
 * The SDK is loaded on demand and shared between every map instance. The
 * security code (`jscode`) has to be set on `window._AMapSecurityConfig`
 * BEFORE the SDK script is appended to the document, otherwise the SDK is
 * rejected by AMap.
 */

declare global {
  interface Window {
    AMap?: any
    _AMapSecurityConfig?: {
      securityJsCode?: string
    }
  }
}

const AMAP_SCRIPT_ID = 'bookcars-amap-sdk'

let amapPromise: Promise<any> | null = null

export const loadAmap = (key: string, securityJsCode?: string): Promise<any> => {
  if (window.AMap && amapPromise) {
    return amapPromise
  }

  if (amapPromise) {
    return amapPromise
  }

  amapPromise = new Promise((resolve, reject) => {
    if (securityJsCode) {
      window._AMapSecurityConfig = { securityJsCode }
    }

    const existing = document.getElementById(AMAP_SCRIPT_ID) as HTMLScriptElement | null

    if (existing) {
      existing.addEventListener('load', () => resolve(window.AMap))
      existing.addEventListener('error', () => reject(new Error('Unable to load the AMap SDK')))

      return
    }

    const script = document.createElement('script')
    script.id = AMAP_SCRIPT_ID
    script.type = 'text/javascript'
    script.async = true
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}&plugin=AMap.PlaceSearch,AMap.Geocoder,AMap.Driving,AMap.ToolBar`

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
 * Convert a WGS-84 coordinate (GPS) into GCJ-02 (AMap / AutoNavi).
 * Mainland China uses GCJ-02, every other provider uses WGS-84.
 */
export const wgs84ToGcj02 = (
  longitude: number,
  latitude: number,
  AMapInstance?: any
): { longitude: number, latitude: number } => {
  if (!AMapInstance || !AMapInstance.convertFrom) {
    return { longitude, latitude }
  }

  try {
    const converted = AMapInstance.convertFrom([longitude, latitude], 'gps')

    if (converted && converted.length === 2) {
      return { longitude: converted[0], latitude: converted[1] }
    }
  } catch {
    // fall through, the WGS-84 coordinate is used as is
  }

  return { longitude, latitude }
}

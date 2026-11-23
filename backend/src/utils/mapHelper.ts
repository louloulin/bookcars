import axios from 'axios'
import * as env from '../config/env.config'

const AMAP_WEB_BASE_URL = 'https://restapi.amap.com'

/**
 * Cache TTL for map lookups (geocoding / POI / distance).
 * Map answers change very slowly, a short TTL is enough to protect the quota.
 */
const CACHE_TTL = 10 * 60 * 1000

/**
 * Average road speed (m/s) used by the offline distance estimation.
 */
const AVERAGE_ROAD_SPEED = 12.5

/**
 * Road to straight line distance ratio used by the offline distance estimation.
 */
const ROAD_DISTANCE_FACTOR = 1.3

export interface MapPlace {
  id?: string
  name: string
  address?: string
  city?: string
  district?: string
  longitude: number
  latitude: number
  type?: string
}

export interface MapDistance {
  /**
   * Distance in meters.
   */
  distance: number
  /**
   * Duration in seconds.
   */
  duration: number
  /**
   * 'amap' when the value comes from the AMap driving route, 'estimate' when it
   * is a straight line estimation computed locally (no provider configured).
   */
  source: 'amap' | 'estimate'
}

interface CacheEntry {
  expiresAt: number
  value: unknown
}

const cache = new Map<string, CacheEntry>()

const getCached = <T>(key: string): T | undefined => {
  const entry = cache.get(key)

  if (entry && entry.expiresAt > Date.now()) {
    return entry.value as T
  }

  if (entry) {
    cache.delete(key)
  }

  return undefined
}

const setCached = (key: string, value: unknown) => {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL })
}

/**
 * Indicate whether the AMap provider is configured and usable.
 */
export const isAmapEnabled = (): boolean => env.MAP_PROVIDER === 'amap' && !!env.AMAP_KEY

const parseLocation = (location?: string): { longitude: number, latitude: number } | null => {
  if (!location) {
    return null
  }

  const parts = location.split(',').map((p) => Number.parseFloat(p))

  if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
    return null
  }

  return { longitude: parts[0], latitude: parts[1] }
}

const amapGet = async <T>(path: string, params: Record<string, string | number>): Promise<T> => {
  const response = await axios.get<T>(`${AMAP_WEB_BASE_URL}${path}`, {
    params: {
      ...params,
      key: env.AMAP_KEY,
      output: 'JSON',
    },
    timeout: 8000,
  })

  return response.data
}

/**
 * Straight line distance between two coordinates, in meters.
 */
export const haversineDistance = (
  from: { longitude: number, latitude: number },
  to: { longitude: number, latitude: number }
): number => {
  const radius = 6371000
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = toRadians(to.latitude - from.latitude)
  const dLng = toRadians(to.longitude - from.longitude)
  const lat1 = toRadians(from.latitude)
  const lat2 = toRadians(to.latitude)

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)

  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Geocode a free text address into coordinates.
 *
 * @param address Address to look up.
 * @param city Optional city, used to disambiguate the result.
 */
export const geocode = async (address: string, city?: string): Promise<MapPlace | null> => {
  if (!address) {
    return null
  }

  const cacheKey = `geocode:${city || ''}:${address}`
  const cached = getCached<MapPlace | null>(cacheKey)

  if (cached !== undefined) {
    return cached
  }

  if (!isAmapEnabled()) {
    return null
  }

  const data = await amapGet<any>('/v3/geocode/geo', {
    address,
    ...(city ? { city } : {}),
  })

  const geocode = data?.geocodes?.[0]
  const position = parseLocation(geocode?.location)

  if (!position) {
    return null
  }

  const place: MapPlace = {
    name: geocode.formatted_address || address,
    address: geocode.formatted_address,
    city: geocode.city || city,
    district: geocode.district,
    longitude: position.longitude,
    latitude: position.latitude,
  }

  setCached(cacheKey, place)

  return place
}

/**
 * Reverse geocode coordinates into a human readable address.
 */
export const reverseGeocode = async (
  longitude: number,
  latitude: number
): Promise<{ address?: string, city?: string, district?: string, township?: string, adcode?: string } | null> => {
  if (!isAmapEnabled()) {
    return null
  }

  const cacheKey = `regeo:${longitude}:${latitude}`
  const cached = getCached<any>(cacheKey)

  if (cached !== undefined) {
    return cached
  }

  const data = await amapGet<any>('/v3/geocode/regeo', {
    location: `${longitude},${latitude}`,
    extensions: 'base',
  })

  const regeocode = data?.regeocode

  if (!regeocode) {
    return null
  }

  const addressComponent = regeocode.addressComponent || {}
  const result = {
    address: regeocode.formatted_address,
    city: Array.isArray(addressComponent.city) ? addressComponent.city[0] : addressComponent.city,
    district: Array.isArray(addressComponent.district) ? addressComponent.district[0] : addressComponent.district,
    township: Array.isArray(addressComponent.township) ? addressComponent.township[0] : addressComponent.township,
    adcode: addressComponent.adcode ? String(addressComponent.adcode) : undefined,
  }

  setCached(cacheKey, result)

  return result
}

/**
 * Search points of interest by keyword (store name, address, landmark...).
 */
export const placeSearch = async (keyword: string, city?: string): Promise<MapPlace[]> => {
  if (!keyword) {
    return []
  }

  const cacheKey = `place:${city || ''}:${keyword}`
  const cached = getCached<MapPlace[]>(cacheKey)

  if (cached !== undefined) {
    return cached
  }

  if (!isAmapEnabled()) {
    return []
  }

  const data = await amapGet<any>('/v3/place/text', {
    keywords: keyword,
    city: city || '全国',
    citylimit: city ? 'true' : 'false',
    offset: 20,
    page: 1,
    extensions: 'base',
  })

  const places: MapPlace[] = (data?.pois || [])
    .map((poi: any) => {
      const position = parseLocation(poi.location)

      if (!position) {
        return null
      }

      return {
        id: poi.id,
        name: poi.name,
        address: Array.isArray(poi.address) ? poi.address[0] : poi.address,
        city: poi.cityname,
        district: poi.adname,
        longitude: position.longitude,
        latitude: position.latitude,
        type: poi.type,
      }
    })
    .filter((place: MapPlace | null): place is MapPlace => place !== null)

  setCached(cacheKey, places)

  return places
}

/**
 * Driving distance and duration between two coordinates.
 *
 * Falls back to a straight line estimation when no provider is configured, so
 * the callers always get a usable (but clearly flagged as estimated) value.
 */
export const drivingDistance = async (
  from: { longitude: number, latitude: number },
  to: { longitude: number, latitude: number }
): Promise<MapDistance> => {
  const cacheKey = `driving:${from.longitude},${from.latitude}:${to.longitude},${to.latitude}`
  const cached = getCached<MapDistance>(cacheKey)

  if (cached !== undefined) {
    return cached
  }

  if (isAmapEnabled()) {
    try {
      const data = await amapGet<any>('/v3/direction/driving', {
        origin: `${from.longitude},${from.latitude}`,
        destination: `${to.longitude},${to.latitude}`,
        strategy: 0,
        extensions: 'base',
      })

      const route = data?.routes?.[0]

      if (route && typeof route.distance === 'number') {
        const distance: MapDistance = {
          distance: Math.round(route.distance),
          duration: Math.round(route.duration || (route.distance / AVERAGE_ROAD_SPEED)),
          source: 'amap',
        }

        setCached(cacheKey, distance)

        return distance
      }
    } catch {
      // fall through to the estimation below
    }
  }

  const straightLine = haversineDistance(from, to)
  const distance = Math.round(straightLine * ROAD_DISTANCE_FACTOR)

  const estimation: MapDistance = {
    distance,
    duration: Math.round(distance / AVERAGE_ROAD_SPEED),
    source: 'estimate',
  }

  setCached(cacheKey, estimation)

  return estimation
}

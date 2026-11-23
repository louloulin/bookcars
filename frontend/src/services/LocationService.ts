import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'
import * as UserService from './UserService'

/**
 * Get locations.
 *
 * @param {string} keyword
 * @param {number} page
 * @param {number} size
 * @returns {Promise<bookcarsTypes.Result<bookcarsTypes.Location>>}
 */
export const getLocations = (keyword: string, page: number, size: number): Promise<bookcarsTypes.Result<bookcarsTypes.Location>> =>
  axiosInstance
    .get(
      `/api/locations/${page}/${size}/${UserService.getLanguage()}/?s=${encodeURIComponent(keyword)}`
    )
    .then((res) => res.data)

/**
 * Get locations with position.
 *
 * @returns {Promise<bookcarsTypes.Result<bookcarsTypes.Location>>}
 */
export const getLocationsWithPosition = (): Promise<bookcarsTypes.Location[]> =>
  axiosInstance
    .get(
      `/api/locations-with-position/${UserService.getLanguage()}`
    )
    .then((res) => res.data)

/**
 * Get a Location by ID.
 *
 * @param {string} id
 * @returns {Promise<bookcarsTypes.Location>}
 */
export const getLocation = (id: string): Promise<bookcarsTypes.Location> =>
  axiosInstance
    .get(
      `/api/location/${encodeURIComponent(id)}/${UserService.getLanguage()}`
    )
    .then((res) => res.data)

/**
 * Get Loaction ID by name (en).
 *
 * @param {string} name
 * @param {string} language
 * @returns {Promise<{ status: number, data: string }>}
 */
export const getLocationId = (name: string, language: string): Promise<{ status: number, data: string }> =>
  axiosInstance
    .get(
      `/api/location-id/${encodeURIComponent(name)}/${language}`
    )
    .then((res) => ({ status: res.status, data: res.data }))

/**
 * Driving distance between two coordinates.
 *
 * @param {string} from 'longitude,latitude'
 * @param {string} to 'longitude,latitude'
 * @returns {Promise<{ status: number, data: { distance: number, duration: number, source: string } }>}
 */
export const getDistance = (
  from: string,
  to: string
): Promise<{ status: number, data: { distance: number, duration: number, source: string } }> =>
  axiosInstance
    .get(
      `/api/map/distance?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    )
    .then((res) => ({ status: res.status, data: res.data }))

/**
 * Geocode an address into coordinates.
 *
 * @param {string} address
 * @param {string} city
 * @returns {Promise<{ status: number, data: { name: string, address?: string, city?: string, longitude: number, latitude: number } }>}
 */
export const geocode = (
  address: string,
  city?: string
): Promise<{ status: number, data: { name: string, address?: string, city?: string, longitude: number, latitude: number } }> =>
  axiosInstance
    .get(
      `/api/map/geocode?address=${encodeURIComponent(address)}${city ? `&city=${encodeURIComponent(city)}` : ''}`
    )
    .then((res) => ({ status: res.status, data: res.data }))

/**
 * Search points of interest.
 *
 * @param {string} keyword
 * @param {string} city
 * @returns {Promise<{ status: number, data: { name: string, address?: string, city?: string, longitude: number, latitude: number }[] }>}
 */
export const placeSearch = (
  keyword: string,
  city?: string
): Promise<{ status: number, data: { name: string, address?: string, city?: string, longitude: number, latitude: number }[] }> =>
  axiosInstance
    .get(
      `/api/map/place-search?keyword=${encodeURIComponent(keyword)}${city ? `&city=${encodeURIComponent(city)}` : ''}`
    )
    .then((res) => ({ status: res.status, data: res.data }))

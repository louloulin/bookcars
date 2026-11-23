import { Request, Response } from 'express'
import * as mapHelper from '../utils/mapHelper'
import * as logger from '../utils/logger'
import i18n from '../lang/i18n'

const MAX_KEYWORD_LENGTH = 100

const parseCoordinates = (value?: string): { longitude: number, latitude: number } | null => {
  if (!value) {
    return null
  }

  const parts = value.split(',').map((p) => Number.parseFloat(p.trim()))

  if (parts.length !== 2 || parts.some((p) => Number.isNaN(p))) {
    return null
  }

  const [longitude, latitude] = parts

  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    return null
  }

  return { longitude, latitude }
}

/**
 * Geocode an address into coordinates.
 *
 * GET /api/map/geocode?address=...&city=...
 */
export const geocode = async (req: Request, res: Response) => {
  const { address, city } = req.query

  try {
    if (!address || typeof address !== 'string' || !address.trim()) {
      res.status(400).json({ error: 'address is required' })
      return
    }

    const place = await mapHelper.geocode(address.trim().slice(0, MAX_KEYWORD_LENGTH), typeof city === 'string' ? city : undefined)

    if (!place) {
      res.status(404).json({ error: 'address not found' })
      return
    }

    res.status(200).json(place)
  } catch (err) {
    logger.error(`[map.geocode] ${i18n.t('ERROR')}`, err)
    res.status(500).json({ error: i18n.t('ERROR') })
  }
}

/**
 * Reverse geocode coordinates into an address.
 *
 * GET /api/map/reverse-geocode?longitude=...&latitude=...
 */
export const reverseGeocode = async (req: Request, res: Response) => {
  const { longitude, latitude } = req.query

  try {
    const lng = Number.parseFloat(String(longitude))
    const lat = Number.parseFloat(String(latitude))

    if (Number.isNaN(lng) || Number.isNaN(lat)) {
      res.status(400).json({ error: 'longitude and latitude are required' })
      return
    }

    const address = await mapHelper.reverseGeocode(lng, lat)

    if (!address) {
      res.status(404).json({ error: 'address not found' })
      return
    }

    res.status(200).json(address)
  } catch (err) {
    logger.error(`[map.reverseGeocode] ${i18n.t('ERROR')}`, err)
    res.status(500).json({ error: i18n.t('ERROR') })
  }
}

/**
 * Search points of interest.
 *
 * GET /api/map/place-search?keyword=...&city=...
 */
export const placeSearch = async (req: Request, res: Response) => {
  const { keyword, city } = req.query

  try {
    if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
      res.status(400).json({ error: 'keyword is required' })
      return
    }

    const places = await mapHelper.placeSearch(
      keyword.trim().slice(0, MAX_KEYWORD_LENGTH),
      typeof city === 'string' && city.trim() ? city.trim() : undefined
    )

    res.status(200).json(places)
  } catch (err) {
    logger.error(`[map.placeSearch] ${i18n.t('ERROR')}`, err)
    res.status(500).json({ error: i18n.t('ERROR') })
  }
}

/**
 * Driving distance between two coordinates.
 *
 * GET /api/map/distance?from=lng,lat&to=lng,lat
 */
export const distance = async (req: Request, res: Response) => {
  const { from, to } = req.query

  try {
    const fromPosition = parseCoordinates(typeof from === 'string' ? from : undefined)
    const toPosition = parseCoordinates(typeof to === 'string' ? to : undefined)

    if (!fromPosition || !toPosition) {
      res.status(400).json({ error: 'from and to are required' })
      return
    }

    const result = await mapHelper.drivingDistance(fromPosition, toPosition)

    res.status(200).json(result)
  } catch (err) {
    logger.error(`[map.distance] ${i18n.t('ERROR')}`, err)
    res.status(500).json({ error: i18n.t('ERROR') })
  }
}

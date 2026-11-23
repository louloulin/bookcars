import { ReactNode } from 'react'
import * as bookcarsTypes from ':bookcars-types'

/**
 * Normalised map position, independent of the map provider.
 */
export interface MapPosition {
  latitude: number
  longitude: number
}

export interface MapProps {
  title?: string
  position?: MapPosition
  initialZoom?: number
  locations?: bookcarsTypes.Location[]
  parkingSpots?: bookcarsTypes.ParkingSpot[]
  className?: string
  children?: ReactNode
  onSelelectPickUpLocation?: (locationId: string) => void
}

/**
 * Default position, centred on the configured map coordinates.
 */
export const DEFAULT_POSITION: MapPosition = {
  latitude: 34.0268755,
  longitude: 1.6528399999999976,
}

/**
 * Default zoom level.
 */
export const DEFAULT_ZOOM = 5.5

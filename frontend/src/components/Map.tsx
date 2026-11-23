import React, { ReactNode } from 'react'
import { LatLngExpression } from 'leaflet'
import * as bookcarsTypes from ':bookcars-types'
import env from '@/config/env.config'
import AmapMap from './map/AmapMap'
import OsmMap from './map/OsmMap'
import { MapPosition } from './map/types'

interface MapProps {
  title?: string
  position?: LatLngExpression
  initialZoom?: number
  locations?: bookcarsTypes.Location[]
  parkingSpots?: bookcarsTypes.ParkingSpot[]
  className?: string
  children?: ReactNode
  onSelelectPickUpLocation?: (locationId: string) => void
}

/**
 * Normalise a Leaflet position into a provider independent position.
 */
const toPosition = (position?: LatLngExpression): MapPosition | undefined => {
  if (!position) {
    return undefined
  }

  if (Array.isArray(position)) {
    return { latitude: position[0], longitude: position[1] }
  }

  return { latitude: position.lat, longitude: position.lng }
}

/**
 * Map facade.
 *
 * The map provider is selected by configuration:
 *
 * - `amap` (AMap / Gaode, 高德地图): the reference provider for mainland
 *   China. GCJ-02 coordinates, licensed base map, POI search, routing and
 *   distance matrix. Requires `VITE_BC_AMAP_KEY` and `VITE_BC_AMAP_SECURITY_CODE`.
 * - `osm` (OpenStreetMap): default provider for deployments outside mainland
 *   China, where the AMap licence does not apply.
 */
const Map = (props: MapProps) => {
  const position = toPosition(props.position)

  if (env.MAP_PROVIDER === 'amap') {
    return <AmapMap {...props} position={position} />
  }

  return <OsmMap {...props} position={position} />
}

export default Map

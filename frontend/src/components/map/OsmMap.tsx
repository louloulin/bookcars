import React, { Dispatch, ReactNode, SetStateAction, useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import { strings } from '@/lang/map'
import * as LocationService from '@/services/LocationService'
import * as helper from '@/utils/helper'
import env from '@/config/env.config'
import { DEFAULT_ZOOM, MapProps } from './types'

import 'leaflet-boundary-canvas'
import 'leaflet/dist/leaflet.css'
import '@/assets/css/map.css'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow
})

L.Marker.prototype.options.icon = DefaultIcon

interface MapMarker {
  name: string,
  position: L.LatLng
}

const markers: MapMarker[] = [
  // { name: 'Athens (ATH)', position: new L.LatLng(37.983810, 23.727539) },
]
const zoomMarkers: MapMarker[] = [
  // { name: 'Athens Airport (ATH)', position: new L.LatLng(37.937225, 23.945238) },
  // { name: 'Athens Port Piraeus (ATH)', position: new L.LatLng(37.9495811, 23.6121006) },
]

interface ZoomTrackerProps {
  setZoom: Dispatch<SetStateAction<number>>
}

const ZoomTracker = ({ setZoom }: ZoomTrackerProps) => {
  const mapEvents = useMapEvents({
    zoom() {
      setZoom(mapEvents.getZoom())
    }
  })

  return null
}

interface ZoomControlledLayerProps {
  zoom: number
  minZoom: number
  children: ReactNode
}

const ZoomControlledLayer = ({ zoom, minZoom, children }: ZoomControlledLayerProps) => {
  if (zoom >= minZoom) {
    return (
      <>
        {children}
      </>
    )
  }
  return null
}

/**
 * OpenStreetMap / Leaflet based map.
 *
 * Used for deployments outside mainland China. Inside mainland China the AMap
 * provider has to be used instead (see AmapMap.tsx), because the OSM tiles are
 * not covered by an online mapping licence there.
 */
const OsmMap = ({
  title,
  position,
  initialZoom,
  locations,
  parkingSpots,
  className,
  children,
  onSelelectPickUpLocation,
}: MapProps) => {
  const _initialZoom = initialZoom || DEFAULT_ZOOM
  const _position: LatLngExpression = position
    ? [position.latitude, position.longitude]
    : [env.MAP_LATITUDE, env.MAP_LONGITUDE]
  const [zoom, setZoom] = useState(_initialZoom)
  const map = useRef<L.Map | null>(null)

  useEffect(() => {
    if (map.current) {
      map.current.invalidateSize()
    }
  }, [map])

  useEffect(() => {
    if (map.current && position) {
      map.current.setView([position.latitude, position.longitude], _initialZoom)
    }
  }, [position, _initialZoom, map])

  //
  // Tile server
  //

  const tileURL = env.MAP_TILE_URL

  const getLocationMarkers = (): MapMarker[] => (
    (locations
      && locations
        .filter((l) => l.latitude && l.longitude)
        .map((l) => ({ name: l.name!, position: new L.LatLng(l.latitude!, l.longitude!) }))
    ) || []
  )

  const getMarkers = (__markers: MapMarker[]) =>
    __markers.map((marker) => (
      <Marker key={marker.name} position={marker.position}>
        <Popup className="marker">
          <div className="name">{marker.name}</div>
          <div className="action">
            {!!onSelelectPickUpLocation && (
              <button
                type="button"
                className="action-btn"
                onClick={async () => {
                  try {
                    if (onSelelectPickUpLocation) {
                      const { status, data } = await LocationService.getLocationId(marker.name, 'en')

                      if (status === 200) {
                        onSelelectPickUpLocation(data)
                      } else {
                        helper.error()
                      }
                    }
                  } catch (err) {
                    helper.error(err)
                  }
                }}
              >
                {strings.SELECT_PICK_UP_LOCATION}
              </button>
            )}
          </div>
        </Popup>
      </Marker>
    ))

  const getParkingSpots = () =>
    parkingSpots && parkingSpots.map((parkingSpot) => (
      <Marker key={parkingSpot._id} position={[Number(parkingSpot.latitude), Number(parkingSpot.longitude)]}>
        <Popup className="marker">
          <div className="name">{parkingSpot.name}</div>
        </Popup>
      </Marker>
    ))

  return (
    <>
      {title && <h1 className="title">{title}</h1>}
      <MapContainer
        center={_position}
        zoom={_initialZoom}
        className={`${className ? `${className} ` : ''}map`}
        ref={map}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileURL}
        />
        <ZoomTracker setZoom={setZoom} />
        <ZoomControlledLayer zoom={zoom} minZoom={7.5}>
          {
            getMarkers(zoomMarkers)
          }
        </ZoomControlledLayer>
        <ZoomControlledLayer zoom={zoom} minZoom={5.5}>
          {
            getMarkers(markers)
          }
        </ZoomControlledLayer>
        <ZoomControlledLayer zoom={zoom} minZoom={_initialZoom}>
          {
            getMarkers(getLocationMarkers())
          }
          {
            getParkingSpots()
          }
        </ZoomControlledLayer>
        {children}
      </MapContainer>
    </>
  )
}

export default OsmMap

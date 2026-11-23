import React, { useEffect, useRef, useState } from 'react'
import { strings } from '@/lang/map'
import * as LocationService from '@/services/LocationService'
import * as helper from '@/utils/helper'
import env from '@/config/env.config'
import { loadAmap, wgs84ToGcj02 } from './amap'
import { DEFAULT_ZOOM, MapProps } from './types'

import '@/assets/css/map.css'

/**
 * AMap (Gaode) based map.
 *
 * AMap is the reference map provider for mainland China:
 *
 * - the base map, POI and the routing service are covered by a commercial
 *   online mapping licence,
 * - the coordinates are GCJ-02, which is the coordinate system used by all the
 *   Chinese government and public services (and by the domestic platforms the
 *   product is benchmarked against),
 * - the SDK renders the AMap logo and copyright, which is a licence condition.
 *
 * The API key is the Web端 (JS API) key, the security code (`jscode`) has to be
 * set as well, see `frontend/.env.example`.
 */
const AmapMap = ({
  title,
  position,
  initialZoom,
  locations,
  parkingSpots,
  className,
  children,
  onSelelectPickUpLocation,
}: MapProps) => {
  const container = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<any>(null)
  const infoWindow = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(initialZoom || DEFAULT_ZOOM)

  const _initialZoom = initialZoom || DEFAULT_ZOOM
  const latitude = position ? position.latitude : env.MAP_LATITUDE
  const longitude = position ? position.longitude : env.MAP_LONGITUDE

  // Load the SDK and create the map instance
  useEffect(() => {
    let cancelled = false

    const key = env.AMAP_KEY

    if (!key) {
      setError('AMAP_KEY')
      return
    }

    loadAmap(key, env.AMAP_SECURITY_CODE)
      .then((AMap) => {
        if (cancelled || !container.current) {
          return
        }

        const map = new AMap.Map(container.current, {
          zoom: _initialZoom,
          center: (() => {
            const center = wgs84ToGcj02(longitude, latitude, AMap)
            return [center.longitude, center.latitude]
          })(),
          viewMode: '2D',
          mapStyle: 'amap://styles/whitesmoke',
          showLabel: true,
        })

        mapInstance.current = map
        infoWindow.current = new AMap.InfoWindow({ isCustom: true, offset: new AMap.Pixel(0, -12) })

        map.on('zoom', () => setZoom(map.getZoom()))
      })
      .catch(() => {
        if (!cancelled) {
          setError('SDK')
        }
      })

    return () => {
      cancelled = true

      if (mapInstance.current) {
        mapInstance.current.destroy()
        mapInstance.current = null
      }
    }
  }, [])

  // Keep the map centred on the requested position
  useEffect(() => {
    if (mapInstance.current) {
      const center = wgs84ToGcj02(longitude, latitude, window.AMap)
      mapInstance.current.setZoomAndCenter(_initialZoom, [center.longitude, center.latitude])
    }
  }, [latitude, longitude, _initialZoom])

  // Draw the location and parking spot markers
  useEffect(() => {
    const map = mapInstance.current

    if (!map || !window.AMap) {
      return
    }

    const AMap = window.AMap
    map.remove(map.getAllOverlays('marker'))

    // The database stores WGS-84 coordinates, the AMap base map uses GCJ-02.
    const toGcj02 = (lng: number, lat: number) => wgs84ToGcj02(lng, lat, AMap)

    const createPopup = (name: string, onSelect?: () => void) => {
      const container = document.createElement('div')
      container.className = 'marker'

      const title = document.createElement('div')
      title.className = 'name'
      title.textContent = name
      container.appendChild(title)

      if (onSelect) {
        const action = document.createElement('div')
        action.className = 'action'

        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'action-btn'
        button.textContent = strings.SELECT_PICK_UP_LOCATION
        button.onclick = async () => {
          try {
            const { status } = await LocationService.getLocationId(name, 'en')

            if (status === 200) {
              onSelect()
            } else {
              helper.error()
            }
          } catch (err) {
            helper.error(err)
          }
        }

        action.appendChild(button)
        container.appendChild(action)
      }

      return container
    }

    const selectLocation = onSelelectPickUpLocation
      ? async (name: string) => {
        try {
          const { status, data } = await LocationService.getLocationId(name, 'en')

          if (status === 200) {
            onSelelectPickUpLocation(data)
          } else {
            helper.error()
          }
        } catch (err) {
          helper.error(err)
        }
      }
      : undefined

    ;(locations || [])
      .filter((location) => location.latitude && location.longitude)
      .forEach((location) => {
        const position = toGcj02(Number(location.longitude), Number(location.latitude))
        const marker = new AMap.Marker({
          position: [position.longitude, position.latitude],
          title: location.name,
        })

        marker.on('click', () => {
          const content = createPopup(location.name || '', selectLocation ? () => selectLocation(location.name || '') : undefined)
          infoWindow.current.setContent(content)
          infoWindow.current.open(map, marker.getPosition())
        })

        map.add(marker)
      })

    ;(parkingSpots || []).forEach((parkingSpot) => {
      const position = toGcj02(Number(parkingSpot.longitude), Number(parkingSpot.latitude))
      const marker = new AMap.Marker({
        position: [position.longitude, position.latitude],
        title: parkingSpot.name,
      })

      marker.on('click', () => {
        infoWindow.current.setContent(createPopup(parkingSpot.name || ''))
        infoWindow.current.open(map, marker.getPosition())
      })

      map.add(marker)
    })
  }, [locations, parkingSpots, zoom, onSelelectPickUpLocation])

  if (error) {
    return (
      <>
        {title && <h1 className="title">{title}</h1>}
        <div className={`${className ? `${className} ` : ''}map map-unavailable`}>
          <p>{strings.MAP_UNAVAILABLE}</p>
        </div>
      </>
    )
  }

  return (
    <>
      {title && <h1 className="title">{title}</h1>}
      <div className={`${className ? `${className} ` : ''}map map-amap`}>
        <div ref={container} className="map-amap-canvas" />
        <div className="map-overlay">{children}</div>
      </div>
    </>
  )
}

export default AmapMap

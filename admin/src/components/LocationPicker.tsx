import React, { useEffect, useRef, useState } from 'react'
import { Button, TextField } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import env from '@/config/env.config'
import { strings } from '@/lang/location-map'
import * as LocationService from '@/services/LocationService'
import { gcj02ToWgs84, loadAmap } from './map/amap'

import '@/assets/css/location-picker.css'

interface LocationPickerProps {
  latitude?: number | string
  longitude?: number | string
  onChange: (values: { latitude?: number, longitude?: number, address?: string }) => void
}

/**
 * Default centre, Beijing.
 */
const DEFAULT_CENTER = { longitude: 116.397428, latitude: 39.90923 }

/**
 * Map picker used when a location is created or updated.
 *
 * The store clicks on the map (or searches for an address) and the component
 * returns the coordinates in WGS-84, the coordinate system stored in the
 * database, together with the resolved address.
 */
const LocationPicker = ({ latitude, longitude, onChange }: LocationPickerProps) => {
  const container = useRef<HTMLDivElement | null>(null)
  const map = useRef<any>(null)
  const marker = useRef<any>(null)
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<bookcarsTypes.MapPlace[]>([])
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const setMarker = (AMap: any, lng: number, lat: number) => {
    if (!map.current) {
      return
    }

    if (marker.current) {
      map.current.remove(marker.current)
    }

    marker.current = new AMap.Marker({ position: [lng, lat] })
    map.current.add(marker.current)
  }

  const pick = async (AMap: any, gcjLng: number, gcjLat: number) => {
    const wgs = gcj02ToWgs84(gcjLng, gcjLat, AMap)
    setMarker(AMap, gcjLng, gcjLat)

    onChange({ latitude: wgs.latitude, longitude: wgs.longitude })

    try {
      const { status, data } = await LocationService.reverseGeocode(gcjLng, gcjLat)

      if (status === 200 && data?.address) {
        onChange({ latitude: wgs.latitude, longitude: wgs.longitude, address: data.address })
      }
    } catch {
      // the coordinates are already set, the address can be typed manually
    }
  }

  useEffect(() => {
    if (!env.AMAP_KEY) {
      return
    }

    let cancelled = false

    loadAmap(env.AMAP_KEY, env.AMAP_SECURITY_CODE)
      .then((AMap) => {
        if (cancelled || !container.current) {
          return
        }

        const hasPosition = !!latitude && !!longitude
        const center = hasPosition
          ? [Number(longitude), Number(latitude)]
          : [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude]

        const mapInstance = new AMap.Map(container.current, {
          zoom: hasPosition ? 14 : 11,
          center,
          viewMode: '2D',
          mapStyle: 'amap://styles/whitesmoke',
        })

        map.current = mapInstance

        mapInstance.on('click', (event: any) => {
          pick(AMap, event.lnglat.getLng(), event.lnglat.getLat())
        })

        if (hasPosition && AMap.convertFrom) {
          try {
            const converted = AMap.convertFrom([Number(longitude), Number(latitude)], 'gps')
            setMarker(AMap, converted[0], converted[1])
          } catch {
            setMarker(AMap, Number(longitude), Number(latitude))
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
        }
      })

    return () => {
      cancelled = true

      if (map.current) {
        map.current.destroy()
        map.current = null
      }
    }
  }, [])

  const onSearch = async () => {
    if (!keyword.trim()) {
      return
    }

    setLoading(true)

    try {
      const { status, data } = await LocationService.placeSearch(keyword.trim())

      if (status === 200) {
        setResults(data || [])
      } else {
        setResults([])
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const onSelectResult = (place: bookcarsTypes.MapPlace) => {
    if (!window.AMap || !map.current) {
      return
    }

    setResults([])
    setKeyword(place.name || '')
    map.current.setZoomAndCenter(15, [place.longitude, place.latitude])
    pick(window.AMap, place.longitude, place.latitude)
  }

  if (!env.AMAP_KEY || failed) {
    return (
      <div className="location-picker location-picker-disabled">
        <p>{strings.MAP_NOT_CONFIGURED}</p>
      </div>
    )
  }

  return (
    <div className="location-picker">
      <div className="location-picker-search">
        <TextField
          fullWidth
          size="small"
          placeholder={strings.SEARCH_ADDRESS}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSearch()
            }
          }}
        />
        <Button variant="contained" onClick={onSearch} disabled={loading}>
          {strings.SEARCH}
        </Button>
      </div>
      {results.length > 0 && (
        <ul className="location-picker-results">
          {results.map((place) => (
            <li key={place.id || `${place.longitude},${place.latitude}`}>
              <button type="button" onClick={() => onSelectResult(place)}>
                <span className="name">{place.name}</span>
                {place.address && <span className="address">{place.address}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div ref={container} className="location-picker-map" />
      <p className="location-picker-hint">{strings.PICK_POINT}</p>
    </div>
  )
}

export default LocationPicker

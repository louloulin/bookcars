import React, { useState } from 'react'
import { Dialog, DialogContent } from '@mui/material'
import L from 'leaflet'
import env from '@/config/env.config'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import * as LocationService from '@/services/LocationService'
import Layout from '@/components/Layout'
import Map from '@/components/Map'
import SearchForm from '@/components/SearchForm'
import Footer from '@/components/Footer'
import { strings as pageStrings } from '@/lang/page'
import { strings as mapStrings } from '@/lang/map'

import '@/assets/css/locations.css'

const Locations = () => {
  const [locations, setLocations] = useState<bookcarsTypes.Location[]>([])
  const [pickupLocation, setPickupLocation] = useState('')
  const [openSearchFormDialog, setOpenSearchFormDialog] = useState(false)

  const onLoad = async () => {
    const _locations = await LocationService.getLocationsWithPosition()
    setLocations(_locations)
  }

  const selectLocation = (locationId: string) => {
    setPickupLocation(locationId)
    setOpenSearchFormDialog(true)
  }

  return (
    <Layout onLoad={onLoad} strict={false}>
      <div className="locations">
        <div className="locations-map-wrap">
          <Map
            position={new L.LatLng(env.MAP_LATITUDE, env.MAP_LONGITUDE)}
            initialZoom={env.MAP_ZOOM}
            locations={locations}
            onSelelectPickUpLocation={selectLocation}
          />
        </div>

        <aside className="locations-panel">
          <span className="page-eyebrow">{pageStrings.LOCATIONS_EYEBROW}</span>
          <h1 className="page-title locations-panel-title">{pageStrings.LOCATIONS_PANEL_TITLE}</h1>
          <p className="locations-panel-subtitle">{pageStrings.LOCATIONS_PANEL_SUBTITLE}</p>

          <ul className="locations-list">
            {locations.map((location) => (
              <li key={location._id}>
                <button type="button" className="locations-list-item" onClick={() => selectLocation(location._id)}>
                  <span className="locations-list-name">{location.name}</span>
                  {location.address && <span className="locations-list-meta">{`${mapStrings.ADDRESS}: ${location.address}`}</span>}
                  {location.businessHours && <span className="locations-list-meta">{`${mapStrings.BUSINESS_HOURS}: ${location.businessHours}`}</span>}
                  {location.pickupInstructions && <span className="locations-list-meta locations-list-instructions">{location.pickupInstructions}</span>}
                  <span className="locations-list-cta">{pageStrings.SELECT_LOCATION}</span>
                </button>
              </li>
            ))}
          </ul>

          {locations.length === 0 && <p className="locations-list-empty">{pageStrings.LOCATIONS_PANEL_SUBTITLE}</p>}
        </aside>
      </div>

      <Dialog
        fullWidth={env.isMobile}
        maxWidth={false}
        open={openSearchFormDialog}
        onClose={() => {
          setOpenSearchFormDialog(false)
        }}
      >
        <DialogContent className="search-dialog-content">
          <SearchForm
            ranges={bookcarsHelper.getAllRanges()}
            pickupLocation={pickupLocation}
            onCancel={() => {
              setOpenSearchFormDialog(false)
            }}
          />
        </DialogContent>
      </Dialog>

      <Footer />
    </Layout>
  )
}

export default Locations

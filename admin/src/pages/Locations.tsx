import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import { strings } from '@/lang/locations'
import Search from '@/components/Search'
import LocationList from '@/components/LocationList'
import InfoBox from '@/components/InfoBox'
import WorkspaceHead from '@/components/WorkspaceHead'
import { strings as workspaceStrings } from '@/lang/workspace'

import '@/assets/css/locations.css'
import '@/assets/css/workspace.css'

const Locations = () => {
  const navigate = useNavigate()

  const [keyword, setKeyword] = useState('')
  const [rowCount, setRowCount] = useState(-1)

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
  }

  const handleLocationListLoad: bookcarsTypes.DataEvent<bookcarsTypes.Location> = (data) => {
    if (data) {
      setRowCount(data.rowCount)
    }
  }

  const handleLocationDelete = (_rowCount: number) => {
    setRowCount(_rowCount)
  }

  const onLoad = () => { }

  return (
    <Layout onLoad={onLoad} strict>
      <div className="locations ws-page">
        <WorkspaceHead title={workspaceStrings.LOCATIONS_TITLE} subtitle={workspaceStrings.LOCATIONS_SUBTITLE}>
          {rowCount > -1 && (
            <Button variant="contained" className="btn-primary new-location" size="small" onClick={() => navigate('/create-location')}>
              {strings.NEW_LOCATION}
            </Button>
          )}
        </WorkspaceHead>
        <div className="ws-body">
          <div className="ws-side col-1">
            <div className="col-1-container ws-side-panel">
              <Search className="search" onSubmit={handleSearch} />

              {rowCount > 0
                && (
                  <InfoBox
                    value={`${rowCount} ${rowCount > 1 ? strings.LOCATIONS : strings.LOCATION}`}
                    className="location-count"
                  />
                )}
            </div>
          </div>
          <div className="ws-main col-2">
            <div className="ws-main-panel">
              <LocationList
                keyword={keyword}
                onLoad={handleLocationListLoad}
                onDelete={handleLocationDelete}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Locations

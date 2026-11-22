import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import { strings } from '@/lang/countries'
import Search from '@/components/Search'
import CountryList from '@/components/CountryList'
import InfoBox from '@/components/InfoBox'
import WorkspaceHead from '@/components/WorkspaceHead'
import { strings as workspaceStrings } from '@/lang/workspace'

import '@/assets/css/countries.css'
import '@/assets/css/workspace.css'

const Countries = () => {
  const navigate = useNavigate()

  const [keyword, setKeyword] = useState('')
  const [rowCount, setRowCount] = useState(-1)

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
  }

  const handleCountryListLoad: bookcarsTypes.DataEvent<bookcarsTypes.Country> = (data) => {
    if (data) {
      setRowCount(data.rowCount)
    }
  }

  const handleCountryDelete = (_rowCount: number) => {
    setRowCount(_rowCount)
  }

  const onLoad = () => { }

  return (
    <Layout onLoad={onLoad} strict>
      <div className="countries ws-page">
        <WorkspaceHead title={workspaceStrings.COUNTRIES_TITLE} subtitle={workspaceStrings.COUNTRIES_SUBTITLE}>
          {rowCount > -1 && (
            <Button variant="contained" className="btn-primary new-country" size="small" onClick={() => navigate('/create-country')}>
              {strings.NEW_COUNTRY}
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
                    value={`${rowCount} ${rowCount > 1 ? strings.COUNTRIES : strings.COUNTRY}`}
                    className="country-count"
                  />
                )}
            </div>
          </div>
          <div className="ws-main col-2">
            <div className="ws-main-panel">
              <CountryList
                keyword={keyword}
                onLoad={handleCountryListLoad}
                onDelete={handleCountryDelete}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Countries

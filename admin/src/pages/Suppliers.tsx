import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import { strings } from '@/lang/suppliers'
import Search from '@/components/Search'
import SupplierList from '@/components/SupplierList'
import InfoBox from '@/components/InfoBox'
import * as helper from '@/utils/helper'
import WorkspaceHead from '@/components/WorkspaceHead'
import { strings as workspaceStrings } from '@/lang/workspace'

import '@/assets/css/suppliers.css'
import '@/assets/css/workspace.css'

const Suppliers = () => {
  const navigate = useNavigate()

  const [user, setUser] = useState<bookcarsTypes.User>()
  const [keyword, setKeyword] = useState('')
  const [rowCount, setRowCount] = useState(-1)

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
  }

  const handleSupplierListLoad: bookcarsTypes.DataEvent<bookcarsTypes.User> = (data) => {
    if (data) {
      setRowCount(data.rowCount)
    }
  }

  const handleSupplierDelete = (_rowCount: number) => {
    setRowCount(_rowCount)
  }

  const onLoad = (_user?: bookcarsTypes.User) => {
    setUser(_user)
  }

  const admin = helper.admin(user)

  return (
    <Layout onLoad={onLoad} strict>
      {user && (
        <div className="suppliers ws-page">
          <WorkspaceHead title={workspaceStrings.SUPPLIERS_TITLE} subtitle={workspaceStrings.SUPPLIERS_SUBTITLE}>
            {rowCount > -1 && admin && (
              <Button
                type="submit"
                variant="contained"
                className="btn-primary new-supplier"
                size="small"
                onClick={() => navigate('/create-supplier')}
              >
                {strings.NEW_SUPPLIER}
              </Button>
            )}
          </WorkspaceHead>
          <div className="ws-body">
            <div className="ws-side col-1">
              <div className="col-1-container ws-side-panel">
                <Search className="search" onSubmit={handleSearch} />

                {rowCount > 0 && (
                <InfoBox
                  value={`${rowCount} ${rowCount > 1 ? strings.SUPPLIERS : strings.SUPPLIER}`}
                  className="supplier-count"
                />
              )}
              </div>
            </div>
            <div className="ws-main col-2">
              <div className="ws-main-panel">
                <SupplierList
                  user={user}
                  keyword={keyword}
                  onLoad={handleSupplierListLoad}
                  onDelete={handleSupplierDelete}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Suppliers

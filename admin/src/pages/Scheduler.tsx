import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings } from '@/lang/bookings'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import * as SupplierService from '@/services/SupplierService'
import VehicleScheduler from '@/components/VehicleScheduler'
import SupplierFilter from '@/components/SupplierFilter'
import StatusFilter from '@/components/StatusFilter'
import VehicleSchedulerFilter from '@/components/VehicleSchedulerFilter'
import WorkspaceHead from '@/components/WorkspaceHead'
import { strings as workspaceStrings } from '@/lang/workspace'

import Layout from '@/components/Layout'

import '@/assets/css/scheduler.css'
import '@/assets/css/workspace.css'

const Scheduler = () => {
  const navigate = useNavigate()

  const [user, setUser] = useState<bookcarsTypes.User>()
  const [leftPanel, setLeftPanel] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [allSuppliers, setAllSuppliers] = useState<bookcarsTypes.User[]>([])
  const [suppliers, setSuppliers] = useState<string[]>()
  const [statuses, setStatuses] = useState(helper.getBookingStatuses().map((status) => status.value))
  const [filter, setFilter] = useState<bookcarsTypes.Filter | null>()

  const handleSupplierFilterChange = (_suppliers: string[]) => {
    setSuppliers(_suppliers)
  }

  const handleStatusFilterChange = (_statuses: bookcarsTypes.BookingStatus[]) => {
    setStatuses(_statuses)
  }

  const handleVehicleSchedulerFilterSubmit = (_filter: bookcarsTypes.Filter | null) => {
    setFilter(_filter)
  }

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      const _admin = helper.admin(_user)
      setUser(_user)
      setAdmin(_admin)
      setLeftPanel(!_admin)

      const _allSuppliers = await SupplierService.getAllSuppliers()
      const _suppliers = _admin ? bookcarsHelper.flattenSuppliers(_allSuppliers) : [_user._id ?? '']
      setAllSuppliers(_allSuppliers)
      setSuppliers(_suppliers)
      setLeftPanel(true)
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      {user && suppliers && (
        <div className="scheduler ws-page">
          <WorkspaceHead title={workspaceStrings.SCHEDULER_TITLE} subtitle={workspaceStrings.SCHEDULER_SUBTITLE}>
            {leftPanel && (
              <Button variant="contained" className="btn-primary cl-new-booking" size="small" onClick={() => navigate('/create-booking')}>
                {strings.NEW_BOOKING}
              </Button>
            )}
          </WorkspaceHead>
          <div className="ws-body">
            <div className="ws-side col-1">
              {leftPanel && (
                <div className="ws-side-panel">
                  {admin
                    && (
                      <SupplierFilter
                        suppliers={allSuppliers}
                        onChange={handleSupplierFilterChange}
                        className="cl-supplier-filter"
                      />
                    )}
                  <StatusFilter
                    onChange={handleStatusFilterChange}
                    className="cl-status-filter"
                  />
                  <VehicleSchedulerFilter
                    onSubmit={handleVehicleSchedulerFilterSubmit}
                    className="cl-scheduler-filter"
                    collapse={!env.isMobile}
                  />
                </div>
              )}
            </div>
            <div className="ws-main col-2">
              <div className="ws-main-panel">
                <VehicleScheduler
                  suppliers={suppliers}
                  statuses={statuses}
                  filter={filter!}
                  language={user.language!}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Scheduler

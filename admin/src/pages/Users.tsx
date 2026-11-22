import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import env from '@/config/env.config'
import { strings } from '@/lang/users'
import * as helper from '@/utils/helper'
import UserTypeFilter from '@/components/UserTypeFilter'
import Search from '@/components/Search'
import UserList from '@/components/UserList'
import WorkspaceHead from '@/components/WorkspaceHead'
import { strings as workspaceStrings } from '@/lang/workspace'

import '@/assets/css/users.css'
import '@/assets/css/workspace.css'

const Users = () => {
  const navigate = useNavigate()

  const [user, setUser] = useState<bookcarsTypes.User>()
  const [admin, setAdmin] = useState(false)
  const [types, setTypes] = useState<bookcarsTypes.UserType[]>()
  const [keyword, setKeyword] = useState('')

  const handleUserTypeFilterChange = (newTypes: bookcarsTypes.UserType[]) => {
    setTypes(newTypes)
  }

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
  }

  const onLoad = (_user?: bookcarsTypes.User) => {
    const _admin = helper.admin(_user)
    const _types = _admin
      ? helper.getUserTypes().map((userType) => userType.value)
      : [bookcarsTypes.UserType.Supplier, bookcarsTypes.UserType.User]

    setUser(_user)
    setAdmin(_admin)
    setTypes(_types)
  }

  return (
    <Layout onLoad={onLoad} strict>
      {user && (
        <div className="users ws-page">
          <WorkspaceHead title={workspaceStrings.USERS_TITLE} subtitle={workspaceStrings.USERS_SUBTITLE}>
            <Button variant="contained" className="btn-primary new-user" size="small" onClick={() => navigate('/create-user')}>
              {strings.NEW_USER}
            </Button>
          </WorkspaceHead>
          <div className="ws-body">
            <div className="ws-side col-1">
              <div className="col-1-container ws-side-panel">
                <Search onSubmit={handleSearch} className="search" />

                {admin
                  && (
                    <UserTypeFilter
                      className="user-type-filter"
                      onChange={handleUserTypeFilterChange}
                    />
                  )}
              </div>
            </div>
            <div className="ws-main col-2">
              <div className="ws-main-panel">
                <UserList
                  user={user}
                  types={types}
                  keyword={keyword}
                  checkboxSelection={!env.isMobile && admin}
                  hideDesktopColumns={env.isMobile}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Users

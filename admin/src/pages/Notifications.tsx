import React, { useState } from 'react'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import NotificationList from '@/components/NotificationList'
import WorkspaceHead from '@/components/WorkspaceHead'
import { strings as workspaceStrings } from '@/lang/workspace'

import '@/assets/css/notification-list.css'
import '@/assets/css/workspace.css'

const Notifications = () => {
  const [user, setUser] = useState<bookcarsTypes.User>()

  const onLoad = async (_user?: bookcarsTypes.User) => {
    setUser(_user)
  }

  return (
    <Layout onLoad={onLoad} strict>
      <div className="notifications ws-page">
        <WorkspaceHead title={workspaceStrings.NOTIFICATIONS_TITLE} subtitle={workspaceStrings.NOTIFICATIONS_SUBTITLE} />
        <div className="ws-body ws-body-single">
          <div className="ws-main">
            <div className="ws-main-panel">
              <NotificationList user={user} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Notifications

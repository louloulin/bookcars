import React, { useState } from 'react'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import NotificationList from '@/components/NotificationList'
import PageHead from '@/components/PageHead'
import { strings as pageStrings } from '@/lang/page'

import '@/assets/css/notification-list.css'

const Notifications = () => {
  const [user, setUser] = useState<bookcarsTypes.User>()

  const onLoad = async (_user?: bookcarsTypes.User) => {
    setUser(_user)
  }

  return (
    <Layout onLoad={onLoad} strict>
      <div className="notifications-page page-shell">
        <PageHead title={pageStrings.NOTIFICATIONS_TITLE} subtitle={pageStrings.NOTIFICATIONS_SUBTITLE} />
        <div className="page-section notifications-page-section">
          <NotificationList user={user} />
        </div>
      </div>
    </Layout>
  )
}

export default Notifications

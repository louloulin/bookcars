import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { useIsFocused, useLocalSearchParams } from 'expo-router'
import { fr } from 'date-fns/locale'

import * as bookcarsTypes from ':bookcars-types'

import i18n from '@/lang/i18n'
import * as UserService from '@/services/UserService'
import { getDateLocale } from '@/utils/dateLocale'
import Layout from '@/components/Layout'
import NotificationList from '@/components/NotificationList'
import { colors, radii, shadow } from '@/theme'


const NotificationsScreen = () => {
  const isFocused = useIsFocused()
  const { d } = useLocalSearchParams<{ d: string }>()
  const [reload, setReload] = useState(false)
  const [visible, setVisible] = useState(false)
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [locale, setLoacle] = useState(fr)

  const _init = async () => {
    setVisible(false)
    const language = await UserService.getLanguage()
    i18n.locale = language
    setLoacle(getDateLocale(language))

    const currentUser = await UserService.getCurrentUser()

    if (!currentUser || !currentUser._id) {
      await UserService.signout(false, true)
      return
    }

    const _user = await UserService.getUser(currentUser._id)

    if (!_user) {
      await UserService.signout(false, true)
      return
    }

    setUser(_user)
    setVisible(true)
  }

  useEffect(() => {
    if (isFocused) {
      _init()
      setReload(true)
    } else {
      setVisible(false)
    }
  }, [d, isFocused])

  const onLoad = () => {
    setReload(false)
  }

  return (
    <Layout style={styles.master} onLoad={onLoad} reload={reload} strict>
      {visible && (
        <View style={styles.wrapper}>
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>{i18n.t('NOTIFICATIONS_TITLE')}</Text>
            <Text style={styles.pageSubtitle}>{i18n.t('NOTIFICATIONS_SUBTITLE')}</Text>
          </View>
          <NotificationList user={user} locale={locale} />
        </View>
      )}
    </Layout>
  )
}

const styles = StyleSheet.create({
  master: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
  },
  pageHeader: {
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 14,
    padding: 18,
    borderRadius: radii.lg,
    backgroundColor: colors.brand,
    ...shadow.card,
  },
  pageTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -.3,
  },
  pageSubtitle: {
    color: '#dbe7d8',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
})

export default NotificationsScreen

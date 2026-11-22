import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, ScrollView, View } from 'react-native'
import { useIsFocused, useLocalSearchParams } from 'expo-router'

import i18n from '@/lang/i18n'
import * as UserService from '@/services/UserService'
import Layout from '@/components/Layout'
import * as helper from '@/utils/helper'
import { colors, radii, spacing, shadow } from '@/theme'

const ToSScreen = () => {
  const isFocused = useIsFocused()
  const { d } = useLocalSearchParams<{ d: string }>()

  const [reload, setReload] = useState(false)
  const [visible, setVisible] = useState(false)

  const _init = async () => {
    setVisible(false)
    const language = await UserService.getLanguage()
    i18n.locale = language
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
    <Layout style={styles.master} onLoad={onLoad} reload={reload}>
      {visible && (
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps={helper.android() ? 'handled' : 'always'}
        >
          <View style={styles.contentContainer}>
            <View style={styles.hero}>
              <Text style={styles.heroEyebrow}>{i18n.t('TOS_MENU')}</Text>
              <Text style={styles.heroTitle}>{i18n.t('TOS_TITLE')}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.body}>{i18n.t('TOS_BODY')}</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </Layout>
  )
}

const styles = StyleSheet.create({
  master: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'stretch',
    paddingHorizontal: spacing.md,
  },
  hero: {
    backgroundColor: colors.brand,
    borderRadius: radii.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  heroEyebrow: {
    color: '#cfe0cb',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    ...shadow.soft,
  },
  body: {
    color: colors.inkSoft,
    fontSize: 14,
    lineHeight: 23,
  },
})

export default ToSScreen

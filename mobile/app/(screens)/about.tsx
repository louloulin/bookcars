import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, ScrollView, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useIsFocused, useLocalSearchParams } from 'expo-router'

import i18n from '@/lang/i18n'
import * as UserService from '@/services/UserService'
import Layout from '@/components/Layout'
import * as helper from '@/utils/helper'
import { colors, radii, spacing, shadow } from '@/theme'

const AboutScreen = () => {
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

  const points = [
    { key: 'ABOUT_POINT1', icon: 'verified' as const },
    { key: 'ABOUT_POINT2', icon: 'price-check' as const },
    { key: 'ABOUT_POINT3', icon: 'support-agent' as const },
  ]

  return (
    <Layout style={styles.master} onLoad={onLoad} reload={reload}>
      {visible && (
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps={helper.android() ? 'handled' : 'always'}
        >
          <View style={styles.contentContainer}>
            <View style={styles.hero}>
              <Text style={styles.heroEyebrow}>{i18n.t('ABOUT')}</Text>
              <Text style={styles.heroTitle}>{i18n.t('ABOUT_TITLE')}</Text>
              <Text style={styles.heroSubtitle}>{i18n.t('ABOUT_SUBTITLE')}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.body}>{i18n.t('ABOUT_BODY')}</Text>
            </View>

            <View style={styles.points}>
              {points.map((point) => (
                <View style={styles.point} key={point.key}>
                  <View style={styles.pointIcon}>
                    <MaterialIcons name={point.icon} size={18} color={colors.brand} />
                  </View>
                  <Text style={styles.pointText}>{i18n.t(point.key)}</Text>
                </View>
              ))}
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
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#dbe7d8',
    fontSize: 14,
    lineHeight: 20,
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
  points: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    ...shadow.soft,
  },
  pointIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  pointText: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
})

export default AboutScreen

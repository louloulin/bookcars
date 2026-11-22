import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, ScrollView, View, Linking } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useIsFocused, useLocalSearchParams } from 'expo-router'

import i18n from '@/lang/i18n'
import * as UserService from '@/services/UserService'
import Layout from '@/components/Layout'
import * as helper from '@/utils/helper'
import { colors, radii, spacing, shadow } from '@/theme'

const ContactScreen = () => {
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
              <Text style={styles.heroEyebrow}>{i18n.t('CONTACT')}</Text>
              <Text style={styles.heroTitle}>{i18n.t('CONTACT_TITLE')}</Text>
              <Text style={styles.heroSubtitle}>{i18n.t('CONTACT_SUBTITLE')}</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowIcon}>
                  <MaterialIcons name="mail-outline" size={18} color={colors.brand} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{i18n.t('CONTACT_EMAIL_LABEL')}</Text>
                  <Text
                    style={styles.rowValue}
                    onPress={() => Linking.openURL('mailto:support@bookcars.ma')}
                  >
                    support@bookcars.ma
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.rowIcon}>
                  <MaterialIcons name="phone" size={18} color={colors.brand} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{i18n.t('CONTACT_PHONE_LABEL')}</Text>
                  <Text
                    style={styles.rowValue}
                    onPress={() => Linking.openURL('tel:+862162001970')}
                  >
                    +86 21 6200 1970
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.rowIcon}>
                  <MaterialIcons name="place" size={18} color={colors.brand} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{i18n.t('CONTACT_ADDRESS_LABEL')}</Text>
                  <Text style={styles.rowValue}>{i18n.t('CONTACT_ADDRESS')}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.rowIcon}>
                  <MaterialIcons name="access-time" size={18} color={colors.brand} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{i18n.t('CONTACT_HOURS_LABEL')}</Text>
                  <Text style={styles.rowValue}>{i18n.t('CONTACT_HOURS')}</Text>
                </View>
              </View>
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
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    ...shadow.soft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  rowValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lineSoft,
  },
})

export default ContactScreen

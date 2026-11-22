import React, { useState, useEffect } from 'react'
import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native'
import { useIsFocused, useLocalSearchParams } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'

import i18n from '@/lang/i18n'
import * as helper from '@/utils/helper'
import * as UserService from '@/services/UserService'
import Layout from '@/components/Layout'
import SearchForm from '@/components/SearchForm'
import { colors, radii, spacing, shadow } from '@/theme'

const HomeScreen = () => {
  const isFocused = useIsFocused()
  const { d } = useLocalSearchParams<{ d: string }>()

  const [init, setInit] = useState(false)
  const [visible, setVisible] = useState(false)
  const [reload, setReload] = useState(false)

  const _init = async () => {
    const _language = await UserService.getLanguage()
    i18n.locale = _language

    setInit(true)
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
      {init && visible && (
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps={helper.android() ? 'handled' : 'always'}
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.contentContainer}>
            <View style={styles.hero}>
              <View style={styles.heroBadge}>
                <MaterialIcons name="verified" size={14} color={colors.brand} />
                <Text style={styles.heroBadgeText}>{i18n.t('CAR_AVAILABLE')}</Text>
              </View>

              <Text style={styles.logo}>{i18n.t('BOOKCARS')}</Text>

              <Text style={styles.tagline}>{i18n.t('SEARCH_TITLE_1')}{i18n.t('SEARCH_TITLE_2')}</Text>

              <View style={styles.heroTrust}>
                <View style={styles.trustItem}>
                  <MaterialIcons name="verified-user" size={16} color="#dbe7d8" />
                  <Text style={styles.trustText}>{i18n.t('PICKUP_LOCATION')}</Text>
                </View>
                <View style={styles.trustItem}>
                  <MaterialIcons name="shield" size={16} color="#dbe7d8" />
                  <Text style={styles.trustText}>{i18n.t('DEPOSIT')}</Text>
                </View>
                <View style={styles.trustItem}>
                  <MaterialIcons name="support-agent" size={16} color="#dbe7d8" />
                  <Text style={styles.trustText}>{i18n.t('CONTACT')}</Text>
                </View>
              </View>
            </View>

            <View style={styles.searchCard}>
              <SearchForm backgroundColor={colors.surface} />
            </View>

            <Pressable style={styles.helpRow}>
              <MaterialIcons name="help-outline" size={18} color={colors.inkSoft} />
              <Text style={styles.helpText}>{i18n.t('FAQ')}</Text>
            </Pressable>
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
    justifyContent: 'flex-start',
    paddingBottom: 28,
    backgroundColor: colors.canvas,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
  },
  hero: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: colors.brand,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + 8,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    ...shadow.card,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, .16)',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: spacing.md,
  },
  heroBadgeText: {
    color: '#eaf3e7',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  logo: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 4,
  },
  tagline: {
    color: '#cfe0cb',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  heroTrust: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: spacing.xs,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    color: '#dbe7d8',
    fontSize: 12,
    fontWeight: '600',
  },
  searchCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: -18,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    ...shadow.card,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  helpText: {
    color: colors.inkSoft,
    fontSize: 13,
    fontWeight: '600',
  },
})

export default HomeScreen

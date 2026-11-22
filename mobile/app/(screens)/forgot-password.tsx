import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet, ScrollView, View, Text, TextInputInstance } from 'react-native'
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router'

import validator from 'validator'

import TextInput from '@/components/TextInput'
import Button from '@/components/Button'
import i18n from '@/lang/i18n'
import * as UserService from '@/services/UserService'
import * as helper from '@/utils/helper'
import Link from '@/components/Link'
import Header from '@/components/Header'
import SocialLogin from '@/components/SocialLogin'
import { colors, radii, shadow } from '@/theme'

const ForgotPasswordScreen = () => {
  const isFocused = useIsFocused()
  const router = useRouter()
  const { d } = useLocalSearchParams<{ d: string }>()
  const [email, setEmail] = useState('')
  const [emailRequired, setEmailRequired] = useState(false)
  const [emailValid, setEmailValid] = useState(true)
  const [sent, setSent] = useState(false)
  const ref = useRef<TextInputInstance>(null)

  const _init = async () => {
    const language = await UserService.getLanguage()
    i18n.locale = language
    setEmail('')
    setEmailRequired(false)
    setEmailValid(true)
    setSent(false)
    if (ref.current) {
      ref.current.clear()
    }
  }

  useEffect(() => {
    if (isFocused) {
      _init()
    }
  }, [d, isFocused])

  const validateEmail = () => {
    if (email) {
      setEmailRequired(false)
      const valid = validator.isEmail(email)
      setEmailValid(valid)
      return valid
    } else {
      setEmailValid(true)
      setEmailRequired(true)
      return false
    }
  }

  const onChangeEmail = (text: string) => {
    setEmail(text)
    setEmailRequired(false)
    setEmailValid(true)
  }

  const onPressReset = async () => {
    try {
      const _emailValid = validateEmail()
      if (!_emailValid) {
        return
      }

      const status = await UserService.resend(email, true)

      if (status === 200) {
        setEmailRequired(false)
        setEmailValid(true)
        setSent(true)
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    }
  }

  return (
    <View style={styles.master}>
      <Header title={i18n.t('FORGOT_PASSWORD')} hideTitle={false} loggedIn={false} />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps={helper.android() ? 'handled' : 'always'}
      >
        {sent && (
          <View style={styles.contentContainer}>
            <View style={styles.card}>
            <Text style={styles.text}>{i18n.t('RESET_EMAIL_SENT')}</Text>
            <Link label={i18n.t('GO_TO_HOME')} onPress={() => router.push('/')} />
            </View>
          </View>
        )}
        {!sent && (
          <View style={styles.contentContainer}>
            <View style={styles.card}>
            <Text style={styles.heading}>{i18n.t('RESET_PASSWORD')}</Text>
            <Text style={styles.subheading}>{i18n.t('RESET_PASSWORD_SUBTITLE')}</Text>

            <TextInput
              ref={ref}
              style={styles.component}
              label={i18n.t('EMAIL')}
              error={emailRequired || !emailValid}
              helperText={(emailRequired && i18n.t('REQUIRED')) || (!emailValid && i18n.t('EMAIL_NOT_VALID')) || ''}
              onSubmitEditing={onPressReset}
              onChangeText={onChangeEmail}
            />

            <SocialLogin />

            <Button style={styles.component} label={i18n.t('RESET')} onPress={onPressReset} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  master: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  text: {
    color: colors.inkSoft,
    fontSize: 15,
    fontWeight: '600',
    alignSelf: 'stretch',
    margin: 10,
    padding: 5,
    textAlign: 'center',
  },
  heading: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    alignSelf: 'stretch',
    marginBottom: 6,
  },
  subheading: {
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 19,
    alignSelf: 'stretch',
    marginBottom: 10,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
    backgroundColor: colors.canvas,
    paddingVertical: 24,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 26,
    paddingHorizontal: 20,
    ...shadow.card,
  },
  component: {
    alignSelf: 'stretch',
    marginTop: 10,
    marginRight: 10,
    marginLeft: 10,
  },
})

export default ForgotPasswordScreen

import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { colors } from '@/theme'

interface ErrorProps {
  style?: object
  message: string
}

const Error = ({
  style,
  message
}: ErrorProps) => (
    <View style={style}>
      <Text style={styles.text}>{message}</Text>
    </View>
  )

const styles = StyleSheet.create({
  text: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
})

export default Error

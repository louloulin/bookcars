import React from 'react'
import { StyleSheet, Text, Pressable } from 'react-native'
import { colors } from '@/theme'

interface LinkProps {
  style?: object
  textStyle?: object
  label: string
  onPress?: () => void
}

const Link = ({
  style,
  textStyle,
  label,
  onPress: onLinkPress
}: LinkProps) => {
  const onPress = () => {
    if (onLinkPress) {
      onLinkPress()
    }
  }

  return (
    <Pressable style={style} onPress={onPress}>
      <Text style={{ ...styles.text, ...textStyle }}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  text: {
    color: colors.brand,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
})

export default Link

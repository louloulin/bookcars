import React from 'react'
import { StyleSheet, Text, Pressable } from 'react-native'

import { colors, radii } from '@/theme'

interface ButtonProps {
  size?: 'small'
  color?: string
  style?: object
  label: string
  onPress?: () => void
}

const Button = ({
  size,
  color,
  style,
  label,
  onPress: onButtonPress
}: ButtonProps) => {
  const small = size === 'small'

  const onPress = () => {
    if (onButtonPress) {
      onButtonPress()
    }
  }

  const styles = StyleSheet.create({
    button: {
      height: small ? 40 : 52,
      borderRadius: radii.md,
      backgroundColor: color === 'secondary' ? colors.inkMuted : colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: 480,
    },
    text: {
      color: '#fff',
      textTransform: 'none',
      fontSize: small ? 14 : 16,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
  })

  return (
    <Pressable style={{ ...style, ...styles.button }} onPress={onPress}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  )
}

export default Button

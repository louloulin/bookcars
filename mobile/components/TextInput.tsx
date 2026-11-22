import React, { forwardRef, useEffect, useRef, useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput as ReactTextInput,
  TextInputInstance,
  TextInputKeyPressEvent
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

import { colors, radii } from '@/theme'

interface TextInputProps {
  size?: 'small' | 'large'
  value?: string
  style?: object
  inputStyle?: object
  backgroundColor?: string
  error?: boolean
  label?: string
  hideLabel?: boolean
  secureTextEntry?: boolean
  readOnly?: boolean
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad'
  maxLength?: number
  autoCorrect?: boolean
  hideClearButton?: boolean
  helperText?: string
  onKeyPress?: (event: TextInputKeyPressEvent) => void
  onFocus?: () => void
  onBlur?: () => void
  onSubmitEditing?: () => void
  onChangeText?: (text: string) => void
}

const TextInputComponent = (
  props: TextInputProps,
  ref: React.ForwardedRef<TextInputInstance>
) => {
  const [value, setValue] = useState('')
  const _ref = useRef<TextInputInstance | null>(null)
  const small = props.size === 'small'

  useEffect(() => {
    setValue(props.value || '')
  }, [props.value])

  const onChangeText = (text: string) => {
    setValue(text)
    if (props.onChangeText) {
      props.onChangeText(text)
    }
  }

  const styles = StyleSheet.create({
    container: {
      maxWidth: 480,
    },
    label: {
      backgroundColor: props.backgroundColor ?? colors.canvas,
      color: colors.inkMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      paddingRight: props.label ? 5 : 0,
      paddingLeft: props.label ? 5 : 0,
      marginLeft: props.label ? 15 : 0,
      width: props.label ? 'auto' : 0,
      position: 'absolute',
      top: -9,
      zIndex: 1,
    },
    inputContainer: {
      flexDirection: 'row',
    },
    input: {
      flex: 1,
      height: small ? 38 : 50,
      borderWidth: 1,
      borderRadius: radii.md,
      borderColor: props.error ? colors.danger : colors.line,
      backgroundColor: props.backgroundColor ?? colors.surface,
      color: colors.ink,
      fontSize: small ? 14 : 15,
      paddingTop: small ? 8 : 13,
      paddingRight: 40,
      paddingBottom: small ? 8 : 13,
      paddingLeft: 15,
    },
    helperText: {
      color: props.error ? colors.danger : colors.inkMuted,
      fontSize: 11,
      fontWeight: '500',
      paddingLeft: 5,
    },
    clear: {
      flex: 0,
      position: 'absolute',
      right: 10,
      top: small ? 7 : 17,
    },
  })

  return (
    <View style={{ ...styles.container, ...props.style }}>
      {value !== '' && !props.hideLabel && <Text style={styles.label}>{props.label}</Text>}
      <View style={styles.inputContainer}>
        <ReactTextInput
          ref={(inputRef) => {
            if (ref) {
              if (typeof ref === 'function') {
                ref(inputRef)
              } else {
                ref.current = inputRef
              }
            }
            _ref.current = inputRef
          }}
          secureTextEntry={props.secureTextEntry}
          placeholder={props.label}
          value={value}
          onChangeText={onChangeText}
          onKeyPress={props.onKeyPress}
          onSubmitEditing={props.onSubmitEditing}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          autoCapitalize="none"
          editable={!props.readOnly}
          keyboardType={props.keyboardType ?? 'default'}
          maxLength={props.maxLength}
          // autoComplete={Platform.OS === 'web' ? 'none' : 'off'}
          autoCorrect={props.autoCorrect}
          style={{ ...styles.input, ...props.inputStyle }}
        />
        {!props.readOnly && value !== '' && !props.hideClearButton && (
          <MaterialIcons
            style={styles.clear}
            name="clear"
            size={22}
            color="rgba(0, 0, 0, 0.28)"
            onPress={() => {
              onChangeText('')
              if (_ref && _ref.current) {
                _ref.current.focus()
              }
            }}
          />
        )}
      </View>
      <Text style={styles.helperText}>{props.helperText}</Text>
    </View>
  )
}

const TextInput: React.ForwardRefExoticComponent<TextInputProps & React.RefAttributes<TextInputInstance>> = forwardRef<TextInputInstance, TextInputProps>(TextInputComponent)

TextInput.displayName = 'TextInput'

export default TextInput

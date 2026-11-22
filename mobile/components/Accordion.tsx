import React, { useRef, useState } from 'react'
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

import { colors, radii } from '@/theme'

interface AccordionProps {
  style?: object
  title: string
  children?: React.ReactNode
}

const Accordion = ({
  style,
  title,
  children
}: AccordionProps) => {
  const [open, setOpen] = useState(false)
  const animatedController = useRef(new Animated.Value(0)).current

  const arrowAngle = animatedController.interpolate({
    inputRange: [0, 1],
    outputRange: ['0rad', `${Math.PI}rad`],
  })

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    title: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    titleTouchable: {
      flex: 1,
      alignSelf: 'stretch',
      backgroundColor: colors.surface,
      zIndex: 10,
      elevation: 10,
    },
    titleContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignSelf: 'stretch',
      paddingRight: 12,
      paddingLeft: 14,
      paddingTop: 12,
      paddingBottom: 12,
    },
    titleTextContainer: {
      flex: 1,
      alignSelf: 'stretch',
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    titleText: {
      color: colors.ink,
      fontWeight: '700',
      fontSize: 13,
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    },
    bodyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: open ? 10 : 0,
      paddingBottom: open ? 12 : 0,
      paddingHorizontal: 12,
      height: open ? 'auto' : 0,
      width: open ? 'auto' : 0,
    },
  })

  return (
    <View style={{ ...styles.container, ...style }}>
      <View style={styles.title}>
        <TouchableWithoutFeedback
          style={styles.titleTouchable}
          onPress={() => {
            if (open) {
              Animated.timing(animatedController, {
                duration: 300,
                toValue: 0,
                easing: Easing.bezier(0.4, 0.0, 0.2, 1),
                useNativeDriver: true,
              }).start()
            } else {
              Animated.timing(animatedController, {
                duration: 300,
                toValue: 1,
                easing: Easing.bezier(0.4, 0.0, 0.2, 1),
                useNativeDriver: true,
              }).start()
            }
            setOpen((prev) => !prev)
          }}
        >
          <View style={styles.titleContainer}>
            <View style={styles.titleTextContainer}>
              <Text style={styles.titleText}>{title}</Text>
            </View>
            <Animated.View style={{ transform: [{ rotateZ: arrowAngle }] }}>
              <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.inkSoft} />
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </View>
      {open && <View style={styles.bodyContainer}>{children}</View>}
    </View>
  )
}

export default Accordion

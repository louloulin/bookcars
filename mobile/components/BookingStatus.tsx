import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import * as bookcarsTypes from ':bookcars-types'

import * as helper from '@/utils/helper'
import { colors, radii } from '@/theme'

interface BookingStatusProps {
  style: object
  status: bookcarsTypes.BookingStatus
}

const BookingStatus = ({
  style,
  status
}: BookingStatusProps) => {
  const styles = StyleSheet.create({
    container: {
      height: 26,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radii.pill,
      paddingHorizontal: 12,
    },
    text: {
      color: status === bookcarsTypes.BookingStatus.Void
        ? '#4d6057'
        : status === bookcarsTypes.BookingStatus.Pending
          ? '#8a4b00'
          : status === bookcarsTypes.BookingStatus.Deposit
            ? '#1f6b45'
            : status === bookcarsTypes.BookingStatus.Paid
              ? '#1f6b45'
              : status === bookcarsTypes.BookingStatus.PaidInFull
                ? '#fff'
                : status === bookcarsTypes.BookingStatus.Reserved
                  ? '#1d5f8f'
                  : status === bookcarsTypes.BookingStatus.Cancelled
                    ? '#a32721'
                    : colors.inkSoft,
      fontSize: 12,
      fontWeight: '700',
    },
  })

  return (
    <View
      style={{
        ...styles.container,
        ...style,
        backgroundColor:
          status === bookcarsTypes.BookingStatus.Void
            ? '#e6eae4'
            : status === bookcarsTypes.BookingStatus.Pending
              ? '#fbe6cc'
              : status === bookcarsTypes.BookingStatus.Deposit
                ? '#d7ecdf'
                : status === bookcarsTypes.BookingStatus.Paid
                  ? '#d9efdd'
                  : status === bookcarsTypes.BookingStatus.PaidInFull
                    ? colors.brand
                    : status === bookcarsTypes.BookingStatus.Reserved
                      ? '#d9e7f4'
                      : status === bookcarsTypes.BookingStatus.Cancelled
                        ? '#f7dedc'
                        : 'transparent',
      }}
    >
      <Text style={styles.text}>{helper.getBookingStatus(status)}</Text>
    </View>
  )
}

export default BookingStatus

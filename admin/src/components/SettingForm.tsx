import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Checkbox, FormControl, FormControlLabel, FormHelperText, Input, InputLabel, Paper } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import { strings as commonStrings } from '@/lang/common'
import { strings as settingsStrings } from '@/lang/settings'
import { strings } from '@/lang/setting'
import * as SettingService from '@/services/SettingService'
import * as helper from '@/utils/helper'
import { schema, FormFields } from '@/models/SettingForm'

interface SettingFormProps {
  settings: bookcarsTypes.Setting | null
  onSubmit: (data: bookcarsTypes.Setting) => void
}

const SettingForm = ({ settings, onSubmit: onFormSubmit }: SettingFormProps) => {
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { isSubmitting, errors }, setValue, } = useForm<FormFields>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  })

  useEffect(() => {
    if (settings) {
      setValue('minPickupHours', settings.minPickupHours.toString())
      setValue('minRentalHours', settings.minRentalHours.toString())
      setValue('minPickupDropoffHour', settings.minPickupDropoffHour.toString())
      setValue('maxPickupDropoffHour', settings.maxPickupDropoffHour.toString())
      setValue('nightServiceFee', (settings.nightServiceFee ?? 0).toString())
      setValue('nightServiceStartHour', (settings.nightServiceStartHour ?? 0).toString())
      setValue('nightServiceEndHour', (settings.nightServiceEndHour ?? 0).toString())
      setValue('oneWayFee', (settings.oneWayFee ?? 0).toString())
      setValue('overtimeFee', (settings.overtimeFee ?? 0).toString())
      setValue('overtimeFreeHours', (settings.overtimeFreeHours ?? 0).toString())
      setValue('mileageFee', (settings.mileageFee ?? 0).toString())
      setValue('mileageIncluded', (settings.mileageIncluded ?? 0).toString())
      setValue('enforceBookingRules', settings.enforceBookingRules === true)
    }
  }, [settings, setValue])

  const onSubmit = async (data: FormFields) => {
    try {
      const payload: bookcarsTypes.UpdateSettingsPayload = {
        minPickupHours: Number(data.minPickupHours),
        minRentalHours: Number(data.minRentalHours),
        minPickupDropoffHour: Number(data.minPickupDropoffHour),
        maxPickupDropoffHour: Number(data.maxPickupDropoffHour),
        nightServiceFee: Number(data.nightServiceFee) || 0,
        nightServiceStartHour: Number(data.nightServiceStartHour) || 0,
        nightServiceEndHour: Number(data.nightServiceEndHour) || 0,
        oneWayFee: Number(data.oneWayFee) || 0,
        overtimeFee: Number(data.overtimeFee) || 0,
        overtimeFreeHours: Number(data.overtimeFreeHours) || 0,
        mileageFee: Number(data.mileageFee) || 0,
        mileageIncluded: Number(data.mileageIncluded) || 0,
        enforceBookingRules: data.enforceBookingRules === true,
      }

      const { status, data: res } = await SettingService.updateSettings(payload)

      if (status === 200) {
        if (onFormSubmit) {
          onFormSubmit(res)
        }
        helper.info(settingsStrings.SETTINGS_UPDATED)
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    }
  }

  return (
    <Paper className="settings-form settings-form-wrapper" elevation={10}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h1 className="settings-form-title">{strings.SETTINGS}</h1>

        <FormControl fullWidth margin="dense">
          <InputLabel className="required">{strings.MIN_PICKUP_HOURS}</InputLabel>
          <Input {...register('minPickupHours')} type="text" required autoComplete="off" />
          {errors.minPickupHours && (
            <FormHelperText error>{errors.minPickupHours.message}</FormHelperText>
          )}
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel className="required">{strings.MIN_RENTAL_HOURS}</InputLabel>
          <Input {...register('minRentalHours')} type="text" required autoComplete="off" />
          {errors.minRentalHours && (
            <FormHelperText error>{errors.minRentalHours.message}</FormHelperText>
          )}
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel className="required">{strings.MIN_PICKUP_DROPOFF_HOUR}</InputLabel>
          <Input {...register('minPickupDropoffHour')} type="text" required autoComplete="off" />
          {errors.minPickupDropoffHour && (
            <FormHelperText error>{errors.minPickupDropoffHour.message}</FormHelperText>
          )}
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel className="required">{strings.MAX_PICKUP_DROPOFF_HOUR}</InputLabel>
          <Input {...register('maxPickupDropoffHour')} type="text" required autoComplete="off" />
          {errors.maxPickupDropoffHour && (
            <FormHelperText error>{errors.maxPickupDropoffHour.message}</FormHelperText>
          )}
        </FormControl>


        <FormControl fullWidth margin="dense">
          <InputLabel>{strings.NIGHT_SERVICE_FEE}</InputLabel>
          <Input {...register('nightServiceFee')} type="text" autoComplete="off" />
          {errors.nightServiceFee && (
            <FormHelperText error>{errors.nightServiceFee.message}</FormHelperText>
          )}
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel>{strings.NIGHT_SERVICE_START_HOUR}</InputLabel>
          <Input {...register('nightServiceStartHour')} type="text" autoComplete="off" />
          {errors.nightServiceStartHour && (
            <FormHelperText error>{errors.nightServiceStartHour.message}</FormHelperText>
          )}
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel>{strings.NIGHT_SERVICE_END_HOUR}</InputLabel>
          <Input {...register('nightServiceEndHour')} type="text" autoComplete="off" />
          {errors.nightServiceEndHour && (
            <FormHelperText error>{errors.nightServiceEndHour.message}</FormHelperText>
          )}
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel>{strings.ONE_WAY_FEE}</InputLabel>
          <Input {...register('oneWayFee')} type="text" autoComplete="off" />
          {errors.oneWayFee && (
            <FormHelperText error>{errors.oneWayFee.message}</FormHelperText>
          )}
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel>{strings.OVERTIME_FEE}</InputLabel>
          <Input {...register('overtimeFee')} type="text" autoComplete="off" />
          {errors.overtimeFee && (
            <FormHelperText error>{errors.overtimeFee.message}</FormHelperText>
          )}
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel>{strings.OVERTIME_FREE_HOURS}</InputLabel>
          <Input {...register('overtimeFreeHours')} type="text" autoComplete="off" />
          {errors.overtimeFreeHours && (
            <FormHelperText error>{errors.overtimeFreeHours.message}</FormHelperText>
          )}
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel>{strings.MILEAGE_FEE}</InputLabel>
          <Input {...register('mileageFee')} type="text" autoComplete="off" />
          {errors.mileageFee && (
            <FormHelperText error>{errors.mileageFee.message}</FormHelperText>
          )}
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel>{strings.MILEAGE_INCLUDED}</InputLabel>
          <Input {...register('mileageIncluded')} type="text" autoComplete="off" />
          {errors.mileageIncluded && (
            <FormHelperText error>{errors.mileageIncluded.message}</FormHelperText>
          )}
        </FormControl>

        <FormControl fullWidth margin="dense">
          <FormControlLabel
            control={<Checkbox {...register('enforceBookingRules')} />}
            label={strings.ENFORCE_BOOKING_RULES}
          />
        </FormControl>

        <div className="buttons">
          <Button type="submit" variant="contained" className="btn-primary btn-margin-bottom" size="small" disabled={isSubmitting}>
            {commonStrings.SAVE}
          </Button>
          <Button variant="contained" className="btn-secondary btn-margin-bottom" size="small" onClick={() => navigate('/')}>
            {commonStrings.CANCEL}
          </Button>
        </div>
      </form>
    </Paper>
  )
}

export default SettingForm

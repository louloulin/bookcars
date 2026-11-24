import React, { useEffect, useState } from 'react'
import { Alert, Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { BookingHandover as Handover, HandoverReminderKind, HandoverStage, ReturnFeePaymentMethod } from ':bookcars-types'
import axiosInstance from '@/services/axiosInstance'

const stageNames = {
  [HandoverStage.Accepted]: ['已接单', 'Accepted'],
  [HandoverStage.Preparing]: ['备车中', 'Preparing'],
  [HandoverStage.Ready]: ['可取车', 'Ready for pickup'],
  [HandoverStage.PickedUp]: ['已交付', 'Picked up'],
  [HandoverStage.Returned]: ['已还车', 'Returned'],
  [HandoverStage.Settled]: ['已结算', 'Settled'],
}

const reminderNames = {
  [HandoverReminderKind.Pickup]: ['取车提醒', 'Pickup reminder'],
  [HandoverReminderKind.Return]: ['还车提醒', 'Return reminder'],
  [HandoverReminderKind.Overdue]: ['还车逾期提醒', 'Overdue return reminder'],
} as const

const reminderStatus = {
  sent: ['邮件服务器已接收', 'Accepted by mail server'],
  failed: ['发送失败，可尝试手动发送', 'Failed. You can send it manually.'],
  sending: ['发送结果待核对', 'Delivery result pending'],
} as const

const paymentMethods = {
  [ReturnFeePaymentMethod.WeChat]: ['微信支付', 'WeChat Pay'],
  [ReturnFeePaymentMethod.Alipay]: ['支付宝', 'Alipay'],
  [ReturnFeePaymentMethod.Card]: ['银行卡', 'Card'],
  [ReturnFeePaymentMethod.Cash]: ['现金', 'Cash'],
}

const BookingHandover = ({ id, language }: { id: string, language: string }) => {
  const [record, setRecord] = useState<Handover>()
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [reminderResult, setReminderResult] = useState<'sent' | 'failed'>()
  const [paymentMethod, setPaymentMethod] = useState('')
  const url = `/api/booking-handover/${encodeURIComponent(id)}`
  const chinese = language === 'zh'
  const text = (zh: string, en: string) => chinese ? zh : en
  const name = (stage: HandoverStage) => stageNames[stage][chinese ? 0 : 1]
  const next = record?.nextStage
  const inspection = next === HandoverStage.PickedUp || next === HandoverStage.Returned
  const canRecordReceipt = next === HandoverStage.Settled && (record?.fees?.total ?? 0) > 0 && !!record?.currency

  useEffect(() => {
    const controller = new AbortController()
    axiosInstance.get<Handover>(url, { withCredentials: true, signal: controller.signal })
      .then(({ data }) => setRecord(data))
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(true)
        }
      })
    return () => controller.abort()
  }, [url])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError(false)
    setReminderResult(undefined)
    try {
      const { data } = await axiosInstance.post<Handover>(url, {
        stage: next,
        odometer: Number(form.get('odometer')),
        fuelPercent: Number(form.get('fuelPercent')),
        condition: form.get('condition'),
        contractVersion: form.get('contractVersion'),
        documentsVerified: form.has('documentsVerified'),
        returnFeeReceipt: canRecordReceipt && paymentMethod ? { method: paymentMethod, reference: form.get('receiptReference') } : undefined,
      }, { withCredentials: true })
      setRecord(data)
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  const sendReminder = async () => {
    setBusy(true)
    setReminderResult(undefined)
    try {
      await axiosInstance.post(`${url}/reminder`, undefined, { withCredentials: true })
      setReminderResult('sent')
    } catch {
      setReminderResult('failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box component="section" aria-labelledby="handover-title" sx={{ bgcolor: 'background.paper', p: 2.5, mt: 2, borderRadius: 2 }}>
      <Typography id="handover-title" variant="h6">{text('门店取还车', 'Store handover')}</Typography>
      {error && <Alert severity="error">{text('操作未保存。请检查输入或刷新订单后重试。', 'Could not save. Check the inputs or refresh the booking and try again.')}</Alert>}
      {!record && !error && <Typography>{text('正在加载记录…', 'Loading handover…')}</Typography>}
      {record && record.events.length === 0 && !next && <Typography>{text('确认预订后可开始门店作业。', 'Confirm the booking to start the handover.')}</Typography>}
      {!!record?.events.length && (
        <Box component="ol" sx={{ pl: 2.5 }}>
          {record.events.map((event) => (
            <li key={event.stage}>
              <Typography><strong>{name(event.stage)}</strong> · {new Date(event.at).toLocaleString(chinese ? 'zh-CN' : 'en')}</Typography>
              {event.odometer !== undefined && <Typography variant="body2">{event.odometer} km · {event.fuelPercent}% · {event.condition}</Typography>}
              {event.documentsVerified && <Typography variant="body2">{text('已核验证件，合同', 'Documents verified, contract')} {event.contractVersion}</Typography>}
              {event.returnFeeReceipt && (
                <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                  {text('线下收款', 'Offline payment')} · {paymentMethods[event.returnFeeReceipt.method][chinese ? 0 : 1]} · {event.returnFeeReceipt.amount.toFixed(2)} {event.returnFeeReceipt.currency} · {text('流水号', 'Reference')} {event.returnFeeReceipt.reference}
                </Typography>
              )}
            </li>
          ))}
        </Box>
      )}
      {record?.fees && (
        <Stack spacing={0.5} sx={{ my: 2 }}>
          {record.fees.items.map(({ code, amount }) => (
            <Typography key={code}>{code === 'overtime' ? text('超时费', 'Overtime fee') : text('超里程费', 'Mileage fee')} · {amount.toFixed(2)} {record.currency}</Typography>
          ))}
          <Typography fontWeight={700}>{text('还车附加费合计', 'Return fees')} · {record.fees.total.toFixed(2)} {record.currency}</Typography>
        </Stack>
      )}
      {record?.scheduledReminders && (
        <Box component="section" aria-labelledby="reminder-log-title" sx={{ mt: 2, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Typography id="reminder-log-title" fontWeight={700}>{text('自动邮件提醒记录', 'Scheduled email reminders')}</Typography>
          {Object.values(HandoverReminderKind).map((kind) => {
            const entry = record.scheduledReminders?.[kind]
            return entry && (
              <Typography key={kind} variant="body2" sx={{ mt: 0.5 }}>
                {reminderNames[kind][chinese ? 0 : 1]} · {reminderStatus[entry.status][chinese ? 0 : 1]} · {new Date(entry.at).toLocaleString(chinese ? 'zh-CN' : 'en')}
              </Typography>
            )
          })}
        </Box>
      )}
      {(next === HandoverStage.PickedUp || next === HandoverStage.Returned) && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Button onClick={sendReminder} disabled={busy || reminderResult === 'sent'} variant="outlined">
            {next === HandoverStage.PickedUp ? text('发送取车提醒邮件', 'Email pickup reminder') : text('发送还车提醒邮件', 'Email return reminder')}
          </Button>
          {reminderResult === 'sent' && <Alert severity="success">{text('提醒已提交至邮件服务器。', 'Reminder accepted by the mail server.')}</Alert>}
          {reminderResult === 'failed' && <Alert severity="error">{text('提醒发送失败，请稍后重试。', 'The reminder could not be sent. Try again later.')}</Alert>}
        </Stack>
      )}
      {next && (
        <Box component="form" key={next} onSubmit={submit}>
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {inspection && (
              <>
                <TextField name="odometer" label={text('仪表里程（公里）', 'Odometer (km)')} type="number" required slotProps={{ htmlInput: { min: 0, step: 1 } }} />
                <TextField name="fuelPercent" label={text('油量或电量（%）', 'Fuel or battery (%)')} type="number" required slotProps={{ htmlInput: { min: 0, max: 100, step: 1 } }} />
                <TextField name="condition" label={text('车况记录', 'Vehicle condition')} required multiline slotProps={{ htmlInput: { maxLength: 500 } }} />
              </>
            )}
            {next === HandoverStage.PickedUp && (
              <>
                <TextField name="contractVersion" label={text('合同版本', 'Contract version')} required slotProps={{ htmlInput: { maxLength: 80 } }} />
                <FormControlLabel control={<Checkbox name="documentsVerified" required />} label={text('已核验身份证件及有效驾驶资格', 'Identity and valid driving entitlement verified')} />
              </>
            )}
            {next === HandoverStage.Settled && <Typography variant="body2">{text('线下核对并结清费用后，登记为已结算。', 'Record settlement after reconciling and settling the fees offline.')}</Typography>}
            {canRecordReceipt && (
              <>
                <TextField select label={text('线下付款方式', 'Offline payment method')} value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                  <MenuItem value="">{text('仅登记结算', 'Record settlement only')}</MenuItem>
                  {Object.values(ReturnFeePaymentMethod).map((method) => (
                    <MenuItem key={method} value={method}>{paymentMethods[method][chinese ? 0 : 1]}</MenuItem>
                  ))}
                </TextField>
                {paymentMethod && <TextField name="receiptReference" label={text('付款流水号或收据编号', 'Payment reference or receipt number')} required slotProps={{ htmlInput: { maxLength: 64 } }} />}
              </>
            )}
            <Button type="submit" variant="contained" disabled={busy}>{text('登记', 'Record')} {name(next)}</Button>
          </Stack>
        </Box>
      )}
    </Box>
  )
}

export default BookingHandover

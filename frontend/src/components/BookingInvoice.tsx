import React, { useEffect, useState } from 'react'
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import type { BookingInvoiceView } from ':bookcars-types'
import axiosInstance from '@/services/axiosInstance'

const BookingInvoice = ({ id, language }: { id: string, language: string }) => {
  const url = `/api/bookings/${encodeURIComponent(id)}/invoice`
  const [record, setRecord] = useState<BookingInvoiceView>()
  const [title, setTitle] = useState('')
  const [taxId, setTaxId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const text = (zh: string, en: string) => language === 'zh' ? zh : en

  useEffect(() => {
    const controller = new AbortController()
    axiosInstance.get<BookingInvoiceView>(url, { withCredentials: true, signal: controller.signal })
      .then(({ data }) => setRecord(data))
      .catch(() => {
 if (!controller.signal.aborted) {
setError(true)
} 
})
    return () => controller.abort()
  }, [url])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(false)
    try {
      const { data } = await axiosInstance.post<BookingInvoiceView>(url, {
        title: title.trim(), taxId: taxId.trim() || undefined,
      }, { withCredentials: true })
      setRecord(data)
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  if (!error && !record?.canRequest && !record?.invoice) {
return null
}

  return (
    <Box component="section" aria-labelledby="invoice-title" sx={{ bgcolor: 'background.paper', p: 2.5, mt: 2, borderRadius: 2 }}>
      <Typography id="invoice-title" variant="h6">{text('发票申请', 'Invoice request')}</Typography>
      {error && <Alert severity="error">{text('发票操作失败，请刷新后重试。', 'The invoice request could not be completed. Refresh and try again.')}</Alert>}
      {record?.invoice && (
        <Stack spacing={1} sx={{ mt: 1 }}>
          <Alert severity={record.invoice.issuedAt ? 'success' : 'info'}>
            {record.invoice.issuedAt ? text('门店已登记开票', 'Store recorded the invoice') : text('申请已提交，等待门店处理', 'Request submitted. The store will review it.')}
          </Alert>
          <Typography>{record.invoice.title}</Typography>
          {record.invoice.reference && <Typography>{text('发票号码', 'Invoice number')} · {record.invoice.reference}</Typography>}
        </Stack>
      )}
      {record?.canRequest && (
        <Stack component="form" onSubmit={submit} spacing={2} sx={{ mt: 2 }}>
          <TextField size="small" required label={text('发票抬头', 'Invoice title')} value={title} onChange={(event) => setTitle(event.target.value)} slotProps={{ htmlInput: { maxLength: 160 } }} />
          <TextField size="small" label={text('纳税人识别号（选填）', 'Taxpayer ID (optional)')} value={taxId} onChange={(event) => setTaxId(event.target.value)} slotProps={{ htmlInput: { maxLength: 20, pattern: '[A-Za-z0-9]{15,20}' } }} />
          <Button type="submit" variant="contained" disabled={busy || !title.trim()}>{text('提交发票申请', 'Submit invoice request')}</Button>
        </Stack>
      )}
    </Box>
  )
}

export default BookingInvoice

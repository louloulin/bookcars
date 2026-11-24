import React, { useEffect, useState } from 'react'
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import type { BookingInvoice, BookingInvoiceView } from ':bookcars-types'
import axiosInstance from '@/services/axiosInstance'

const InvoiceRequest = ({ id, language }: { id: string, language: string }) => {
  const url = `/api/bookings/${encodeURIComponent(id)}/invoice`
  const [request, setRequest] = useState<BookingInvoice>()
  const [reference, setReference] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const text = (zh: string, en: string) => language === 'zh' ? zh : en

  useEffect(() => {
    const controller = new AbortController()
    axiosInstance.get<BookingInvoiceView>(url, { withCredentials: true, signal: controller.signal })
      .then(({ data }) => setRequest(data.invoice))
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
      const { data } = await axiosInstance.post<BookingInvoiceView>(url, { reference: reference.trim() }, { withCredentials: true })
      setRequest(data.invoice)
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box component="section" aria-labelledby="invoice-title" sx={{ bgcolor: 'background.paper', p: 2.5, mt: 2, borderRadius: 2 }}>
      <Typography id="invoice-title" variant="h6">{text('发票处理', 'Invoice processing')}</Typography>
      {error && <Alert severity="error">{text('发票操作失败，请刷新后重试。', 'The invoice operation failed. Refresh and try again.')}</Alert>}
      {!request && !error && <Typography>{text('暂无发票申请。', 'No invoice request yet.')}</Typography>}
      {request && (
        <Stack spacing={1} sx={{ mt: 1 }}>
          <Alert severity={request.issuedAt ? 'success' : 'info'}>{request.issuedAt ? text('已登记开票', 'Invoice recorded') : text('待门店开票', 'Awaiting store invoice')}</Alert>
          <Typography>{text('发票抬头', 'Invoice title')} · {request.title}</Typography>
          {request.taxId && <Typography>{text('纳税人识别号', 'Taxpayer ID')} · {request.taxId}</Typography>}
          {request.reference && <Typography>{text('发票号码', 'Invoice number')} · {request.reference}</Typography>}
          {!request.issuedAt && (
            <Stack component="form" onSubmit={submit} spacing={2} sx={{ pt: 1 }}>
              <TextField size="small" required label={text('线下开具的发票号码', 'Invoice number from your billing system')} value={reference} onChange={(event) => setReference(event.target.value)} slotProps={{ htmlInput: { maxLength: 64 } }} />
              <Button type="submit" variant="contained" disabled={busy || !reference.trim()}>{text('登记已开票', 'Record issued invoice')}</Button>
            </Stack>
          )}
        </Stack>
      )}
    </Box>
  )
}

export default InvoiceRequest

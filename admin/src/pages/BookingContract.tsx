import React, { useEffect, useState } from 'react'
import { Alert, Button } from '@mui/material'
import { NavLink, useSearchParams } from 'react-router-dom'
import { UserType, type Booking, type Car, type Location, type User } from ':bookcars-types'
import Layout from '@/components/Layout'
import env from '@/config/env.config'
import * as BookingService from '@/services/BookingService'
import '@/assets/css/booking-contract.css'

const TEMPLATE_VERSION = 'CN-RENTAL-1'

const storeName = (location?: Location) => [
  location?.values?.find(({ language }) => language === 'zh')?.value || location?.name,
  location?.address,
].filter(Boolean).join(' · ')

const storeTime = (date: Date, timezone?: string) => {
  const options = { dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23' } as const
  const time = new Date(date)
  const zone = timezone || 'Asia/Shanghai'
  if (Number.isNaN(time.getTime())) {
    return '________________'
  }
  try {
    return `${new Intl.DateTimeFormat('zh-CN', { ...options, timeZone: zone }).format(time)}（${zone}）`
  } catch {
    return `${new Intl.DateTimeFormat('zh-CN', { ...options, timeZone: 'UTC' }).format(time)}（UTC）`
  }
}

const ContractSheet = ({ booking }: { booking: Booking }) => {
  const pickup = booking.pickupLocation as Location
  const dropOff = booking.dropOffLocation as Location
  const car = booking.car as Car
  const supplier = booking.supplier as User
  const driver = booking.driver as User | undefined

  return (
    <article className="contract-sheet" lang="zh-CN">
      <header>
        <p>模板版本 {TEMPLATE_VERSION}</p>
        <h1>汽车租赁合同</h1>
        <p>订单编号 {booking._id}</p>
      </header>
      <section>
        <h2>租赁双方与车辆</h2>
        <dl>
          <dt>出租方</dt><dd>{supplier?.fullName || '________________'}</dd>
          <dt>承租方</dt><dd>{driver?.fullName || '________________'}</dd>
          <dt>车辆</dt><dd>{car?.name || '________________'}</dd>
          <dt>车牌号</dt><dd>{car?.licensePlate || '________________'}</dd>
        </dl>
      </section>
      <section>
        <h2>取车与还车</h2>
        <dl>
          <dt>取车网点</dt><dd>{storeName(pickup) || '________________'}</dd>
          <dt>预约取车</dt><dd>{storeTime(booking.from, pickup?.timezone)}</dd>
          <dt>还车网点</dt><dd>{storeName(dropOff) || '________________'}</dd>
          <dt>预约还车</dt><dd>{storeTime(booking.to, dropOff?.timezone)}</dd>
        </dl>
      </section>
      <section>
        <h2>费用与交接</h2>
        <dl>
          <dt>订单金额</dt><dd>{typeof booking.price === 'number' ? `${env.CURRENCY}${booking.price.toFixed(2)}` : '________________'}</dd>
          <dt>押金及退还条件</dt><dd>________________________________</dd>
          <dt>保障及附加费用</dt><dd>________________________________</dd>
        </dl>
        <p>交车前，出租方核验承租人身份和驾驶资格。双方在交接记录中确认车况、里程以及油量或电量。</p>
        <p>双方在签署前确认费用、取消、续租以及事故处理约定。补充约定及附件由双方核对后签署。</p>
        <p>补充约定：________________________________________________</p>
      </section>
      <footer>
        <span>出租方签字或盖章：____________</span>
        <span>承租方签字：____________</span>
        <span>签署日期：____ 年 __ 月 __ 日</span>
      </footer>
    </article>
  )
}

const BookingContract = () => {
  const [params] = useSearchParams()
  const id = params.get('b') || ''
  const [booking, setBooking] = useState<Booking>()
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    if (id && ready) {
      BookingService.getBooking(id)
        .then((data) => {
          if (active) {
            setBooking(data)
            setFailed(!data?._id)
          }
        })
        .catch(() => {
          if (active) {
            setFailed(true)
          }
        })
    }
    return () => {
      active = false
    }
  }, [id, ready])

  return (
    <Layout strict onLoad={(user) => {
      const allowed = user?.type === UserType.Admin || user?.type === UserType.Supplier
      setReady(allowed && user.verified === true)
      if (user && !allowed) {
        setFailed(true)
      }
    }}>
      <main className="booking-contract" lang="zh-CN">
        <div className="contract-actions">
          <Button component={NavLink} to={id ? `/update-booking?b=${encodeURIComponent(id)}` : '/bookings'}>返回订单</Button>
          {booking?._id === id && <Button variant="contained" onClick={() => window.print()}>打印或另存为 PDF</Button>}
        </div>
        {failed || !id
          ? <Alert severity="error">无法读取订单，请从订单列表重新打开。</Alert>
          : booking?._id === id
            ? <><Alert severity="info">由已保存的订单生成。签署前请核对并补全条款，使用本模板时可在交车记录填写版本 {TEMPLATE_VERSION}。</Alert><ContractSheet booking={booking} /></>
            : <p>正在读取订单…</p>}
      </main>
    </Layout>
  )
}

export default BookingContract

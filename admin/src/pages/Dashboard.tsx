import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, CircularProgress } from '@mui/material'
import {
  DirectionsCar as CarsIcon,
  People as DriversIcon,
  AccountBalance as RevenueIcon,
  EventAvailable as BookingsIcon,
  LocationOn as LocationsIcon,
  CorporateFare as SuppliersIcon,
  AddCircleOutline as AddIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { strings } from '@/lang/dashboard'
import { strings as commonStrings } from '@/lang/common'
import { strings as bookingsStrings } from '@/lang/bookings'
import { strings as bookingListStrings } from '@/lang/booking-list'
import * as helper from '@/utils/helper'
import * as DashboardService from '@/services/DashboardService'
import Layout from '@/components/Layout'
import BookingStatus from '@/components/BookingStatus'

import '@/assets/css/dashboard.css'

const STATUS_ORDER: bookcarsTypes.BookingStatus[] = [
  bookcarsTypes.BookingStatus.PaidInFull,
  bookcarsTypes.BookingStatus.Paid,
  bookcarsTypes.BookingStatus.Deposit,
  bookcarsTypes.BookingStatus.Reserved,
  bookcarsTypes.BookingStatus.Pending,
  bookcarsTypes.BookingStatus.Cancelled,
  bookcarsTypes.BookingStatus.Void,
]

const Dashboard = () => {
  const navigate = useNavigate()

  const [user, setUser] = useState<bookcarsTypes.User>()
  const [ready, setReady] = useState(false)
  const [language, setLanguage] = useState(env.DEFAULT_LANGUAGE)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardService.DashboardStats>()

  useEffect(() => {
    if (!ready) {
      return
    }

    const load = async () => {
      setLoading(true)

      try {
        const data = await DashboardService.getStats()
        setStats(data)
      } catch (err) {
        helper.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [ready])

  const onLoad = async (_user?: bookcarsTypes.User) => {
    setUser(_user)
    setLanguage(_user?.language as string)
    setReady(true)
  }

  const maxRevenue = stats ? Math.max(...stats.trend.map((t) => t.revenue), 1) : 1
  const statusTotal = stats ? Object.values(stats.bookingsByStatus).reduce((acc, count) => acc + count, 0) : 0

  const kpis = stats
    ? [
      {
        key: 'bookings',
        label: strings.TOTAL_BOOKINGS,
        value: bookcarsHelper.formatNumber(stats.totalBookings, language),
        icon: <BookingsIcon />,
        tone: 'green',
        onClick: () => navigate('/bookings'),
      },
      {
        key: 'revenue',
        label: strings.TOTAL_REVENUE,
        value: bookcarsHelper.formatPrice(stats.totalRevenue, commonStrings.CURRENCY, language),
        icon: <RevenueIcon />,
        tone: 'amber',
        onClick: () => navigate('/bookings'),
      },
      {
        key: 'fleet',
        label: strings.FLEET,
        value: bookcarsHelper.formatNumber(stats.totalCars, language),
        icon: <CarsIcon />,
        tone: 'blue',
        onClick: () => navigate('/cars'),
      },
      {
        key: 'locations',
        label: strings.LOCATIONS,
        value: bookcarsHelper.formatNumber(stats.totalLocations, language),
        icon: <LocationsIcon />,
        tone: 'teal',
        onClick: () => navigate('/locations'),
      },
      {
        key: 'suppliers',
        label: strings.SUPPLIERS,
        value: bookcarsHelper.formatNumber(stats.totalSuppliers, language),
        icon: <SuppliersIcon />,
        tone: 'purple',
        onClick: () => navigate('/suppliers'),
      },
      {
        key: 'drivers',
        label: strings.DRIVERS,
        value: bookcarsHelper.formatNumber(stats.totalDrivers, language),
        icon: <DriversIcon />,
        tone: 'rose',
        onClick: () => navigate('/users'),
      },
    ]
    : []

  return (
    <Layout onLoad={onLoad} strict>
      <div className="dash">
        <header className="dash-hero">
          <div className="dash-hero-text">
            <span className="dash-eyebrow">{strings.OVERVIEW}</span>
            <h1 className="dash-title">{strings.DASHBOARD_TITLE}</h1>
            <p className="dash-subtitle">
              {stats?.isAdmin ? strings.SCOPE_ADMIN : strings.SCOPE_SUPPLIER}
              {' · '}
              {new Date().toLocaleDateString(language || env.DEFAULT_LANGUAGE, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="dash-actions">
            <Button variant="outlined" className="btn-secondary" startIcon={<AddIcon />} onClick={() => navigate('/create-car')}>
              {strings.ADD_CAR}
            </Button>
            <Button variant="contained" className="btn-primary" startIcon={<AddIcon />} onClick={() => navigate('/create-booking')}>
              {bookingsStrings.NEW_BOOKING}
            </Button>
          </div>
        </header>

        {loading && (
          <div className="dash-loading">
            <CircularProgress size="2rem" />
          </div>
        )}

        {!loading && stats && (
          <>
            <section className="dash-kpis">
              {kpis.map((kpi) => (
                <button key={kpi.key} type="button" className={`dash-kpi dash-kpi-${kpi.tone}`} onClick={kpi.onClick}>
                  <span className="dash-kpi-icon">{kpi.icon}</span>
                  <span className="dash-kpi-body">
                    <span className="dash-kpi-label">{kpi.label}</span>
                    <span className="dash-kpi-value">{kpi.value}</span>
                  </span>
                </button>
              ))}
            </section>

            <section className="dash-grid">
              <article className="dash-panel dash-panel-trend">
                <header className="dash-panel-head">
                  <h2>{strings.REVENUE_TREND}</h2>
                  <span className="dash-panel-note">{strings.LAST_6_MONTHS}</span>
                </header>
                <div className="dash-trend">
                  {stats.trend.map((item) => (
                    <div key={item.month} className="dash-trend-col">
                      <span className="dash-trend-value">
                        {bookcarsHelper.formatPrice(item.revenue, commonStrings.CURRENCY, language)}
                      </span>
                      <div className="dash-trend-bar-wrap">
                        <div
                          className="dash-trend-bar"
                          style={{ height: `${Math.max((item.revenue / maxRevenue) * 100, item.revenue > 0 ? 6 : 2)}%` }}
                        />
                      </div>
                      <span className="dash-trend-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="dash-panel dash-panel-status">
                <header className="dash-panel-head">
                  <h2>{strings.BOOKING_STATUS}</h2>
                  <span className="dash-panel-note">
                    {bookcarsHelper.formatNumber(statusTotal, language)}
                  </span>
                </header>
                <ul className="dash-status-list">
                  {STATUS_ORDER.map((status) => {
                    const count = stats.bookingsByStatus[status] || 0
                    const percent = statusTotal > 0 ? (count / statusTotal) * 100 : 0

                    return (
                      <li key={status} className="dash-status-item">
                        <span className="dash-status-label">
                          <BookingStatus value={status} />
                        </span>
                        <span className="dash-status-track">
                          <span
                            className={`dash-status-fill dash-status-fill-${status.toLowerCase()}`}
                            style={{ width: `${percent}%` }}
                          />
                        </span>
                        <span className="dash-status-count">{bookcarsHelper.formatNumber(count, language)}</span>
                      </li>
                    )
                  })}
                </ul>
              </article>
            </section>

            <section className="dash-panel dash-panel-recent">
              <header className="dash-panel-head">
                <h2>{strings.RECENT_BOOKINGS}</h2>
                <button type="button" className="dash-link" onClick={() => navigate('/bookings')}>
                  {strings.VIEW_ALL}
                  <ArrowIcon fontSize="small" />
                </button>
              </header>

              {stats.recentBookings.length === 0 ? (
                <p className="dash-empty">{strings.NO_DATA}</p>
              ) : (
                <div className="dash-table">
                  <div className="dash-table-head">
                    <span>{bookingListStrings.CAR}</span>
                    <span>{bookingListStrings.DRIVER}</span>
                    <span>{commonStrings.FROM}</span>
                    <span>{commonStrings.TO}</span>
                    <span>{bookingListStrings.PRICE}</span>
                    <span>{bookingListStrings.STATUS}</span>
                  </div>
                  {stats.recentBookings.map((booking: any) => (
                    <button
                      key={booking._id}
                      type="button"
                      className="dash-table-row"
                      onClick={() => navigate(`/update-booking?b=${booking._id}`)}
                    >
                      <span className="dash-table-car">{booking.car?.name}</span>
                      <span>{booking.driver?.fullName}</span>
                      <span>{new Date(booking.from).toLocaleDateString(language || env.DEFAULT_LANGUAGE)}</span>
                      <span>{new Date(booking.to).toLocaleDateString(language || env.DEFAULT_LANGUAGE)}</span>
                      <span className="dash-table-price">
                        {bookcarsHelper.formatPrice(booking.price || 0, commonStrings.CURRENCY, language)}
                      </span>
                      <span><BookingStatus value={booking.status} /></span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard

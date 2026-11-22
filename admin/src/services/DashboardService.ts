import axiosInstance from './axiosInstance'

export interface DashboardTrendItem {
  month: string
  label: string
  revenue: number
  bookings: number
}

export interface DashboardStats {
  isAdmin: boolean
  totalBookings: number
  bookingsByStatus: Record<string, number>
  totalRevenue: number
  totalCars: number
  totalLocations: number
  totalSuppliers: number
  totalDrivers: number
  trend: DashboardTrendItem[]
  recentBookings: any[]
}

/**
 * Get dashboard statistics.
 *
 * @returns {Promise<DashboardStats>}
 */
export const getStats = (): Promise<DashboardStats> =>
  axiosInstance
    .get('/api/dashboard/stats', { withCredentials: true })
    .then((res) => res.data)

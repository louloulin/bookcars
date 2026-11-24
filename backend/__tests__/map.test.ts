import { jest } from '@jest/globals'
import express, { type Express } from 'express'
import request from 'supertest'

const get = jest.fn<() => Promise<unknown>>()
const createApp = async (amapKey = ''): Promise<Express> => {
  jest.resetModules()
  jest.unstable_mockModule('axios', () => ({ default: { get } }))
  jest.unstable_mockModule('../src/config/env.config.js', () => ({ MAP_PROVIDER: 'amap', AMAP_KEY: amapKey }))
  jest.unstable_mockModule('../src/utils/logger.js', () => ({ error: jest.fn() }))
  const { default: routes } = await import('../src/routes/mapRoutes.js')
  return express().use(routes)
}

beforeEach(() => get.mockReset())

it.each([
  ['/geocode', { address: ' ' }],
  ['/reverse-geocode', { longitude: '181', latitude: '20' }],
  ['/reverse-geocode', { longitude: '116abc', latitude: '20' }],
  ['/reverse-geocode', { longitude: ['116', '117'], latitude: '20' }],
  ['/place-search', {}],
  ['/distance', { from: '116,', to: '117,39' }],
  ['/distance', { from: '116,39', to: '117,91' }],
])('rejects invalid input for %s', async (path, query) => {
  const app = await createApp('test-key')
  const response = await request(app).get(`/api/map${path}`).query(query)
  expect(response.statusCode).toBe(400)
  expect(response.body.error).toEqual(expect.any(String))
  expect(get).not.toHaveBeenCalled()
})

it('uses the no-key responses for the four map endpoints', async () => {
  const app = await createApp()
  const [geocode, reverse, places, distance] = await Promise.all([
    request(app).get('/api/map/geocode').query({ address: '浦东机场' }),
    request(app).get('/api/map/reverse-geocode').query({ longitude: '121.80', latitude: '31.15' }),
    request(app).get('/api/map/place-search').query({ keyword: '浦东机场' }),
    request(app).get('/api/map/distance').query({ from: '116.397428,39.909230', to: '116.417428,39.929230' }),
  ])
  expect([geocode.statusCode, reverse.statusCode, places.statusCode, distance.statusCode]).toEqual([404, 404, 200, 200])
  expect(places.body).toEqual([])
  expect(distance.body).toEqual({ distance: 3643, duration: 291, source: 'estimate' })
  expect(get).not.toHaveBeenCalled()
})

it('normalizes high-level geocoding and POI responses from AMap', async () => {
  const app = await createApp('test-key')
  get.mockResolvedValueOnce({ data: { geocodes: [{ location: '121.80,31.15', formatted_address: '上海浦东机场', district: '浦东新区' }] } })
    .mockResolvedValueOnce({ data: { regeocode: { formatted_address: '浦东机场 T2', addressComponent: { district: '浦东新区', adcode: '310115' } } } })
    .mockResolvedValueOnce({ data: { pois: [{ id: 'poi-1', name: '航站楼', location: '121.81,31.16', address: ['迎宾大道'] }, { id: 'invalid' }] } })
  const geocode = await request(app).get('/api/map/geocode').query({ address: '浦东机场', city: '上海' })
  const reverse = await request(app).get('/api/map/reverse-geocode').query({ longitude: '121.8', latitude: '31.15' })
  const places = await request(app).get('/api/map/place-search').query({ keyword: '航站楼', city: '上海' })
  expect([geocode.statusCode, reverse.statusCode, places.statusCode]).toEqual([200, 200, 200])
  expect(geocode.body).toMatchObject({ address: '上海浦东机场', longitude: 121.8, latitude: 31.15, city: '上海' })
  expect(reverse.body).toEqual({ address: '浦东机场 T2', district: '浦东新区', adcode: '310115' })
  expect(places.body).toEqual([{ id: 'poi-1', name: '航站楼', address: '迎宾大道', longitude: 121.81, latitude: 31.16 }])
})

it('returns the AMap v3 driving path and falls back when the provider fails', async () => {
  const app = await createApp('test-key')
  get.mockResolvedValueOnce({ data: { route: { paths: [{ distance: '4800', duration: '720' }] } } })
    .mockResolvedValueOnce({ data: { status: '0', infocode: '10001' } })
  const route = await request(app).get('/api/map/distance').query({ from: '121.8,31.15', to: '121.83,31.17' })
  expect(route.statusCode).toBe(200)
  expect(route.body).toEqual({ distance: 4800, duration: 720, source: 'amap' })
  const fallback = await request(app).get('/api/map/distance').query({ from: '121.8,31.15', to: '121.84,31.17' })
  expect(fallback.statusCode).toBe(200)
  expect(fallback.body).toMatchObject({ source: 'estimate', distance: expect.any(Number), duration: expect.any(Number) })
})

it('reports a provider error carried in an HTTP 200 response', async () => {
  const app = await createApp('test-key')
  get.mockResolvedValueOnce({ data: { status: '0', infocode: '10001' } })
  const response = await request(app).get('/api/map/geocode').query({ address: '上海浦东机场' })
  expect(response.statusCode).toBe(500)
  expect(response.body.error).toEqual(expect.any(String))
})

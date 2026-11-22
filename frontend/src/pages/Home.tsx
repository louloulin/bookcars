import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Dialog, DialogContent, Tab, Tabs } from '@mui/material'
import { ArrowOutward, BadgeOutlined, LocationOnOutlined, SupportAgentOutlined } from '@mui/icons-material'
import L from 'leaflet'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { strings as carsStrings } from '@/lang/cars'
import { strings } from '@/lang/home'
import * as UserService from '@/services/UserService'
import * as SupplierService from '@/services/SupplierService'
import * as CountryService from '@/services/CountryService'
import * as LocationService from '@/services/LocationService'
import Layout from '@/components/Layout'
import SupplierCarrousel from '@/components/SupplierCarrousel'
import TabPanel, { a11yProps } from '@/components/TabPanel'
import LocationCarrousel from '@/components/LocationCarrousel'
import SearchForm from '@/components/SearchForm'
import Map from '@/components/Map'
import Footer from '@/components/Footer'
import FaqList from '@/components/FaqList'
import Mini from '@/assets/img/mini.png'
import Midi from '@/assets/img/midi.png'
import Maxi from '@/assets/img/maxi.png'
import '@/assets/css/home.css'

const Home = () => {
  const [suppliers, setSuppliers] = useState<bookcarsTypes.User[]>([])
  const [countries, setCountries] = useState<bookcarsTypes.CountryInfo[]>([])
  const [locations, setLocations] = useState<bookcarsTypes.Location[]>([])
  const [tabValue, setTabValue] = useState(0)
  const [search, setSearch] = useState<{ pickupLocation?: string, ranges?: bookcarsTypes.CarRange[] }>()

  const onLoad = async () => {
    const [suppliers, countries, locations] = await Promise.all([
      env.HIDE_SUPPLIERS ? [] : SupplierService.getAllSuppliers(),
      CountryService.getCountriesWithLocations('', true, env.MIN_LOCATIONS),
      LocationService.getLocationsWithPosition(),
    ])
    const partners = suppliers.filter((supplier) => supplier.avatar && !/no-image/i.test(supplier.avatar))
    bookcarsHelper.shuffle(partners)
    setSuppliers(partners)
    setCountries(countries)
    setLocations(locations)
  }

  const language = UserService.getLanguage()
  const chinese = language === 'zh'
  const inbound = chinese || language === 'en'
  const vehicles = [
    { range: bookcarsTypes.CarRange.Mini, title: carsStrings.CAR_RANGE_MINI, image: Mini },
    { range: bookcarsTypes.CarRange.Midi, title: carsStrings.CAR_RANGE_MIDI, image: Midi },
    { range: bookcarsTypes.CarRange.Maxi, title: carsStrings.CAR_RANGE_MAXI, image: Maxi },
  ]

  return (
    <Layout onLoad={onLoad} strict={false}>
      <main className="home">
        <section className="home-hero" aria-labelledby="home-heading">
          <picture className="home-hero-image">
            <source media="(max-width: 700px)" srcSet="/tianmen-road-mobile.webp" />
            <img src="/tianmen-road.webp" alt="" fetchPriority="high" />
          </picture>
          <div className="home-shell home-hero-content">
            <span className="home-eyebrow">{chinese ? '入境自驾 · 中文客服' : 'Inbound self-drive · English support'}</span>
            <h1 id="home-heading">
              {inbound ? <>{chinese ? '租辆车，' : 'Explore China'}{' '}<br />{chinese ? '自驾去看中国。' : 'at your own pace.'}</> : strings.TITLE}
            </h1>
            <p>{inbound ? (chinese ? '选择取车地点和日期，查找适合这趟旅程的租车。' : 'Find a rental car for your trip. Choose a pickup point and dates to see what’s available.') : strings.SUBTITLE}</p>
            <div className="home-hero-stats">
              <div><strong>{locations.length}</strong><span>{chinese ? '取车地点' : 'pickup locations'}</span></div>
              <div><strong>{countries.length}</strong><span>{chinese ? '目的地' : 'destinations'}</span></div>
              <div><strong>{suppliers.length}</strong><span>{chinese ? '合作车行' : 'partner suppliers'}</span></div>
            </div>
          </div>
          <a className="home-photo-caption" href="https://www.pexels.com/photo/winding-mountain-road-in-tianmen-national-park-34683518/" target="_blank" rel="noreferrer">
            <LocationOnOutlined fontSize="inherit" /> {chinese ? '湖南 · 天门山' : 'Tianmen Mountain, Hunan'}
          </a>
        </section>

        <div className="home-shell home-search-wrap" id="find-a-car">
          <div className="home-search">
            <SearchForm />
          </div>
        </div>

        {inbound && (
          <section className="home-shell home-travel" id="driving-in-china" aria-labelledby="driving-heading">
            <div className="home-section-heading">
              <h2 id="driving-heading">{chinese ? '在中国自驾前' : 'Before you drive in China'}</h2>
            </div>
            <div className="home-travel-grid">
              <a href="https://www.shanghai.gov.cn/grjszywgjj/20240826/3c73b5e4a7544a2aa382f7cdb6b38916.html" target="_blank" rel="noreferrer" className="home-travel-card">
                <BadgeOutlined />
                <div><h3>{chinese ? '驾驶许可' : 'Driving permit'}</h3><p>{chinese ? '持境外驾照的短期游客，出发前请确认如何申领中国临时驾驶许可。' : 'Travelling with a foreign licence? Check how to obtain a Chinese temporary driving permit.'}</p></div>
                <ArrowOutward className="home-card-arrow" />
              </a>
              <Link to="/locations" className="home-travel-card">
                <LocationOnOutlined />
                <div><h3>{chinese ? '取车地点' : 'Pickup locations'}</h3><p>{chinese ? '查看租车地点，并在预订前确认取车安排。' : 'Find a rental location and check pickup arrangements before you book.'}</p></div>
                <ArrowOutward className="home-card-arrow" />
              </Link>
              <Link to="/contact" className="home-travel-card">
                <SupportAgentOutlined />
                <div><h3>{chinese ? '预订咨询' : 'Booking help'}</h3><p>{chinese ? '咨询取车证件、门店接受的付款卡和押金。' : 'Ask about pickup documents, accepted cards and deposits.'}</p></div>
                <ArrowOutward className="home-card-arrow" />
              </Link>
            </div>
          </section>
        )}

        <section className="home-shell home-section home-steps" aria-labelledby="steps-heading">
          <div className="home-section-heading">
            <h2 id="steps-heading">{chinese ? '三步开始旅程' : 'Three steps to the road'}</h2>
          </div>
          <ol className="home-step-list">
            <li>
              <span className="home-step-index">01</span>
              <h3>{chinese ? '选择地点和日期' : 'Pick a place and dates'}</h3>
              <p>{chinese ? '输入取车地点和行程日期，立刻看到可租车辆。' : 'Enter your pickup point and travel dates to see what is available right away.'}</p>
            </li>
            <li>
              <span className="home-step-index">02</span>
              <h3>{chinese ? '对比车型和保障' : 'Compare cars and cover'}</h3>
              <p>{chinese ? '查看日租价格、保障范围和押金要求，费用一目了然。' : 'See daily rates, protection options and deposit requirements before you commit.'}</p>
            </li>
            <li>
              <span className="home-step-index">03</span>
              <h3>{chinese ? '到店取车出发' : 'Collect and drive'}</h3>
              <p>{chinese ? '门店核验证件后交付车辆，取车指引会随确认邮件发送。' : 'Collect your car at the station once documents are verified. Pickup guidance arrives with your confirmation.'}</p>
            </li>
          </ol>
        </section>

        <section className="home-shell home-section" aria-labelledby="vehicles-heading">
          <div className="home-section-heading">
            <h2 id="vehicles-heading">{inbound ? (chinese ? '找到适合旅程的车型' : 'Find the right fit for your trip') : strings.CAR_SIZE_TITLE}</h2>
          </div>
          <div className="home-vehicle-grid">
            {vehicles.map(({ range, title, image }) => (
              <button type="button" className="home-vehicle" key={range} onClick={() => setSearch({ ranges: [range] })}>
                <div className="home-vehicle-image"><img src={image} alt="" loading="lazy" /></div>
                <span className="home-vehicle-label">{title}<ArrowOutward /></span>
              </button>
            ))}
          </div>
        </section>

        {countries.length > 0 && (
          <section className="home-shell home-section" aria-labelledby="destinations-heading">
            <div className="home-section-heading"><h2 id="destinations-heading">{strings.DESTINATIONS_TITLE}</h2></div>
            <Tabs value={tabValue} onChange={(_event, value) => setTabValue(value)} aria-label={strings.DESTINATIONS_TITLE} variant="scrollable" scrollButtons="auto">
              {countries.map((country, index) => <Tab key={country._id} label={country.name} {...a11yProps(index)} />)}
            </Tabs>
            {countries.map((country, index) => (
              <TabPanel key={country._id} value={tabValue} index={index}>
                <LocationCarrousel locations={country.locations ?? []} onSelect={(location) => setSearch({ pickupLocation: location._id })} />
              </TabPanel>
            ))}
          </section>
        )}

        {locations.length > 0 && (
          <section className="home-shell home-section home-map">
            <Map title={strings.MAP_TITLE} position={new L.LatLng(env.MAP_LATITUDE, env.MAP_LONGITUDE)} initialZoom={env.MAP_ZOOM} locations={locations} onSelelectPickUpLocation={(pickupLocation) => setSearch({ pickupLocation })} />
          </section>
        )}

        {suppliers.length > 3 && (
          <section className="home-shell home-section" aria-labelledby="suppliers-heading">
            <div className="home-section-heading"><h2 id="suppliers-heading">{strings.SUPPLIERS_TITLE}</h2></div>
            <SupplierCarrousel suppliers={suppliers} />
          </section>
        )}

        <section className="home-shell home-section home-faq">
          <FaqList />
          <Button component={Link} to="/contact" variant="outlined" endIcon={<ArrowOutward />}>{strings.CONTACT_US}</Button>
        </section>
      </main>

      <Dialog open={!!search} onClose={() => setSearch(undefined)} fullWidth maxWidth="lg" aria-label={strings.SEARCH_FOR_CAR}>
        <DialogContent className="search-dialog-content">
          {search && <SearchForm ranges={search.ranges ?? bookcarsHelper.getAllRanges()} pickupLocation={search.pickupLocation} onCancel={() => setSearch(undefined)} />}
        </DialogContent>
      </Dialog>
      <Footer />
    </Layout>
  )
}

export default Home

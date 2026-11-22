import React from 'react'
import Layout from '@/components/Layout'
import SupplierList from '@/components/SupplierList'
import Footer from '@/components/Footer'
import PageHero from '@/components/PageHero'
import TrustBar from '@/components/TrustBar'
import { strings as pageStrings } from '@/lang/page'

import '@/assets/css/suppliers.css'

const Suppliers = () => {
  const onLoad = () => {
  }

  return (
    <Layout onLoad={onLoad} strict={false}>
      <div className="suppliers">
        <PageHero eyebrow={pageStrings.SUPPLIERS_EYEBROW} title={pageStrings.SUPPLIERS_TITLE} subtitle={pageStrings.SUPPLIERS_SUBTITLE} />

        <div className="page-section">
          <SupplierList />
        </div>

        <div className="page-section page-section-tight">
          <TrustBar />
        </div>
      </div>
      <Footer />
    </Layout>
  )
}

export default Suppliers

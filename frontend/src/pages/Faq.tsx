import React from 'react'
import FaqList from '@/components/FaqList'
import Footer from '@/components/Footer'
import Layout from '@/components/Layout'
import PageHero from '@/components/PageHero'
import TrustBar from '@/components/TrustBar'
import { strings as pageStrings } from '@/lang/page'

import '@/assets/css/faq.css'

const Faq = () => (
  <Layout strict={false}>
    <div className="faq">
      <PageHero eyebrow={pageStrings.FAQ_EYEBROW} title={pageStrings.FAQ_TITLE} subtitle={pageStrings.FAQ_SUBTITLE} />

      <div className="page-section">
        <FaqList />
      </div>

      <div className="page-section page-section-tight">
        <TrustBar />
      </div>
    </div>

    <Footer />
  </Layout>
)

export default Faq

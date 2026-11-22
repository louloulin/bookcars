import React from 'react'
import { strings } from '@/lang/privacy'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'

import '@/assets/css/privacy.css'
import '@/assets/css/page.css'

const ToS = () => {
  const onLoad = () => { }

  return (
    <Layout onLoad={onLoad} strict={false}>
      <div className="privacy legal-page">
        <div className="page-section">
          <div className="page-card page-prose legal-card">
            <h1>{strings.TITLE}</h1>
            <p>{strings.PRIVACY_POLICY}</p>
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  )
}

export default ToS

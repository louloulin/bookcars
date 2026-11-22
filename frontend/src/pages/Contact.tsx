import React, { useState } from 'react'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import ContactForm from '@/components/ContactForm'
import Footer from '@/components/Footer'
import PageHero from '@/components/PageHero'
import TrustBar from '@/components/TrustBar'
import { strings as pageStrings } from '@/lang/page'

import '@/assets/css/contact.css'

const Contact = () => {
  const [user, setUser] = useState<bookcarsTypes.User>()

  const onLoad = (_user?: bookcarsTypes.User) => {
    setUser(_user)
  }

  return (
    <Layout onLoad={onLoad} strict={false}>
      <div className="contact">
        <PageHero eyebrow={pageStrings.CONTACT_EYEBROW} title={pageStrings.CONTACT_TITLE} subtitle={pageStrings.CONTACT_SUBTITLE} />

        <div className="page-section">
          <div className="page-card contact-card">
            <ContactForm user={user} className="form" />
          </div>
        </div>

        <div className="page-section page-section-tight">
          <TrustBar />
        </div>
      </div>

      <Footer />
    </Layout>
  )
}

export default Contact

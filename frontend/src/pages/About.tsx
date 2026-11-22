import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import { strings } from '@/lang/about'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import PageHero from '@/components/PageHero'
import TrustBar from '@/components/TrustBar'
import { strings as pageStrings } from '@/lang/page'

import '@/assets/css/about.css'

const About = () => {
  const navigate = useNavigate()

  const onLoad = () => { }

  return (
    <Layout onLoad={onLoad} strict={false}>
      <div className="about">
        <PageHero eyebrow={pageStrings.ABOUT_EYEBROW} title={pageStrings.ABOUT_TITLE} subtitle={pageStrings.ABOUT_SUBTITLE} />

        <div className="page-section">
          <div className="page-card page-prose">
            <h1>{strings.TITLE1}</h1>
            <h2>{strings.SUBTITLE1}</h2>
            <p>{strings.CONTENT1}</p>
          </div>
        </div>

        <div className="page-section page-section-tight">
          <div className="page-card page-prose">
            <h1>{strings.TITLE2}</h1>
            <h2>{strings.SUBTITLE2}</h2>
            <p>{strings.CONTENT2}</p>
          </div>
        </div>

        <div className="page-section page-section-tight">
          <TrustBar />
        </div>

        <div className="page-section page-section-tight" style={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            className="btn-primary"
            aria-label="Find deal"
            onClick={() => navigate('/')}
          >
            {strings.FIND_DEAL}
          </Button>
        </div>
      </div>

      <Footer />
    </Layout>
  )
}

export default About

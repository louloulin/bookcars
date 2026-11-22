import React, { ReactNode } from 'react'

import '@/assets/css/page.css'

interface PageHeroProps {
  eyebrow?: string
  title: string
  subtitle?: string
  children?: ReactNode
  tone?: 'light' | 'dark'
}

const PageHero = ({ eyebrow, title, subtitle, children, tone = 'light' }: PageHeroProps) => (
  <section className={`page-hero page-hero-${tone}`}>
    <div className="page-hero-inner">
      <div className="page-hero-text">
        {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="page-hero-actions">{children}</div>}
    </div>
  </section>
)

export default PageHero

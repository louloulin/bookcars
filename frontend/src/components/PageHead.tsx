import React, { ReactNode } from 'react'

import '@/assets/css/page.css'

interface PageHeadProps {
  title: string
  subtitle?: string
  children?: ReactNode
}

const PageHead = ({ title, subtitle, children }: PageHeadProps) => (
  <div className="page-head">
    <div className="page-head-text">
      <h1 className="page-head-title">{title}</h1>
      {subtitle && <p className="page-head-subtitle">{subtitle}</p>}
    </div>
    {children && <div className="page-head-actions">{children}</div>}
  </div>
)

export default PageHead

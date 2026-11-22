import React from 'react'

interface WorkspaceHeadProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

const WorkspaceHead = ({ title, subtitle, children }: WorkspaceHeadProps) => {
  return (
    <div className="ws-head">
      <div className="ws-head-text">
        <h1 className="ws-head-title">{title}</h1>
        {subtitle && <p className="ws-head-sub">{subtitle}</p>}
      </div>
      {children && <div className="ws-head-actions">{children}</div>}
    </div>
  )
}

export default WorkspaceHead

import React from 'react'
import { strings } from '@/lang/page'

import '@/assets/css/page.css'

const TrustBar = () => (
  <div className="page-grid-3">
    <div className="page-feature">
      <span className="page-feature-index">01</span>
      <h3>{strings.TRUST_1}</h3>
      <p>{strings.TRUST_1_TEXT}</p>
    </div>
    <div className="page-feature">
      <span className="page-feature-index">02</span>
      <h3>{strings.TRUST_2}</h3>
      <p>{strings.TRUST_2_TEXT}</p>
    </div>
    <div className="page-feature">
      <span className="page-feature-index">03</span>
      <h3>{strings.TRUST_3}</h3>
      <p>{strings.TRUST_3_TEXT}</p>
    </div>
  </div>
)

export default TrustBar

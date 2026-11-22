import React, { useState } from 'react'

/**
 * An <img> that degrades gracefully: if the remote/CDN file is missing or
 * fails to load, we render a neutral placeholder instead of the browser's
 * broken-image icon. This keeps list/table layouts clean even when the CDN
 * asset has not been uploaded yet.
 */
interface Props {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
  /** Placeholder text (usually initials) shown inside the fallback box. */
  initials?: string;
}

const SafeImage: React.FC<Props> = ({ src, alt, className, style, fallback, initials }) => {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <span className={`safe-image-fallback ${className || ''}`} style={style} aria-hidden="true">
        {fallback ?? initials ?? ''}
      </span>
    )
  }

  return <img src={src} alt={alt} className={className} style={style} onError={() => setFailed(true)} />
}

export default SafeImage

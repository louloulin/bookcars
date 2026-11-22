import React, { useState } from 'react';
import env from '@/config/env.config';
import * as bookcarsHelper from ':bookcars-helper';

interface Props {
  avatar?: string;
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Supplier avatar with a graceful fallback: when the avatar image is missing
 * (or fails to load) we render the supplier initials instead of a broken image.
 */
const SupplierAvatar: React.FC<Props> = ({ avatar, name, className, style }) => {
  const [failed, setFailed] = useState(false);
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const src = avatar ? bookcarsHelper.joinURL(env.CDN_USERS, avatar) : '';

  if (!src || failed) {
    return (
      <span className={`supplier-avatar-fallback ${className || ''}`} style={style} aria-hidden="true">
        {initial}
      </span>
    );
  }

  return <img src={src} alt={name} className={className} style={style} onError={() => setFailed(true)} />;
};

export default SupplierAvatar;

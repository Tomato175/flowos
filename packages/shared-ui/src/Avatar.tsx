import React from 'react';
import { colors } from '@flow/design-system';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  style?: React.CSSProperties;
}

export function Avatar({ src, name, size = 40, style }: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const avatarStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
    color: colors.primary[700],
    fontSize: size * 0.35,
    fontWeight: 600,
    overflow: 'hidden',
    ...style,
  };

  if (src) {
    return <img src={src} alt={name ?? ''} style={{ ...avatarStyle, objectFit: 'cover' }} />;
  }

  return <div style={avatarStyle}>{initials}</div>;
}

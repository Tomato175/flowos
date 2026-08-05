import React from 'react';
import { colors, radius, fontSize, spacing } from '@flow/design-system';

export interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  bgColor?: string;
  style?: React.CSSProperties;
}

export function Badge({ children, color = '#FFFFFF', bgColor = colors.primary[500], style }: BadgeProps) {
  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing[0]} ${spacing[2]}`,
    fontSize: fontSize.xs,
    fontWeight: 500,
    color,
    backgroundColor: bgColor,
    borderRadius: radius.full,
    ...style,
  };

  return <span style={badgeStyle}>{children}</span>;
}

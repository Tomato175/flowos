import React from 'react';
import { colors, fontSize, fontWeight } from '@flow/design-system';

export interface TypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
  color?: string;
  align?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
}

const variantStyles: Record<string, React.CSSProperties> = {
  h1: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold, lineHeight: 1.2 },
  h2: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, lineHeight: 1.3 },
  h3: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, lineHeight: 1.4 },
  body: { fontSize: fontSize.base, fontWeight: fontWeight.normal, lineHeight: 1.6 },
  caption: { fontSize: fontSize.sm, fontWeight: fontWeight.normal, lineHeight: 1.5 },
  label: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, lineHeight: 1.4 },
};

export function Typography({
  children,
  variant = 'body',
  color = colors.neutral[800],
  align = 'left',
  style,
}: TypographyProps) {
  const baseStyle: React.CSSProperties = {
    ...variantStyles[variant],
    color,
    textAlign: align,
    margin: 0,
    ...style,
  };

  const Tag = variant.startsWith('h') ? variant : 'p';

  return React.createElement(Tag, { style: baseStyle }, children);
}

import React from 'react';
import { colors, spacing, radius, shadows } from '@flow/design-system';

export interface CardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const paddingMap = {
  sm: spacing[3],
  md: spacing[4],
  lg: spacing[6],
};

export function Card({ children, padding = 'md', hover = false, onClick, style }: CardProps) {
  const baseStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    border: `1px solid ${colors.neutral[200]}`,
    padding: paddingMap[padding],
    transition: 'all 200ms ease',
    cursor: onClick ? 'pointer' : undefined,
    ...style,
  };

  const hoverStyle: React.CSSProperties = hover
    ? {
        boxShadow: shadows.md,
      }
    : {};

  return (
    <div
      style={{ ...baseStyle, ...hoverStyle }}
      onClick={onClick}
      onMouseEnter={
        hover
          ? (e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = shadows.lg;
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
            }
          : undefined
      }
      onMouseLeave={
        hover
          ? (e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = '';
              (e.currentTarget as HTMLDivElement).style.transform = '';
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

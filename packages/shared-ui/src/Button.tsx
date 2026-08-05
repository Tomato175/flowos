import React from 'react';
import { colors, spacing, radius, fontSize, fontWeight, transitions } from '@flow/design-system';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  style?: React.CSSProperties;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    backgroundColor: colors.primary[600],
    color: '#FFFFFF',
    border: 'none',
  },
  secondary: {
    backgroundColor: colors.neutral[100],
    color: colors.neutral[700],
    border: `1px solid ${colors.neutral[200]}`,
  },
  ghost: {
    backgroundColor: 'transparent',
    color: colors.neutral[600],
    border: 'none',
  },
  danger: {
    backgroundColor: colors.semantic.error,
    color: '#FFFFFF',
    border: 'none',
  },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: {
    padding: `${spacing[1]} ${spacing[3]}`,
    fontSize: fontSize.sm,
    borderRadius: radius.md,
  },
  md: {
    padding: `${spacing[2]} ${spacing[4]}`,
    fontSize: fontSize.base,
    borderRadius: radius.lg,
  },
  lg: {
    padding: `${spacing[3]} ${spacing[6]}`,
    fontSize: fontSize.lg,
    borderRadius: radius.xl,
  },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onPress,
  style,
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    fontWeight: fontWeight.medium,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: `all ${transitions.fast}`,
    width: fullWidth ? '100%' : undefined,
    userSelect: 'none',
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  };

  return (
    <button style={baseStyle} disabled={disabled || loading} onClick={onPress} type="button">
      {loading && <Spinner size={size === 'sm' ? 14 : 18} />}
      {children}
    </button>
  );
}

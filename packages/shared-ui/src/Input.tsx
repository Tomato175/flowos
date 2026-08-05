import React from 'react';
import { colors, spacing, radius, fontSize } from '@flow/design-system';

export interface InputProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'search';
  disabled?: boolean;
  error?: string;
  label?: string;
  style?: React.CSSProperties;
}

export function Input({
  value,
  placeholder,
  onChange,
  type = 'text',
  disabled = false,
  error,
  label,
  style,
}: InputProps) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: fontSize.base,
    borderRadius: radius.lg,
    border: `1.5px solid ${error ? colors.semantic.error : colors.neutral[300]}`,
    backgroundColor: disabled ? colors.neutral[100] : '#FFFFFF',
    color: colors.neutral[800],
    outline: 'none',
    transition: 'border-color 150ms ease',
    boxSizing: 'border-box',
    ...style,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1], width: '100%' }}>
      {label && (
        <label style={{ fontSize: fontSize.sm, fontWeight: 500, color: colors.neutral[600] }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        style={inputStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? colors.semantic.error : colors.primary[500];
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? colors.semantic.error : colors.neutral[300];
        }}
      />
      {error && (
        <span style={{ fontSize: fontSize.xs, color: colors.semantic.error }}>{error}</span>
      )}
    </div>
  );
}

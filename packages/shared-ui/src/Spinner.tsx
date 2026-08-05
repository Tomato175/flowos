import React from 'react';
import { colors } from '@flow/design-system';

interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 20, color = 'currentColor' }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{
        animation: 'flow-spin 0.8s linear infinite',
        display: 'inline-block',
      }}
    >
      <style>{`
        @keyframes flow-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray="31.4 31.4"
        strokeLinecap="round"
        opacity={0.3}
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray="31.4 31.4"
        strokeDashoffset="23.55"
        strokeLinecap="round"
      />
    </svg>
  );
}

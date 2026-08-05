import React from 'react';
import { Typography } from './Typography';
import { colors, spacing } from '@flow/design-system';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${spacing[12]} ${spacing[4]}`,
        textAlign: 'center',
        gap: spacing[3],
      }}
    >
      <span style={{ fontSize: 48 }}>{icon}</span>
      <Typography variant="h3" color={colors.neutral[600]}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body" color={colors.neutral[400]}>
          {description}
        </Typography>
      )}
      {action && <div style={{ marginTop: spacing[2] }}>{action}</div>}
    </div>
  );
}

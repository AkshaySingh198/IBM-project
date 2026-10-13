import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Inbox size={32} color="var(--muted)" />,
  title,
  description,
  action,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
      }}
    >
      <div style={{ marginBottom: '1rem', opacity: 0.8 }}>{icon}</div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.35rem' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', maxWidth: '380px', marginBottom: '1.25rem' }}>
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

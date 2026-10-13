import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { COPY } from '../../copy';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  title?: string;
  style?: React.CSSProperties;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onRetry,
  title = COPY.auth.networkError,
  style,
}) => {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--high-bg)',
        border: '1px solid var(--high-border)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--high)',
        gap: '1rem',
        ...style,
      }}
    >
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{title}</div>
          <div style={{ fontSize: '0.8125rem', opacity: 0.9, marginTop: '0.2rem' }}>{message}</div>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          icon={<RefreshCw size={14} />}
          style={{
            borderColor: 'var(--high-border)',
            color: 'var(--high)',
            backgroundColor: 'var(--white)',
            flexShrink: 0,
          }}
        >
          {COPY.common.tryAgain}
        </Button>
      )}
    </div>
  );
};

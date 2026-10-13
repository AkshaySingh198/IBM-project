import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  title?: string;
  style?: React.CSSProperties;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onRetry,
  title = 'An error occurred',
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
        backgroundColor: 'var(--risk-high-bg)',
        border: '1px solid #F7C8C4',
        borderRadius: 'var(--radius-md)',
        color: 'var(--risk-high-text)',
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
            borderColor: '#F7C8C4',
            color: 'var(--risk-high-text)',
            backgroundColor: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          Retry
        </Button>
      )}
    </div>
  );
};

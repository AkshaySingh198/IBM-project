import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In production we would report to an audit/monitoring service, avoiding PII leakage
    void error;
    void errorInfo;
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: 'var(--bg)',
          }}
        >
          <div
            className="tessera-card"
            style={{
              maxWidth: '480px',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              backgroundColor: 'var(--surface)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--risk-high-bg)',
                color: 'var(--risk-high-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              An unexpected interface error occurred. You can reload the page to restore state safely.
            </p>
            <Button
              variant="dark"
              onClick={() => window.location.reload()}
              icon={<RefreshCw size={16} />}
            >
              Reload application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

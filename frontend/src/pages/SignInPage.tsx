import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export const SignInPage: React.FC = () => {
  const { login, sessionExpired, clearSessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showDemoLogins = import.meta.env.VITE_SHOW_DEMO_LOGINS === 'true';

  const demoAccounts = [
    { email: 'analyst@bank.com', role: 'Analyst', desc: 'Case review & overrides' },
    { email: 'investigator@bank.com', role: 'Senior Investigator', desc: 'Dual-control reveal approvals' },
    { email: 'auditor@bank.com', role: 'Auditor', desc: 'Read-only compliance audit trail' },
    { email: 'admin@bank.com', role: 'Admin', desc: 'System governance & roles' },
    { email: 'service@bank.com', role: 'Service Account', desc: 'Automated data ingestion' },
  ];

  const handleLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setErrorMessage(null);
    clearSessionExpired();

    try {
      await login(loginEmail, loginPass);
      const destination = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || 'Invalid email or password';
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    handleLogin(email.trim(), password);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        backgroundColor: 'var(--bg)',
      }}
    >
      <div
        className="tessera-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem 2rem',
          backgroundColor: 'var(--surface)',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <Shield size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            Tessera
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
            Privacy-first fraud investigation workspace
          </p>
        </div>

        {/* Session Expired Notice */}
        {sessionExpired && (
          <div
            role="status"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--amber-bg)',
              border: '1px solid #F9DE96',
              color: 'var(--amber-text)',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            <Lock size={16} style={{ flexShrink: 0 }} />
            <span>Your session has expired. Please sign in again to continue.</span>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div
            role="alert"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--risk-high-bg)',
              border: '1px solid #F7C8C4',
              color: 'var(--risk-high-text)',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          <div>
            <label
              htmlFor="signin-email"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '0.375rem' }}
            >
              Email address
            </label>
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. analyst@bank.com"
              required
              autoComplete="username"
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface)',
                minHeight: '44px',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="signin-password"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '0.375rem' }}
            >
              Password
            </label>
            <input
              id="signin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface)',
                minHeight: '44px',
              }}
            />
          </div>

          <Button
            type="submit"
            variant="dark"
            loading={loading}
            icon={<ArrowRight size={16} />}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            Sign in to workspace
          </Button>
        </form>

        {/* One-Click Demo Accounts */}
        {showDemoLogins && (
          <div style={{ marginTop: '2rem', borderTop: '1px dashed var(--dashed-border)', paddingTop: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--muted)',
                marginBottom: '0.75rem',
              }}
            >
              <UserCheck size={14} />
              <span>One-Click Demo Roles</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('password123');
                    handleLogin(acc.email, 'password123');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#FAF9F5',
                    border: '1px solid var(--line)',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent-soft)';
                    e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FAF9F5';
                    e.currentTarget.style.borderColor = 'var(--line)';
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)' }}>{acc.role}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>{acc.desc}</div>
                  </div>
                  <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>
                    {acc.email.split('@')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, AlertCircle, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { COPY } from '../copy';

export const SignInPage: React.FC = () => {
  const { login, sessionExpired, clearSessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${COPY.brand.name} — ${COPY.auth.signInButton}`;
  }, []);

  const showDemoLogins = import.meta.env.VITE_SHOW_DEMO_LOGINS === 'true';

  const demoAccounts = [
    {
      email: 'analyst@bank.com',
      role: COPY.auth.roles.analyst.title,
      desc: COPY.auth.roles.analyst.desc,
    },
    {
      email: 'investigator@bank.com',
      role: COPY.auth.roles.investigator.title,
      desc: COPY.auth.roles.investigator.desc,
    },
    {
      email: 'auditor@bank.com',
      role: COPY.auth.roles.auditor.title,
      desc: COPY.auth.roles.auditor.desc,
    },
    {
      email: 'admin@bank.com',
      role: COPY.auth.roles.admin.title,
      desc: COPY.auth.roles.admin.desc,
    },
    {
      email: 'service@bank.com',
      role: COPY.auth.roles.service.title,
      desc: COPY.auth.roles.service.desc,
    },
  ];

  const handleLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setErrorMessage(null);
    clearSessionExpired();

    try {
      await login(loginEmail, loginPass);
      const destination =
        (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || COPY.auth.networkError;
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your work email and password.');
      return;
    }
    handleLogin(email.trim(), password);
  };

  return (
    <div className="signin-container">
      {/* Left Column: Brand & Guarantees */}
      <div className="signin-left">
        <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
          {/* Logo with 3 white tiles + 1 teal tile */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              marginBottom: '2.5rem',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="2" width="11" height="11" rx="2" fill="var(--white)" />
                <rect x="15" y="2" width="11" height="11" rx="2" fill="var(--white)" />
                <rect x="2" y="15" width="11" height="11" rx="2" fill="var(--primary)" />
                <rect x="15" y="15" width="11" height="11" rx="2" fill="var(--white)" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--white)',
                  letterSpacing: '-0.01em',
                }}
              >
                {COPY.brand.name}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--side-muted)',
                }}
              >
                {COPY.brand.tagline}
              </div>
            </div>
          </div>

          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 600,
              lineHeight: 1.25,
              color: 'var(--white)',
              letterSpacing: '-0.02em',
              marginBottom: '2rem',
            }}
          >
            {COPY.auth.heroHeadline}
          </h1>

          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {COPY.auth.bullets.map((bullet, idx) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  fontSize: '0.9375rem',
                  lineHeight: 1.5,
                  color: 'var(--side-text)',
                }}
              >
                <CheckCircle2
                  size={20}
                  color="var(--primary-soft)"
                  style={{ flexShrink: 0, marginTop: '2px' }}
                />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div className="signin-right">
        <div style={{ maxWidth: '420px', margin: '0 auto', width: '100%' }}>
          {/* Session Expired Notice */}
          {sessionExpired && (
            <div
              role="status"
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--warn-pill-bg)',
                border: '1px solid var(--warn-pill-border)',
                color: 'var(--warn-pill)',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginBottom: '1.5rem',
              }}
            >
              <Lock size={16} style={{ flexShrink: 0 }} />
              <span>{COPY.auth.sessionExpired}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--high-bg)',
                border: '1px solid var(--high-border)',
                color: 'var(--high)',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginBottom: '1.5rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div style={{ marginBottom: '1.75rem' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--ink)',
                letterSpacing: '-0.02em',
              }}
            >
              {COPY.auth.title}
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--muted)',
                marginTop: '0.35rem',
              }}
            >
              {COPY.auth.subtitle}
            </p>
          </div>

          {/* Credentials Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem', width: '100%' }}
          >
            <div style={{ width: '100%' }}>
              <label
                htmlFor="signin-email"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--ink)',
                  marginBottom: '0.375rem',
                }}
              >
                {COPY.auth.emailLabel}
              </label>
              <input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={COPY.auth.emailPlaceholder}
                required
                autoComplete="username"
                style={{
                  display: 'block',
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--ink)',
                  minHeight: '44px',
                }}
              />
            </div>

            <div style={{ width: '100%' }}>
              <label
                htmlFor="signin-password"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--ink)',
                  marginBottom: '0.375rem',
                }}
              >
                {COPY.auth.passwordLabel}
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
                  display: 'block',
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--ink)',
                  minHeight: '44px',
                }}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={<ArrowRight size={16} />}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? COPY.auth.signingIn : COPY.auth.signInButton}
            </Button>
          </form>

          {/* One-Click Demo Accounts */}
          {showDemoLogins && (
            <div
              style={{
                marginTop: '2rem',
                borderTop: '1px dashed var(--line-strong)',
                paddingTop: '1.5rem',
              }}
            >
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
                <span>{COPY.auth.demoAccountsTitle}</span>
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
                      backgroundColor: 'var(--surface-2)',
                      border: '1px solid var(--line)',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--row-hover)';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-2)';
                      e.currentTarget.style.borderColor = 'var(--line)';
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: 'var(--ink)',
                        }}
                      >
                        {acc.role}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>
                        {acc.desc}
                      </div>
                    </div>
                    <span
                      className="mono"
                      style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}
                    >
                      {acc.email.split('@')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .signin-container {
          min-height: 100vh;
          display: flex;
          flex-direction: row;
          background-color: var(--surface);
        }
        .signin-left {
          flex: 1.1;
          background-color: var(--side-bg);
          color: var(--white);
          padding: 4rem 3.5rem;
          display: flex;
          flex-direction: column;
          justifyContent: center;
        }
        .signin-right {
          flex: 1;
          background-color: var(--surface);
          padding: 4rem 3.5rem;
          display: flex;
          flex-direction: column;
          justifyContent: center;
        }
        @media (max-width: 800px) {
          .signin-container {
            flex-direction: column;
          }
          .signin-left {
            padding: 2.5rem 1.5rem;
          }
          .signin-right {
            padding: 2.5rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

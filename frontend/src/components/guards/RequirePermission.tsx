import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppShell } from '../layout/AppShell';

interface RequirePermissionProps {
  permission: string;
  children: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({ permission, children }) => {
  const { hasPermission, user } = useAuth();

  if (!hasPermission(permission)) {
    return (
      <AppShell>
        <div
          className="tessera-card"
          style={{
            maxWidth: '560px',
            margin: '3rem auto',
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
            <ShieldAlert size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem' }}>
            Access Restricted
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Your role (<strong>{user?.role_name || 'Current User'}</strong>) does not have the required permission (
            <code className="mono" style={{ padding: '0.1rem 0.3rem', background: '#FAF9F5', borderRadius: '4px' }}>
              {permission}
            </code>
            ) to view this module.
          </p>
          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
            If you need access to this resource, contact your system compliance administrator.
          </div>
        </div>
      </AppShell>
    );
  }

  return <>{children}</>;
};

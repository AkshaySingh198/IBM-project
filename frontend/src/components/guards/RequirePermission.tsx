import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppShell } from '../layout/AppShell';
import { COPY } from '../../copy';

interface RequirePermissionProps {
  permission: string;
  children: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({ children, permission }) => {
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
              backgroundColor: 'var(--high-bg)',
              color: 'var(--high)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <ShieldAlert size={24} />
          </div>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--ink)',
              marginBottom: '0.5rem',
            }}
          >
            {COPY.auth.accessDenied}
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--muted)',
              lineHeight: 1.6,
              marginBottom: '1.5rem',
            }}
          >
            Your signed-in account (<strong>{user?.role_name || user?.username || 'User'}</strong>) cannot view this page.
          </p>
        </div>
      </AppShell>
    );
  }

  return <>{children}</>;
};

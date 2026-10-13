import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  FileText,
  History,
  Lock,
  Unlock,
  LogOut,
  Menu,
  X,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { COPY } from '../../copy';

interface AppShellProps {
  children: React.ReactNode;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  onSearch,
  searchPlaceholder = COPY.caseQueue.searchPlaceholder,
}) => {
  const { user, logout, hasPermission, revealedCount } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/signin');
  };

  const navItems = [
    {
      to: '/',
      label: COPY.nav.cases,
      icon: <ShieldAlert size={18} />,
      permission: 'cases:read',
    },
    {
      to: '/reveal-requests',
      label: COPY.nav.nameRequests,
      icon: <FileText size={18} />,
      permission: 'cases:read',
    },
    {
      to: '/audit',
      label: COPY.nav.activityLog,
      icon: <History size={18} />,
      permission: 'audit:read',
    },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* Sidebar for Desktop */}
      <aside
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--side-bg)',
          borderRight: '1px solid var(--side-active)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 40,
          transition: 'transform 0.2s ease',
        }}
        className="tessera-sidebar"
      >
        {/* Logo and Brand: white with one teal tile */}
        <div
          style={{
            padding: '1.25rem 1.25rem 1rem',
            borderBottom: '1px solid var(--side-active)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="11" height="11" rx="2" fill="var(--white)" />
              <rect x="15" y="2" width="11" height="11" rx="2" fill="var(--white)" />
              <rect x="2" y="15" width="11" height="11" rx="2" fill="var(--primary)" />
              <rect x="15" y="15" width="11" height="11" rx="2" fill="var(--white)" />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontSize: '1.0625rem',
                fontWeight: 600,
                color: 'var(--white)',
                letterSpacing: '-0.01em',
              }}
            >
              {COPY.brand.name}
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                color: 'var(--side-muted)',
                letterSpacing: '0.02em',
              }}
            >
              {COPY.brand.tagline}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          style={{
            padding: '1rem 0.75rem',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          {navItems
            .filter((item) => hasPermission(item.permission))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: isActive ? 'var(--white)' : 'var(--side-text)',
                  backgroundColor: isActive ? 'var(--side-active)' : 'transparent',
                  transition: 'background-color 0.15s ease',
                })}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
        </nav>

        {/* User Chip at Bottom */}
        {user && (
          <div
            style={{
              padding: '1rem',
              borderTop: '1px solid var(--side-active)',
              backgroundColor: 'var(--side-active)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--white)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {user.username}
              </div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--side-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                }}
              >
                {user.role_name}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label={COPY.nav.signOut}
              title={COPY.nav.signOut}
              style={{
                padding: '0.375rem',
                color: 'var(--side-text)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </aside>

      {/* Main Wrapper */}
      <div
        style={{
          marginLeft: 'var(--sidebar-width)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
        className="tessera-main-wrapper"
      >
        {/* Topbar */}
        <header
          style={{
            height: 'var(--topbar-height)',
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Mobile menu toggle */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            style={{
              display: 'none',
              padding: '0.5rem',
              color: 'var(--ink)',
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Search bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md)',
              padding: '0.35rem 0.75rem',
              width: '100%',
              maxWidth: '380px',
            }}
          >
            <Search size={16} color="var(--muted)" />
            <input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '0.8125rem',
                color: 'var(--ink)',
              }}
            />
          </div>

          {/* Privacy Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {revealedCount > 0 ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '100px',
                  backgroundColor: 'var(--warn-pill-bg)',
                  border: '1px solid var(--warn-pill-border)',
                  color: 'var(--warn-pill)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                <Unlock size={13} />
                <span>{COPY.brand.namesVisible(revealedCount)}</span>
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '100px',
                  backgroundColor: 'var(--primary-soft)',
                  border: '1px solid var(--primary)',
                  color: 'var(--primary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                <Lock size={13} />
                <span>{COPY.brand.namesHidden}</span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content Container */}
        <main style={{ padding: '1.5rem', flex: 1, minWidth: 0 }}>{children}</main>
      </div>

      <style>{`
        @media (max-width: 800px) {
          .tessera-sidebar {
            transform: translateX(${mobileMenuOpen ? '0' : '-100%'});
          }
          .tessera-main-wrapper {
            margin-left: 0 !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

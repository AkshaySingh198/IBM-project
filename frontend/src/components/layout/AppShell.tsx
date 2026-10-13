import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldAlert, FileText, History, Lock, Unlock, LogOut, Menu, X, Search, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AppShellProps {
  children: React.ReactNode;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  onSearch,
  searchPlaceholder = 'Search case ID, token, narrative...',
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
      label: 'Case queue',
      icon: <ShieldAlert size={18} />,
      permission: 'cases:read',
    },
    {
      to: '/reveal-requests',
      label: 'Reveal requests',
      icon: <FileText size={18} />,
      permission: 'cases:read',
    },
    {
      to: '/audit',
      label: 'Audit log',
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
          backgroundColor: 'var(--surface)',
          borderRight: '1px solid var(--line)',
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
        {/* Logo and Brand */}
        <div
          style={{
            padding: '1.25rem 1.25rem 1rem',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <Shield size={18} />
          </div>
          <div>
            <div style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              Tessera
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Privacy-first workspace
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                  color: isActive ? 'var(--accent)' : 'var(--ink)',
                  backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
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
              borderTop: '1px solid var(--line)',
              backgroundColor: '#FAF9F5',
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
                  color: 'var(--ink)',
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
                  color: 'var(--muted)',
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
              aria-label="Sign out"
              title="Sign out"
              style={{
                padding: '0.375rem',
                color: 'var(--muted)',
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
                  backgroundColor: 'var(--amber-bg)',
                  border: '1px solid #F9DE96',
                  color: 'var(--amber-text)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                <Unlock size={13} />
                <span>
                  {revealedCount} {revealedCount === 1 ? 'identity' : 'identities'} visible to you
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '100px',
                  backgroundColor: 'var(--accent-soft)',
                  border: '1px solid rgba(11, 91, 80, 0.2)',
                  color: 'var(--accent)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                <Lock size={13} />
                <span>Identities hidden</span>
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
        @keyframes pulseSkeleton {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @keyframes fadeInModal {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

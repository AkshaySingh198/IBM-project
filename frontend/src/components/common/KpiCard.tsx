import React from 'react';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  isHero?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  isHero = false,
  icon,
  badge,
}) => {
  return (
    <div
      className="tessera-card"
      style={{
        padding: '1.25rem 1.5rem',
        backgroundColor: isHero ? 'var(--accent)' : 'var(--surface)',
        borderColor: isHero ? 'var(--accent)' : 'var(--line)',
        color: isHero ? '#FFFFFF' : 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '110px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: isHero ? 'rgba(255, 255, 255, 0.85)' : 'var(--muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </span>
        {icon && <span style={{ color: isHero ? 'rgba(255, 255, 255, 0.9)' : 'var(--muted)' }}>{icon}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span
          className="mono"
          style={{
            fontSize: '1.75rem',
            fontWeight: 600,
            lineHeight: 1.1,
            color: isHero ? '#FFFFFF' : 'var(--ink)',
          }}
        >
          {value}
        </span>
        {badge}
      </div>

      {subtext && (
        <span
          style={{
            fontSize: '0.75rem',
            color: isHero ? 'rgba(255, 255, 255, 0.75)' : 'var(--muted)',
            marginTop: '0.35rem',
          }}
        >
          {subtext}
        </span>
      )}
    </div>
  );
};

import React from 'react';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  isHero?: boolean;
  icon?: React.ReactNode;
  tone?: 'info' | 'high' | 'med' | 'primary';
  badge?: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  isHero = false,
  icon,
  tone,
  badge,
}) => {
  const getTileStyles = (): { bg: string; color: string } => {
    switch (tone) {
      case 'info':
        return { bg: 'var(--info-bg)', color: 'var(--info)' };
      case 'high':
        return { bg: 'var(--high-bg)', color: 'var(--high)' };
      case 'med':
        return { bg: 'var(--med-bg)', color: 'var(--med)' };
      case 'primary':
      default:
        return { bg: 'var(--primary-soft)', color: 'var(--primary)' };
    }
  };

  const tile = getTileStyles();

  return (
    <div
      className="tessera-card"
      style={{
        padding: '1.25rem 1.5rem',
        backgroundColor: isHero ? 'var(--primary)' : 'var(--surface)',
        borderColor: isHero ? 'var(--primary)' : 'var(--line)',
        color: isHero ? 'var(--white)' : 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '120px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: isHero ? 'var(--primary-soft)' : 'var(--muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </span>
        {icon && (
          isHero ? (
            <span style={{ color: 'var(--white)' }}>{icon}</span>
          ) : (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: tile.bg,
                color: tile.color,
              }}
            >
              {icon}
            </div>
          )
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span
          className="mono"
          style={{
            fontSize: '1.75rem',
            fontWeight: 600,
            lineHeight: 1.1,
            color: isHero ? 'var(--white)' : 'var(--ink)',
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
            color: isHero ? 'var(--primary-soft)' : 'var(--muted)',
            marginTop: '0.35rem',
          }}
        >
          {subtext}
        </span>
      )}
    </div>
  );
};

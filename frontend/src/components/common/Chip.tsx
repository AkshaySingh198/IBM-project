import React from 'react';

export type ChipVariant =
  | 'high'
  | 'medium'
  | 'low'
  | 'neutral'
  | 'accent'
  | 'amber';

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  score?: number | null;
  className?: string;
  style?: React.CSSProperties;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'neutral',
  score,
  style,
}) => {
  const getStyles = (): { bg: string; text: string; border?: string } => {
    switch (variant.toLowerCase()) {
      case 'high':
      case 'critical':
        return { bg: 'var(--risk-high-bg)', text: 'var(--risk-high-text)', border: '#F7C8C4' };
      case 'medium':
        return { bg: 'var(--risk-medium-bg)', text: 'var(--risk-medium-text)', border: '#F7D9B2' };
      case 'low':
        return { bg: 'var(--risk-low-bg)', text: 'var(--risk-low-text)', border: '#C6E7D5' };
      case 'accent':
        return { bg: 'var(--accent-soft)', text: 'var(--accent)', border: 'var(--accent)' };
      case 'amber':
        return { bg: 'var(--amber-bg)', text: 'var(--amber-text)', border: '#F9DE96' };
      case 'neutral':
      default:
        return { bg: '#ECEAE4', text: 'var(--muted)', border: 'var(--line)' };
    }
  };

  const { bg, text, border } = getStyles();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.2rem 0.55rem',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border || 'transparent'}`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {label}
      {score !== undefined && score !== null && (
        <span style={{ opacity: 0.85, fontWeight: 500 }}>({score})</span>
      )}
    </span>
  );
};

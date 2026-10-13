import React from 'react';

export type ChipVariant =
  | 'high'
  | 'critical'
  | 'medium'
  | 'med'
  | 'low'
  | 'info'
  | 'neutral'
  | 'primary'
  | 'accent'
  | 'amber'
  | 'warn';

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
  const getStyles = (): { bg: string; text: string; border: string } => {
    switch (variant.toLowerCase()) {
      case 'high':
      case 'critical':
        return {
          bg: 'var(--high-bg)',
          text: 'var(--high)',
          border: 'var(--high-border)',
        };
      case 'medium':
      case 'med':
        return {
          bg: 'var(--med-bg)',
          text: 'var(--med)',
          border: 'var(--med-border)',
        };
      case 'low':
        return {
          bg: 'var(--low-bg)',
          text: 'var(--low)',
          border: 'var(--low-border)',
        };
      case 'info':
        return {
          bg: 'var(--info-bg)',
          text: 'var(--info)',
          border: 'var(--info-border)',
        };
      case 'amber':
      case 'warn':
        return {
          bg: 'var(--warn-pill-bg)',
          text: 'var(--warn-pill)',
          border: 'var(--warn-pill-border)',
        };
      case 'primary':
      case 'accent':
        return {
          bg: 'var(--primary-soft)',
          text: 'var(--primary)',
          border: 'var(--primary)',
        };
      case 'neutral':
      default:
        return {
          bg: 'var(--neutral-bg)',
          text: 'var(--neutral-text)',
          border: 'var(--neutral-border)',
        };
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
        border: `1px solid ${border}`,
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

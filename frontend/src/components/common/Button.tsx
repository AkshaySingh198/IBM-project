import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'dark' | 'accent' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'dark',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  style,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'accent':
        return {
          backgroundColor: 'var(--accent)',
          color: '#FFFFFF',
          border: '1px solid var(--accent)',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--ink)',
          border: '1px solid var(--line)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--risk-high-bg)',
          color: 'var(--risk-high-text)',
          border: '1px solid #F7C8C4',
        };
      case 'dark':
      default:
        return {
          backgroundColor: 'var(--ink)',
          color: '#FFFFFF',
          border: '1px solid var(--ink)',
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.375rem 0.75rem',
          fontSize: '0.8125rem',
          minHeight: '36px',
        };
      case 'lg':
        return {
          padding: '0.75rem 1.5rem',
          fontSize: '0.9375rem',
          minHeight: '48px',
        };
      case 'md':
      default:
        return {
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          minHeight: '44px', // 44px min accessible touch target
        };
    }
  };

  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        borderRadius: 'var(--radius-md)',
        fontWeight: 500,
        transition: 'all 0.15s ease-in-out',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        outline: 'none',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <span
          style={{
            display: 'inline-block',
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.75s linear infinite',
          }}
        />
      ) : (
        icon
      )}
      {children}
    </button>
  );
};

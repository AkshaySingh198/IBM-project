import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface TokenChipProps {
  token: string;
  showCopy?: boolean;
  style?: React.CSSProperties;
}

export const TokenChip: React.FC<TokenChipProps> = ({
  token,
  showCopy = true,
  style,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span
      className="mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.15rem 0.45rem',
        backgroundColor: 'var(--token-bg)',
        border: '1px solid var(--token-line)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.8125rem',
        fontWeight: 500,
        color: 'var(--ink)',
        userSelect: 'all',
        ...style,
      }}
    >
      <span>{token}</span>
      {showCopy && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy token ${token}`}
          title={copied ? 'Copied!' : 'Copy token'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: copied ? 'var(--accent)' : 'var(--muted)',
            padding: '2px',
            borderRadius: '2px',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      )}
    </span>
  );
};

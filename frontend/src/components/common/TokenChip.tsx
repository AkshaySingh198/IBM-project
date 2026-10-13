import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { COPY } from '../../copy';

interface TokenChipProps {
  token: string;
  showCopy?: boolean;
  tooltip?: string;
  style?: React.CSSProperties;
}

export const TokenChip: React.FC<TokenChipProps> = ({
  token,
  showCopy = true,
  tooltip,
  style,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const tipText = tooltip || COPY.caseQueue.table.anonymousIdTooltip;

  return (
    <span
      className="mono"
      title={tipText}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.15rem 0.45rem',
        backgroundColor: 'var(--token-bg)',
        border: '1px solid var(--token-border)',
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
          aria-label={`${COPY.common.copy} ${token}`}
          title={copied ? COPY.common.copied : COPY.common.copy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: copied ? 'var(--primary)' : 'var(--muted)',
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

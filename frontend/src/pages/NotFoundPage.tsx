import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';
import { COPY } from '../copy';

export const NotFoundPage: React.FC = () => {
  useEffect(() => {
    document.title = `${COPY.brand.name} — ${COPY.common.notFoundTitle}`;
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg)',
        padding: '2rem',
      }}
    >
      <div
        className="tessera-card"
        style={{
          maxWidth: '460px',
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
            backgroundColor: 'var(--surface-2)',
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            border: '1px solid var(--line)',
          }}
        >
          <FileQuestion size={24} />
        </div>
        <h1
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--ink)',
            marginBottom: '0.5rem',
          }}
        >
          {COPY.common.notFoundTitle}
        </h1>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--muted)',
            marginBottom: '1.5rem',
            lineHeight: 1.5,
          }}
        >
          {COPY.common.notFoundText}
        </p>
        <Link to="/">
          <Button variant="primary" icon={<ArrowLeft size={16} />}>
            {COPY.common.backToCases}
          </Button>
        </Link>
      </div>
    </div>
  );
};

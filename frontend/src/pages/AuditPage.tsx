import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { AuditLogDTO, HashVerificationResponse } from '../api/types';
import { AppShell } from '../components/layout/AppShell';
import { DataTable } from '../components/common/DataTable';
import type { Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { ErrorBanner } from '../components/common/ErrorBanner';

export const AuditPage: React.FC = () => {
  const { hasPermission } = useAuth();

  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('ALL');
  const [actorFilter, setActorFilter] = useState('ALL');

  // Manual-only Verification State (NEVER automatic)
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<HashVerificationResponse | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Export State
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'csv' | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listAudit();
      setLogs(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Plain language translation of action types
  const formatActionName = (actionType: string): string => {
    switch (actionType.toUpperCase()) {
      case 'SYSTEM_INIT':
        return 'System Initialized (Genesis)';
      case 'USER_REGISTER':
        return 'User Registered';
      case 'LOGIN':
        return 'User Authentication';
      case 'REVEAL_REQUEST_SUBMITTED':
        return 'Identity Reveal Requested';
      case 'REVEAL_APPROVED':
        return 'Identity Reveal Approved';
      case 'REVEAL_DENIED':
        return 'Identity Reveal Denied';
      case 'VERDICT_OVERRIDE':
        return 'Verdict Risk Overridden';
      default:
        return actionType.replace(/_/g, ' ');
    }
  };

  // Manual verification handler
  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await api.verifyAudit();
      setVerificationResult(res);
    } catch (err: unknown) {
      setVerifyError((err as Error).message || 'Failed to verify audit hash chain');
    } finally {
      setVerifying(false);
    }
  };

  // Download Compliance Report (PDF / CSV)
  const handleExport = async (format: 'pdf' | 'csv') => {
    setExportingFormat(format);
    try {
      const blob = await api.downloadReport(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance_audit_report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      setError((err as Error).message || `Failed to export ${format.toUpperCase()} report`);
    } finally {
      setExportingFormat(null);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  // Unique actions and actors for dropdown filters
  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.action_type)));
  }, [logs]);

  const uniqueActors = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.actor_id)));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (actionFilter !== 'ALL' && l.action_type !== actionFilter) return false;
      if (actorFilter !== 'ALL' && l.actor_id !== actorFilter) return false;
      return true;
    });
  }, [logs, actionFilter, actorFilter]);

  const columns: Column<AuditLogDTO>[] = [
    {
      key: 'created_at',
      header: 'Timestamp (UTC)',
      width: '180px',
      render: (l) => (
        <span className="mono" style={{ fontSize: '0.8125rem', color: 'var(--ink)' }}>
          {new Date(l.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actor_id',
      header: 'Actor',
      width: '150px',
      render: (l) => (
        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--ink)' }}>
          {l.actor_id}
        </span>
      ),
    },
    {
      key: 'action_type',
      header: 'Event Action',
      width: '210px',
      render: (l) => (
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent)' }}>
          {formatActionName(l.action_type)}
        </span>
      ),
    },
    {
      key: 'target_id',
      header: 'Target Resource',
      width: '160px',
      render: (l) => (
        <span className="mono" style={{ fontSize: '0.8125rem', color: l.target_id ? 'var(--ink)' : 'var(--muted)' }}>
          {l.target_id || '—'}
        </span>
      ),
    },
    {
      key: 'hash',
      header: 'SHA-256 Block Hash',
      width: '170px',
      render: (l) => {
        const isCopied = copiedHash === l.hash;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} title={`Full Block Hash: ${l.hash}`}>
            <span className="mono" style={{ fontSize: '0.8125rem', color: 'var(--ink)' }}>
              {l.hash.substring(0, 10)}...
            </span>
            <button
              type="button"
              onClick={() => handleCopyHash(l.hash)}
              aria-label={`Copy hash ${l.hash}`}
              title={isCopied ? 'Copied' : 'Copy full hash'}
              style={{
                padding: '2px',
                color: isCopied ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              {isCopied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        );
      },
    },
    {
      key: 'prev_hash',
      header: 'Previous Hash',
      width: '140px',
      render: (l) => {
        const isGenesis = l.prev_hash === '0000000000000000000000000000000000000000000000000000000000000000';
        return (
          <span
            className="mono"
            style={{ fontSize: '0.75rem', color: isGenesis ? 'var(--accent)' : 'var(--muted)' }}
            title={`Previous Hash: ${l.prev_hash}`}
          >
            {isGenesis ? '000000... (Gen)' : `${l.prev_hash.substring(0, 10)}...`}
          </span>
        );
      },
    },
  ];

  return (
    <AppShell searchPlaceholder="Filter audit records...">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1160px', margin: '0 auto' }}>
        {/* Top Header & Export Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              Compliance & audit trail
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
              Cryptographically chained SHA-256 ledger recording identity unmasks, logins, and overrides.
            </p>
          </div>

          {/* Action Header Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Manual Verify Button (NEVER runs automatically) */}
            <Button
              variant="outline"
              size="md"
              onClick={handleVerifyIntegrity}
              loading={verifying}
              icon={<ShieldCheck size={16} />}
            >
              Verify integrity
            </Button>

            {/* Export Buttons */}
            {hasPermission('audit:export') && (
              <>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => handleExport('csv')}
                  loading={exportingFormat === 'csv'}
                  icon={<FileSpreadsheet size={16} />}
                >
                  Export CSV
                </Button>

                <Button
                  variant="dark"
                  size="md"
                  onClick={() => handleExport('pdf')}
                  loading={exportingFormat === 'pdf'}
                  icon={<FileText size={16} />}
                >
                  Export PDF
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Global Errors */}
        {error && <ErrorBanner message={error} onRetry={fetchAuditLogs} />}
        {verifyError && <ErrorBanner message={verifyError} title="Verification error" />}

        {/* Verification Result Banner (honest output) */}
        {verificationResult && (
          <div
            className="tessera-card"
            style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: verificationResult.is_valid ? 'var(--risk-low-bg)' : 'var(--risk-high-bg)',
              borderColor: verificationResult.is_valid ? '#C6E7D5' : '#F7C8C4',
              color: verificationResult.is_valid ? 'var(--risk-low-text)' : 'var(--risk-high-text)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9375rem' }}>
              {verificationResult.is_valid ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
              <span>
                {verificationResult.is_valid
                  ? 'Audit Ledger Integrity Verified'
                  : 'Ledger Verification Warning (Tampering or Hash Inconsistency Detected)'}
              </span>
            </div>

            <div style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
              {verificationResult.message}
            </div>

            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.85 }}>
              Total audited blocks evaluated: <strong>{verificationResult.total_logs}</strong>
              {verificationResult.tampered_log_id && (
                <span>
                  {' '}
                  | Inconsistency flagged at record ID: <code className="mono">{verificationResult.tampered_log_id}</code>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div
          className="tessera-card"
          style={{
            padding: '0.875rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--muted)', fontSize: '0.8125rem' }}>
              <Filter size={15} />
              <span>Filters:</span>
            </div>

            {/* Action Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label htmlFor="action-filter" style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                Action
              </label>
              <select
                id="action-filter"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                style={{
                  padding: '0.35rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--surface)',
                }}
              >
                <option value="ALL">All actions</option>
                {uniqueActions.map((act) => (
                  <option key={act} value={act}>
                    {formatActionName(act)}
                  </option>
                ))}
              </select>
            </div>

            {/* Actor Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label htmlFor="actor-filter" style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                Actor
              </label>
              <select
                id="actor-filter"
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
                style={{
                  padding: '0.35rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--surface)',
                }}
              >
                <option value="ALL">All actors</option>
                {uniqueActors.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
            Showing <strong>{filteredLogs.length}</strong> of {logs.length} audit entries
          </div>
        </div>

        {/* Audit Log Table */}
        <DataTable
          columns={columns}
          data={filteredLogs}
          keyExtractor={(l) => l.id}
          loading={loading}
          emptyTitle="No audit log entries found"
          emptyDescription="Audit records will automatically be appended as actions are performed."
        />
      </div>
    </AppShell>
  );
};

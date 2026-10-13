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
import { COPY } from '../copy';

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
      const errorMsg = (err as Error).message || COPY.auth.networkError;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = `${COPY.brand.name} — ${COPY.activityLog.title}`;
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Plain language translation of action types
  const formatActionName = (actionType: string): string => {
    return COPY.actionLabels[actionType.toUpperCase()] || actionType.replace(/_/g, ' ');
  };

  // Manual verification handler
  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await api.verifyAudit();
      setVerificationResult(res);
    } catch (err: unknown) {
      setVerifyError((err as Error).message || COPY.auth.networkError);
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
      setError((err as Error).message || COPY.auth.networkError);
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
      header: COPY.activityLog.table.time,
      width: '180px',
      render: (l) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--ink)' }}>
          {new Date(l.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actor_id',
      header: COPY.activityLog.table.actor,
      width: '150px',
      render: (l) => (
        <span style={{ fontWeight: 500, fontSize: '0.8125rem', color: 'var(--ink)' }}>
          {l.actor_id}
        </span>
      ),
    },
    {
      key: 'action_type',
      header: COPY.activityLog.table.action,
      width: '210px',
      render: (l) => (
        <span
          style={{
            fontSize: '0.8125rem',
            color: 'var(--ink)',
            fontWeight: 500,
          }}
        >
          {formatActionName(l.action_type)}
        </span>
      ),
    },
    {
      key: 'target_id',
      header: COPY.activityLog.table.target,
      width: '130px',
      render: (l) => (
        <span className="mono" style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
          {l.target_id || '—'}
        </span>
      ),
    },
    {
      key: 'hash',
      header: COPY.activityLog.table.fingerprint,
      render: (l) => {
        const isCopied = copiedHash === l.hash;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              className="mono"
              style={{
                fontSize: '0.8125rem',
                color: 'var(--ink)',
              }}
              title={l.hash}
            >
              {l.hash.substring(0, 10)}...
            </span>
            <button
              type="button"
              onClick={() => handleCopyHash(l.hash)}
              aria-label={`${COPY.common.copy} ${COPY.activityLog.table.fingerprint}`}
              title={isCopied ? COPY.common.copied : COPY.common.copy}
              style={{
                padding: '2px',
                color: isCopied ? 'var(--primary)' : 'var(--muted)',
              }}
            >
              {isCopied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        );
      },
    },
    {
      key: 'prev_hash',
      header: COPY.activityLog.table.previousFingerprint,
      width: '150px',
      render: (l) => {
        const isGenesis =
          l.prev_hash === '0000000000000000000000000000000000000000000000000000000000000000';
        return (
          <span
            className="mono"
            style={{ fontSize: '0.75rem', color: isGenesis ? 'var(--primary)' : 'var(--muted)' }}
            title={l.prev_hash}
          >
            {isGenesis ? '000000... (Start)' : `${l.prev_hash.substring(0, 10)}...`}
          </span>
        );
      },
    },
  ];

  return (
    <AppShell searchPlaceholder="Filter activity entries...">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          maxWidth: '1160px',
          margin: '0 auto',
        }}
      >
        {/* Top Header & Export Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--ink)',
                letterSpacing: '-0.02em',
              }}
            >
              {COPY.activityLog.title}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
              {COPY.activityLog.intro}
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
              {verifying ? COPY.activityLog.checkingLog : COPY.activityLog.checkLogButton}
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
                  {COPY.activityLog.downloadCsv}
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleExport('pdf')}
                  loading={exportingFormat === 'pdf'}
                  icon={<FileText size={16} />}
                >
                  {COPY.activityLog.downloadPdf}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Global Errors */}
        {error && <ErrorBanner message={error} onRetry={fetchAuditLogs} />}
        {verifyError && <ErrorBanner message={verifyError} />}

        {/* Verification Result Banner (honest output) */}
        {verificationResult && (
          <div
            className="tessera-card"
            style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: verificationResult.is_valid
                ? 'var(--low-bg)'
                : 'var(--high-bg)',
              borderColor: verificationResult.is_valid
                ? 'var(--low-border)'
                : 'var(--high-border)',
              color: verificationResult.is_valid ? 'var(--low)' : 'var(--high)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600,
                fontSize: '0.9375rem',
              }}
            >
              {verificationResult.is_valid ? (
                <ShieldCheck size={18} />
              ) : (
                <ShieldAlert size={18} />
              )}
              <span>
                {verificationResult.is_valid
                  ? COPY.activityLog.checkSuccess
                  : COPY.activityLog.checkFailure(
                      verificationResult.tampered_log_id
                        ? String(verificationResult.tampered_log_id)
                        : null
                    )}
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.85 }}>
              {COPY.activityLog.checkTotalLogs(verificationResult.total_logs)}
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--muted)',
                fontSize: '0.8125rem',
              }}
            >
              <Filter size={15} />
              <span>Filters:</span>
            </div>

            {/* Action Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label
                htmlFor="action-filter"
                style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}
              >
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
                  color: 'var(--ink)',
                }}
              >
                <option value="ALL">{COPY.activityLog.filters.allActions}</option>
                {uniqueActions.map((act) => (
                  <option key={act} value={act}>
                    {formatActionName(act)}
                  </option>
                ))}
              </select>
            </div>

            {/* Actor Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label
                htmlFor="actor-filter"
                style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}
              >
                Team member
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
                  color: 'var(--ink)',
                }}
              >
                <option value="ALL">{COPY.activityLog.filters.allActors}</option>
                {uniqueActors.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
            Showing <strong>{filteredLogs.length}</strong> of {logs.length} entries
          </div>
        </div>

        {/* Activity Log Table */}
        <DataTable
          columns={columns}
          data={filteredLogs}
          keyExtractor={(l) => l.id}
          loading={loading}
          emptyTitle={COPY.activityLog.emptyState}
        />
      </div>
    </AppShell>
  );
};

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  KeyRound,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { RevealRequestDTO, RevealApprovalResponse } from '../api/types';
import { AppShell } from '../components/layout/AppShell';
import { DataTable } from '../components/common/DataTable';
import type { Column } from '../components/common/DataTable';
import { Chip } from '../components/common/Chip';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ErrorBanner } from '../components/common/ErrorBanner';

export const RevealRequestsPage: React.FC = () => {
  const { user, hasPermission, recordRevealedIdentity } = useAuth();

  const [reveals, setReveals] = useState<RevealRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Tab filter: ALL, PENDING, APPROVED, DENIED
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'DENIED' | 'ALL'>('PENDING');

  // Approve Confirm Modal
  const [requestToApprove, setRequestToApprove] = useState<RevealRequestDTO | null>(null);
  const [approving, setApproving] = useState(false);

  // Deny Confirm Modal
  const [requestToDeny, setRequestToDeny] = useState<RevealRequestDTO | null>(null);
  const [denying, setDenying] = useState(false);

  // Success One-Time Reveal Modal
  const [approvalResult, setApprovalResult] = useState<RevealApprovalResponse | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const fetchReveals = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      const data = await api.listReveals();
      setReveals(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load reveal requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    fetchReveals();
  }, [fetchReveals]);

  const canApprove = useMemo(() => {
    // SeniorInvestigator can approve; Admin is explicitly blocked by separation of duties
    return hasPermission('reveal:approve') && user?.role_name !== 'Admin';
  }, [hasPermission, user]);

  const filteredReveals = useMemo(() => {
    if (activeTab === 'ALL') return reveals;
    return reveals.filter((r) => r.status.toUpperCase() === activeTab);
  }, [reveals, activeTab]);

  // Execute approval
  const handleConfirmApprove = async () => {
    if (!requestToApprove) return;
    setApproving(true);
    setActionError(null);
    try {
      const res = await api.approveReveal(requestToApprove.id);
      // Store real unmasked identity into React in-memory context
      recordRevealedIdentity({
        caseId: res.case_id,
        senderRealValue: res.sender_real_value,
        receiverRealValue: res.receiver_real_value,
        approvedBy: res.approved_by,
        auditLogId: res.audit_log_id,
        hash: res.hash,
        revealedAt: new Date().toISOString(),
      });
      setRequestToApprove(null);
      setApprovalResult(res);
      await fetchReveals();
    } catch (err: unknown) {
      setActionError((err as Error).message || 'Failed to approve reveal request');
      setRequestToApprove(null);
    } finally {
      setApproving(false);
    }
  };

  // Execute denial
  const handleConfirmDeny = async () => {
    if (!requestToDeny) return;
    setDenying(true);
    setActionError(null);
    try {
      await api.denyReveal(requestToDeny.id);
      setRequestToDeny(null);
      await fetchReveals();
    } catch (err: unknown) {
      setActionError((err as Error).message || 'Failed to deny reveal request');
      setRequestToDeny(null);
    } finally {
      setDenying(false);
    }
  };

  const copyHash = (hashStr: string) => {
    navigator.clipboard.writeText(hashStr);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 1500);
  };

  const columns: Column<RevealRequestDTO>[] = [
    {
      key: 'id',
      header: 'Request ID',
      width: '130px',
      render: (r) => (
        <span className="mono" style={{ fontWeight: 500, fontSize: '0.8125rem' }}>
          {r.id}
        </span>
      ),
    },
    {
      key: 'case_id',
      header: 'Case ID',
      width: '120px',
      render: (r) => (
        <Link
          to={`/cases/${r.case_id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            color: 'var(--accent)',
            fontWeight: 600,
          }}
        >
          <span className="mono">{r.case_id}</span>
          <ExternalLink size={12} />
        </Link>
      ),
    },
    {
      key: 'requested_by',
      header: 'Requested By',
      width: '150px',
      render: (r) => {
        const isSelf = r.requested_by === user?.id;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8125rem' }}>{r.requested_by}</span>
            {isSelf && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '3px',
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  fontWeight: 600,
                }}
              >
                You
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'reason',
      header: 'Justification Reason',
      render: (r) => (
        <div
          style={{
            maxWidth: '320px',
            fontSize: '0.8125rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={r.reason}
        >
          {r.reason}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (r) => (
        <Chip
          label={r.status}
          variant={
            r.status === 'APPROVED' ? 'low' : r.status === 'DENIED' ? 'high' : 'amber'
          }
        />
      ),
    },
    {
      key: 'approved_by',
      header: 'Decided By',
      width: '130px',
      render: (r) => (
        <span style={{ fontSize: '0.8125rem', color: r.approved_by ? 'var(--ink)' : 'var(--muted)' }}>
          {r.approved_by || '—'}
        </span>
      ),
    },
    {
      key: 'revealed_at',
      header: 'Decision Time',
      width: '120px',
      render: (r) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
          {r.revealed_at ? new Date(r.revealed_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '180px',
      align: 'right',
      render: (r) => {
        if (r.status !== 'PENDING') {
          return <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Completed</span>;
        }

        if (!canApprove) {
          return (
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }} title="Requires SeniorInvestigator permission">
              Review only
            </span>
          );
        }

        const isOwnRequest = r.requested_by === user?.id;

        return (
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button
              variant="accent"
              size="sm"
              disabled={isOwnRequest}
              title={isOwnRequest ? 'You cannot approve your own request' : 'Approve and unmask PII'}
              onClick={(e) => {
                e.stopPropagation();
                setRequestToApprove(r);
              }}
              icon={<CheckCircle size={14} />}
            >
              Approve
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setRequestToDeny(r);
              }}
              icon={<XCircle size={14} />}
              style={{ color: 'var(--risk-high-text)' }}
            >
              Deny
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <AppShell searchPlaceholder="Filter reveal requests...">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            Gated identity reveal requests
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
            Regulatory dual-control workflow for unmasking PII from the encrypted Tokenization Vault.
          </p>
        </div>

        {/* Global Error Alerts */}
        {error && <ErrorBanner message={error} onRetry={fetchReveals} />}
        {actionError && <ErrorBanner message={actionError} title="Action could not be completed" />}

        {/* Dual Control Governance Notice */}
        <div
          className="tessera-card"
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#FAF9F5',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.8125rem',
            color: 'var(--muted)',
          }}
        >
          <KeyRound size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
          <div>
            <strong>Dual-Control Security Rule:</strong> Analysts may request an identity unmask. Only an independent Senior Investigator who did not create the request may grant access. System Administrators are prohibited from approving requests.
          </div>
        </div>

        {/* Tabs Bar */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--line)',
            gap: '0.5rem',
          }}
        >
          {(['PENDING', 'APPROVED', 'DENIED', 'ALL'] as const).map((tab) => {
            const count =
              tab === 'ALL'
                ? reveals.length
                : reveals.filter((r) => r.status.toUpperCase() === tab).length;
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: isActive ? 'var(--accent)' : 'var(--muted)',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: '-1px',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>{tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '100px',
                    backgroundColor: isActive ? 'var(--accent-soft)' : '#EBE8DE',
                    fontWeight: 600,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Requests Table */}
        <DataTable
          columns={columns}
          data={filteredReveals}
          keyExtractor={(r) => r.id}
          loading={loading}
          emptyTitle={`No ${activeTab.toLowerCase()} reveal requests`}
          emptyDescription="Requests submitted by analysts for PII unmasking will appear here for compliance review."
        />
      </div>

      {/* Approve Confirm Modal */}
      <Modal
        isOpen={!!requestToApprove}
        onClose={() => setRequestToApprove(null)}
        title="Approve Customer Identity Reveal"
        maxWidth="500px"
        footer={
          <>
            <Button variant="outline" onClick={() => setRequestToApprove(null)} disabled={approving}>
              Cancel
            </Button>
            <Button variant="accent" onClick={handleConfirmApprove} loading={approving} icon={<CheckCircle size={16} />}>
              Confirm approval & unmask
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--amber-bg)',
              color: 'var(--amber-text)',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>This approval releases encrypted customer PII and writes a permanent entry to the compliance audit log.</span>
          </div>

          <div style={{ fontSize: '0.875rem', color: 'var(--ink)' }}>
            Are you sure you want to approve reveal request <strong className="mono">{requestToApprove?.id}</strong> for Case{' '}
            <strong className="mono">{requestToApprove?.case_id}</strong>?
          </div>

          <div style={{ backgroundColor: '#FAF9F5', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              Requester Justification
            </div>
            <div>{requestToApprove?.reason}</div>
          </div>
        </div>
      </Modal>

      {/* Deny Confirm Modal */}
      <Modal
        isOpen={!!requestToDeny}
        onClose={() => setRequestToDeny(null)}
        title="Deny Customer Identity Reveal"
        maxWidth="460px"
        footer={
          <>
            <Button variant="outline" onClick={() => setRequestToDeny(null)} disabled={denying}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDeny} loading={denying} icon={<XCircle size={16} />}>
              Confirm denial
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem', color: 'var(--ink)' }}>
          <p>
            Are you sure you want to deny reveal request <strong className="mono">{requestToDeny?.id}</strong> for Case{' '}
            <strong className="mono">{requestToDeny?.case_id}</strong>?
          </p>
          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
            The assigned analyst will be notified that this request was rejected under dual-control guidelines.
          </div>
        </div>
      </Modal>

      {/* Success One-Time Reveal Modal */}
      <Modal
        isOpen={!!approvalResult}
        onClose={() => setApprovalResult(null)}
        title="Identity Decrypted Successfully"
        maxWidth="540px"
        footer={
          <Button variant="dark" onClick={() => setApprovalResult(null)}>
            Acknowledge & close
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--risk-low-bg)',
              color: 'var(--risk-low-text)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>Dual-control approval recorded. Decrypted values are held strictly in memory for this session.</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              backgroundColor: '#FAF9F5',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Real Sender Identity
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--ink)' }}>
                {approvalResult?.sender_real_value}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Real Beneficiary Account
              </div>
              <div className="mono" style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--ink)' }}>
                {approvalResult?.receiver_real_value}
              </div>
            </div>
          </div>

          {/* Audit Verification Block */}
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              fontSize: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
              <span>Audit Log Record:</span>
              <span className="mono">{approvalResult?.audit_log_id}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>SHA-256 Block Hash:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="mono" style={{ color: 'var(--ink)' }}>
                  {approvalResult?.hash.substring(0, 16)}...
                </span>
                <button
                  type="button"
                  onClick={() => approvalResult && copyHash(approvalResult.hash)}
                  aria-label="Copy full block hash"
                  title={copiedHash ? 'Copied full hash' : 'Copy full hash'}
                  style={{
                    padding: '2px',
                    color: copiedHash ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {copiedHash ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
};

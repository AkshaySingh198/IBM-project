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
import { COPY } from '../copy';

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
      const errorMsg = (err as Error).message || COPY.auth.networkError;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = `${COPY.brand.name} — ${COPY.nameRequests.title}`;
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
      setActionError((err as Error).message || COPY.auth.networkError);
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
      setActionError((err as Error).message || COPY.auth.networkError);
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
      header: COPY.nameRequests.table.id,
      width: '130px',
      render: (r) => (
        <span className="mono" style={{ fontWeight: 500, fontSize: '0.8125rem' }}>
          {r.id}
        </span>
      ),
    },
    {
      key: 'case_id',
      header: COPY.nameRequests.table.caseId,
      width: '120px',
      render: (r) => (
        <Link
          to={`/cases/${r.case_id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            color: 'var(--primary)',
            fontWeight: 500,
          }}
        >
          <span className="mono">{r.case_id}</span>
          <ExternalLink size={12} />
        </Link>
      ),
    },
    {
      key: 'requested_by',
      header: COPY.nameRequests.table.requestedBy,
      width: '140px',
      render: (r) => {
        const isOwn = r.requested_by === user?.username || r.requested_by === user?.id;
        return (
          <span style={{ fontWeight: isOwn ? 600 : 400, color: 'var(--ink)' }}>
            {r.requested_by} {isOwn && <span style={{ color: 'var(--primary)' }}>(you)</span>}
          </span>
        );
      },
    },
    {
      key: 'reason',
      header: COPY.nameRequests.table.reason,
      render: (r) => (
        <div
          style={{
            maxWidth: '320px',
            fontSize: '0.8125rem',
            color: 'var(--ink)',
            lineHeight: 1.4,
          }}
          title={r.reason}
        >
          {r.reason}
        </div>
      ),
    },
    {
      key: 'status',
      header: COPY.nameRequests.table.status,
      width: '120px',
      render: (r) => {
        const status = r.status.toUpperCase();
        const variant =
          status === 'APPROVED' ? 'low' : status === 'DENIED' ? 'high' : 'amber';
        return (
          <Chip
            label={COPY.statusLabels[status] || status}
            variant={variant}
          />
        );
      },
    },
    {
      key: 'approved_by',
      header: COPY.nameRequests.table.handledBy,
      width: '130px',
      render: (r) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
          {r.approved_by || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: COPY.nameRequests.table.actions,
      width: '170px',
      align: 'right',
      render: (r) => {
        if (r.status.toUpperCase() !== 'PENDING') {
          return (
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              Completed
            </span>
          );
        }

        const isOwn = r.requested_by === user?.username || r.requested_by === user?.id;

        if (!canApprove) {
          return (
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              Awaiting review
            </span>
          );
        }

        return (
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <span title={isOwn ? COPY.nameRequests.actions.ownRequestTooltip : undefined}>
              <Button
                variant="primary"
                size="sm"
                disabled={isOwn}
                onClick={() => setRequestToApprove(r)}
                icon={<CheckCircle size={14} />}
              >
                {COPY.nameRequests.actions.approve}
              </Button>
            </span>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setRequestToDeny(r)}
              icon={<XCircle size={14} />}
            >
              {COPY.nameRequests.actions.decline}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Page Title & Context */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
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
              {COPY.nameRequests.title}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
              {COPY.nameRequests.subLine}
            </p>
          </div>
        </div>

        {/* Action Error / Server Rejections */}
        {actionError && <ErrorBanner message={actionError} onRetry={fetchReveals} />}
        {error && <ErrorBanner message={error} onRetry={fetchReveals} />}

        {/* Tab Filters */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '1px solid var(--line)',
            paddingBottom: '0.25rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: activeTab === 'PENDING' ? 'var(--primary)' : 'var(--muted)',
              borderBottom: activeTab === 'PENDING' ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            {COPY.nameRequests.tabs.pending} (
            {reveals.filter((r) => r.status.toUpperCase() === 'PENDING').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('APPROVED')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: activeTab === 'APPROVED' ? 'var(--primary)' : 'var(--muted)',
              borderBottom: activeTab === 'APPROVED' ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            {COPY.nameRequests.tabs.approved} (
            {reveals.filter((r) => r.status.toUpperCase() === 'APPROVED').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DENIED')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: activeTab === 'DENIED' ? 'var(--primary)' : 'var(--muted)',
              borderBottom: activeTab === 'DENIED' ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            {COPY.nameRequests.tabs.denied} (
            {reveals.filter((r) => r.status.toUpperCase() === 'DENIED').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: activeTab === 'ALL' ? 'var(--primary)' : 'var(--muted)',
              borderBottom: activeTab === 'ALL' ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            {COPY.nameRequests.tabs.all} ({reveals.length})
          </button>
        </div>

        {/* Table of Reveal Requests */}
        <DataTable
          columns={columns}
          data={filteredReveals}
          keyExtractor={(r) => r.id}
          loading={loading}
          emptyTitle={COPY.nameRequests.emptyState}
        />
      </div>

      {/* Approve Confirm Modal */}
      <Modal
        isOpen={!!requestToApprove}
        onClose={() => setRequestToApprove(null)}
        title={COPY.nameRequests.approveModal.title}
        maxWidth="500px"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setRequestToApprove(null)}
              disabled={approving}
            >
              {COPY.nameRequests.approveModal.cancel}
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmApprove}
              loading={approving}
              icon={<CheckCircle size={16} />}
            >
              {COPY.nameRequests.approveModal.confirm}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--line)',
              color: 'var(--muted)',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{COPY.nameRequests.approveModal.help}</span>
          </div>

          <div style={{ fontSize: '0.875rem', color: 'var(--ink)' }}>
            {COPY.nameRequests.approveModal.casePrompt(requestToApprove?.case_id || '')}
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface-2)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line)',
              fontSize: '0.8125rem',
            }}
          >
            <div
              style={{
                color: 'var(--muted)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                marginBottom: '0.2rem',
              }}
            >
              {COPY.nameRequests.table.reason}
            </div>
            <div>{requestToApprove?.reason}</div>
          </div>
        </div>
      </Modal>

      {/* Decline Confirm Modal */}
      <Modal
        isOpen={!!requestToDeny}
        onClose={() => setRequestToDeny(null)}
        title={COPY.nameRequests.declineModal.title}
        maxWidth="460px"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setRequestToDeny(null)}
              disabled={denying}
            >
              {COPY.nameRequests.declineModal.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDeny}
              loading={denying}
              icon={<XCircle size={16} />}
            >
              {COPY.nameRequests.declineModal.confirm}
            </Button>
          </>
        }
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            fontSize: '0.875rem',
            color: 'var(--ink)',
          }}
        >
          <p>{COPY.nameRequests.declineModal.casePrompt(requestToDeny?.case_id || '')}</p>
          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
            {COPY.nameRequests.declineModal.help}
          </div>
        </div>
      </Modal>

      {/* Success One-Time Reveal Modal */}
      <Modal
        isOpen={!!approvalResult}
        onClose={() => setApprovalResult(null)}
        title={COPY.nameRequests.successModal.title}
        maxWidth="540px"
        footer={
          <Button variant="dark" onClick={() => setApprovalResult(null)}>
            {COPY.nameRequests.successModal.close}
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--warn-pill-bg)',
              color: 'var(--warn-pill)',
              border: '1px solid var(--warn-pill-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <KeyRound size={18} style={{ flexShrink: 0 }} />
            <span>{COPY.nameRequests.successModal.notice}</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              backgroundColor: 'var(--surface-2)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.2rem',
                }}
              >
                {COPY.nameRequests.successModal.customerName}
              </div>
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: 'var(--ink)',
                }}
              >
                {approvalResult?.sender_real_value}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.2rem',
                }}
              >
                {COPY.nameRequests.successModal.recipientName}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: 'var(--ink)',
                }}
              >
                {approvalResult?.receiver_real_value}
              </div>
            </div>
          </div>

          {/* Audit Verification Block */}
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              fontSize: '0.75rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: 'var(--muted)',
              }}
            >
              <span>{COPY.nameRequests.successModal.logId}:</span>
              <span className="mono">{approvalResult?.audit_log_id}</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ color: 'var(--muted)' }}>
                {COPY.nameRequests.successModal.fingerprint}:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="mono" style={{ color: 'var(--ink)' }}>
                  {approvalResult?.hash.substring(0, 16)}...
                </span>
                <button
                  type="button"
                  onClick={() => approvalResult && copyHash(approvalResult.hash)}
                  aria-label={`${COPY.common.copy} ${COPY.nameRequests.successModal.fingerprint}`}
                  title={copiedHash ? COPY.common.copied : COPY.common.copy}
                  style={{
                    padding: '2px',
                    color: copiedHash ? 'var(--primary)' : 'var(--muted)',
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

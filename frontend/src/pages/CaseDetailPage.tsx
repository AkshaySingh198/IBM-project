import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  Unlock,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { FraudCaseDTO, RevealRequestDTO } from '../api/types';
import { parseScore, tokenLabels, contributions } from '../api/derive';
import { AppShell } from '../components/layout/AppShell';
import { Chip } from '../components/common/Chip';
import { TokenChip } from '../components/common/TokenChip';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { Skeleton } from '../components/common/Skeleton';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasPermission, getRevealedIdentity } = useAuth();

  const [caseData, setCaseData] = useState<FraudCaseDTO | null>(null);
  const [caseReveals, setCaseReveals] = useState<RevealRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reveal Modal State
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [revealCategory, setRevealCategory] = useState('Regulatory or FIU escalation');
  const [revealDetail, setRevealDetail] = useState('');
  const [revealSubmitting, setRevealSubmitting] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);

  // Override Modal State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideLevel, setOverrideLevel] = useState('LOW');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const fetchCaseDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [fetchedCase, allReveals] = await Promise.all([
        api.getCase(id),
        api.listReveals().catch(() => [] as RevealRequestDTO[]),
      ]);
      setCaseData(fetchedCase);
      // Filter reveals specifically for this case
      setCaseReveals(allReveals.filter((r) => r.case_id === id));
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load case details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    document.title = caseData ? `Tessera — Case #${caseData.id}` : 'Tessera — Case Details';
  }, [caseData]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    fetchCaseDetail();
  }, [fetchCaseDetail]);

  // Format currency
  const formatINR = (amtStr?: string | null): string => {
    if (!amtStr) return '₹0.00';
    const num = parseFloat(amtStr);
    if (isNaN(num)) return `₹${amtStr}`;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(num);
  };

  const friendlyAgentLabel = (agentType: string): string => {
    switch (agentType.toUpperCase()) {
      case 'KYC_AGENT':
      case 'KYC':
        return 'KYC & Sanctions Screening';
      case 'GRAPH_AGENT':
      case 'GRAPH':
        return 'Network Cluster & Graph Analysis';
      case 'PATTERN_AGENT':
      case 'PATTERN':
        return 'Historical Fraud Pattern Matching (RAG)';
      case 'BEHAVIORAL_AGENT':
      case 'BEHAVIORAL':
        return 'Behavioral Anomaly Model';
      default:
        return agentType;
    }
  };

  const formatConfidence = (confStr?: string): string => {
    if (!confStr) return '—';
    const num = parseFloat(confStr);
    if (isNaN(num)) return confStr;
    const pct = num <= 1.0 ? Math.round(num * 100) : Math.round(num);
    return `${pct}% confidence`;
  };

  // Latest reveal request for this case
  const latestReveal = useMemo(() => {
    if (caseReveals.length === 0) return null;
    return caseReveals[caseReveals.length - 1];
  }, [caseReveals]);

  // Revealed identity from current session memory
  const memoryIdentity = useMemo(() => {
    if (!id) return null;
    return getRevealedIdentity(id);
  }, [id, getRevealedIdentity]);

  // Submit Reveal Request handler
  const handleRevealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!revealDetail.trim()) {
      setRevealError('Please provide specific details explaining this request.');
      return;
    }

    setRevealSubmitting(true);
    setRevealError(null);

    const fullReason = `${revealCategory}: ${revealDetail.trim()}`;
    try {
      await api.submitReveal(id, fullReason);
      setIsRevealModalOpen(false);
      setRevealDetail('');
      await fetchCaseDetail();
    } catch (err: unknown) {
      setRevealError((err as Error).message || 'Failed to submit reveal request');
    } finally {
      setRevealSubmitting(false);
    }
  };

  // Submit AI Override handler
  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!overrideReason.trim()) {
      setOverrideError('Please provide a justification for overriding the AI assessment.');
      return;
    }

    setOverrideSubmitting(true);
    setOverrideError(null);

    try {
      await api.overrideCase(id, overrideLevel, overrideReason.trim());
      setIsOverrideModalOpen(false);
      setOverrideReason('');
      await fetchCaseDetail();
    } catch (err: unknown) {
      setOverrideError((err as Error).message || 'Failed to override case verdict');
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const isOverridden = caseData?.verdict?.summary?.startsWith('[ANALYST OVERRIDE');
  const signalContribs = useMemo(() => contributions(caseData), [caseData]);

  if (loading) {
    return (
      <AppShell>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
          <Skeleton height="2.5rem" width="300px" />
          <Skeleton height="8rem" />
          <Skeleton height="14rem" />
        </div>
      </AppShell>
    );
  }

  if (error || !caseData) {
    return (
      <AppShell>
        <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
          <ErrorBanner message={error || 'Case not found'} onRetry={fetchCaseDetail} />
          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/">
              <Button variant="outline" icon={<ArrowLeft size={16} />}>
                Back to Case Queue
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1040px', margin: '0 auto' }}>
        {/* Back navigation */}
        <div>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8125rem',
              color: 'var(--muted)',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Case Queue</span>
          </Link>
        </div>

        {/* Case Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 className="mono" style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--ink)' }}>
              {caseData.id}
            </h1>
            <Chip
              label={caseData.status}
              variant={caseData.status === 'OVERRIDDEN' ? 'amber' : 'neutral'}
            />
            <Chip
              label={caseData.verdict?.risk_level || 'LOW'}
              variant={caseData.verdict?.risk_level.toLowerCase() as any}
              score={parseScore(caseData.verdict?.summary)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {hasPermission('cases:override') ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOverrideModalOpen(true)}
                icon={<AlertTriangle size={15} />}
              >
                Override AI verdict
              </Button>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', alignSelf: 'center' }}>
                Your role cannot override AI verdicts.
              </span>
            )}
          </div>
        </div>

        {/* Transaction Summary Card */}
        <div
          className="tessera-card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Transaction Amount
            </div>
            <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)' }}>
              {formatINR(caseData.transaction?.amount)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              Transaction ID: <span className="mono">{caseData.transaction_id}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Originating Entity (Sender)
            </div>
            <TokenChip token={caseData.transaction?.sender_token_id || 'UNKNOWN'} />
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Beneficiary Entity (Receiver)
            </div>
            <TokenChip token={caseData.transaction?.receiver_token_id || 'UNKNOWN'} />
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Recorded Timestamp
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--ink)' }}>
              {caseData.transaction?.txn_time ? new Date(caseData.transaction.txn_time).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* "Why this was flagged" & AI Assessment Rationale */}
        <div
          className="tessera-card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>
              Why this was flagged
            </h2>
            {isOverridden && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--amber-text)',
                  backgroundColor: 'var(--amber-bg)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #F9DE96',
                }}
              >
                <AlertTriangle size={12} />
                Overridden by analyst
              </span>
            )}
          </div>

          <p style={{ fontSize: '0.9375rem', color: 'var(--ink)', lineHeight: 1.55 }}>
            {caseData.verdict?.summary || 'Standard transaction pattern without anomalous deviation.'}
          </p>

          {/* What drove the score: Segmented Bar */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--line)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.75rem' }}>
              What drove the score
            </div>

            {/* Segmented Bar */}
            <div
              style={{
                display: 'flex',
                height: '10px',
                borderRadius: '5px',
                overflow: 'hidden',
                backgroundColor: '#EBE8DE',
                marginBottom: '0.5rem',
              }}
            >
              {signalContribs.map((s) => (
                <div
                  key={s.agent}
                  style={{
                    width: `${s.percent}%`,
                    backgroundColor: s.detected ? 'var(--accent)' : 'transparent',
                    transition: 'width 0.3s ease',
                  }}
                  title={`${s.label}: ${s.percent}% contribution`}
                />
              ))}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <span>Estimated from the signals present</span>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {signalContribs
                  .filter((s) => s.detected)
                  .map((s) => (
                    <span key={s.agent} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)' }} />
                      {s.label} ({s.percent}%)
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Evidence List from Agent Findings */}
        <div
          className="tessera-card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface)',
          }}
        >
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1rem' }}>
            Agent Findings & Evidence ({caseData.findings.length})
          </h2>

          {caseData.findings.length === 0 ? (
            <div style={{ fontSize: '0.875rem', color: 'var(--muted)', padding: '1rem 0' }}>
              No anomalous findings recorded by multi-agent investigation.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {caseData.findings.map((f) => (
                <div
                  key={f.id}
                  style={{
                    padding: '1rem 1.125rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#FAF9F5',
                    border: '1px solid var(--line)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent)' }}>
                      {friendlyAgentLabel(f.agent_type)}
                    </span>
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {formatConfidence(f.confidence_score)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.5 }}>
                    {f.summary}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Protected Identity Reveal Vault Card */}
        <div
          className="tessera-card"
          style={{
            padding: '1.5rem',
            backgroundColor: memoryIdentity ? '#FAFDFB' : 'var(--surface)',
            border: memoryIdentity ? '1px solid #C6E7D5' : '1px dashed var(--dashed-border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {memoryIdentity ? (
                <Unlock size={20} color="var(--risk-low-text)" />
              ) : (
                <Lock size={20} color="var(--accent)" />
              )}
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>
                Protected Customer Identity Vault
              </h2>
            </div>

            {/* Reveal Status Chip */}
            {latestReveal && (
              <Chip
                label={`Reveal: ${latestReveal.status}`}
                variant={
                  latestReveal.status === 'APPROVED'
                    ? 'low'
                    : latestReveal.status === 'DENIED'
                    ? 'high'
                    : 'amber'
                }
              />
            )}
          </div>

          {/* Condition 1: Already revealed in this active session memory */}
          {memoryIdentity ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--risk-low-bg)',
                  border: '1px solid #C6E7D5',
                  color: 'var(--risk-low-text)',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CheckCircle2 size={16} />
                <span>Identity unmasked for this active browser session under dual-control approval.</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  backgroundColor: '#FFFFFF',
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
                    {memoryIdentity.senderRealValue}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                    Masked: <span className="mono">{caseData.transaction?.sender_token_id}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    Real Beneficiary Account
                  </div>
                  <div className="mono" style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--ink)' }}>
                    {memoryIdentity.receiverRealValue}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                    Masked: <span className="mono">{caseData.transaction?.receiver_token_id}</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span>Approved by: <strong>{memoryIdentity.approvedBy}</strong></span>
                <span className="mono">Audit Log: {memoryIdentity.auditLogId}</span>
              </div>
            </div>
          ) : latestReveal?.status === 'PENDING' ? (
            /* Condition 2: Reveal request is currently PENDING */
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--amber-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #F9DE96',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--amber-text)' }}>
                <Clock size={16} />
                <span>Awaiting Dual-Control Approval</span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--ink)', lineHeight: 1.5 }}>
                A gated identity unmask request was submitted by <strong>{latestReveal.requested_by}</strong>.
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', backgroundColor: '#FFFFFF', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <strong>Reason:</strong> {latestReveal.reason}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                To maintain regulatory compliance, a Senior Investigator must review and approve this request.
              </div>
            </div>
          ) : latestReveal?.status === 'APPROVED' ? (
            /* Condition 3: Approved in past, but not in current session memory */
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: '#FAF9F5',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)' }}>
                Identity Reveal Previously Approved
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                An unmask request for this case was approved by <strong>{latestReveal.approved_by || 'Senior Investigator'}</strong> on{' '}
                {latestReveal.revealed_at ? new Date(latestReveal.revealed_at).toLocaleString() : 'record'}.
                Under zero-exposure compliance rules, decrypted PII is held only in active memory and is cleared upon session end.
              </div>
            </div>
          ) : (
            /* Condition 4: No reveal or DENIED -> User can request */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {latestReveal?.status === 'DENIED' && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--risk-high-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #F7C8C4',
                    color: 'var(--risk-high-text)',
                    fontSize: '0.8125rem',
                  }}
                >
                  Previous reveal request was denied by {latestReveal.approved_by || 'Senior Investigator'}. You may submit a new justification if formal escalation is required.
                </div>
              )}

              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.55 }}>
                Real customer identities and bank account numbers are protected by the Tessera Tokenization Vault. Downstream models and analysts view synthetic identifiers (
                <span className="mono">{tokenLabels(caseData).slice(0, 2).join(', ')}</span>). Real identities require a formal dual-control request.
              </p>

              <div>
                {hasPermission('reveal:request') ? (
                  <Button
                    variant="accent"
                    size="md"
                    onClick={() => setIsRevealModalOpen(true)}
                    icon={<KeyRound size={16} />}
                  >
                    Request identity reveal
                  </Button>
                ) : (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    Your role cannot submit identity reveal requests.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reveal Request Modal */}
      <Modal
        isOpen={isRevealModalOpen}
        onClose={() => setIsRevealModalOpen(false)}
        title="Request Customer Identity Reveal"
        maxWidth="540px"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsRevealModalOpen(false)} disabled={revealSubmitting}>
              Cancel
            </Button>
            <Button variant="accent" onClick={handleRevealSubmit} loading={revealSubmitting}>
              Submit for dual-control approval
            </Button>
          </>
        }
      >
        <form onSubmit={handleRevealSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {revealError && <ErrorBanner message={revealError} />}

          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#FAF9F5',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line)',
              fontSize: '0.8125rem',
              color: 'var(--muted)',
              lineHeight: 1.5,
            }}
          >
            <strong>Regulatory Dual-Control Notice:</strong> Every reveal request is recorded into the SHA-256 cryptographic audit trail. Real identities are released only after an independent Senior Investigator approves.
          </div>

          <div>
            <label
              htmlFor="reveal-category"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '0.375rem' }}
            >
              Justification category
            </label>
            <select
              id="reveal-category"
              value={revealCategory}
              onChange={(e) => setRevealCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface)',
                minHeight: '44px',
              }}
            >
              <option value="Customer contacted us">Customer contacted us regarding block</option>
              <option value="Regulatory or FIU escalation">Regulatory or FIU escalation</option>
              <option value="Internal investigation">Internal senior investigation</option>
              <option value="Other">Other formal compliance requirement</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="reveal-detail"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '0.375rem' }}
            >
              Detailed justification rationale
            </label>
            <textarea
              id="reveal-detail"
              value={revealDetail}
              onChange={(e) => setRevealDetail(e.target.value)}
              placeholder="State the regulatory ticket or specific reason for unmasking real customer identity..."
              rows={4}
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface)',
                resize: 'vertical',
              }}
            />
          </div>
        </form>
      </Modal>

      {/* Disagree with AI / Override Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Override AI Fraud Assessment"
        maxWidth="520px"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsOverrideModalOpen(false)} disabled={overrideSubmitting}>
              Cancel
            </Button>
            <Button variant="dark" onClick={handleOverrideSubmit} loading={overrideSubmitting}>
              Submit override verdict
            </Button>
          </>
        }
      >
        <form onSubmit={handleOverrideSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {overrideError && <ErrorBanner message={overrideError} />}

          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5 }}>
            You are overriding the composite decision generated by the Multi-Agent engine for <strong>{caseData.id}</strong>. This override is logged to the immutable compliance ledger.
          </div>

          <div>
            <label
              htmlFor="override-risk-level"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '0.375rem' }}
            >
              New assigned risk level
            </label>
            <select
              id="override-risk-level"
              value={overrideLevel}
              onChange={(e) => setOverrideLevel(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface)',
                minHeight: '44px',
              }}
            >
              <option value="LOW">LOW (Dismiss false positive)</option>
              <option value="MEDIUM">MEDIUM (Requires monitoring)</option>
              <option value="HIGH">HIGH (Confirmed fraud indicator)</option>
              <option value="CRITICAL">CRITICAL (Immediate freeze)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="override-reason"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '0.375rem' }}
            >
              Investigator override justification
            </label>
            <textarea
              id="override-reason"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Customer confirmed travel plan; false positive device jump verified via out-of-band call."
              rows={4}
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface)',
                resize: 'vertical',
              }}
            />
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};

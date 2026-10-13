import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  Unlock,
  KeyRound,
  AlertTriangle,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { FraudCaseDTO, RevealRequestDTO } from '../api/types';
import { parseScore, contributions } from '../api/derive';
import { AppShell } from '../components/layout/AppShell';
import { Chip } from '../components/common/Chip';
import { TokenChip } from '../components/common/TokenChip';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { Skeleton } from '../components/common/Skeleton';
import { COPY } from '../copy';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasPermission, getRevealedIdentity, user } = useAuth();

  const [caseData, setCaseData] = useState<FraudCaseDTO | null>(null);
  const [caseReveals, setCaseReveals] = useState<RevealRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reveal Modal State
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [revealCategory, setRevealCategory] = useState(
    COPY.caseDetail.requestModal.categories[0]
  );
  const [revealDetail, setRevealDetail] = useState('');
  const [revealSubmitting, setRevealSubmitting] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);

  // Override Modal State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideLevel, setOverrideLevel] = useState('LOW');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  const fetchCaseDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [caseResp, revealsResp] = await Promise.all([
        api.getCase(id),
        api.listReveals().catch(() => [] as RevealRequestDTO[]),
      ]);
      setCaseData(caseResp);
      const filtered = revealsResp.filter((r) => r.case_id === id);
      setCaseReveals(filtered);
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || COPY.auth.networkError;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    document.title = caseData
      ? `${COPY.brand.name} — ${COPY.caseDetail.caseTitle(caseData.id)}`
      : `${COPY.brand.name} — ${COPY.caseQueue.title}`;
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

  const getAgentColor = (agentType: string): string => {
    switch (agentType.toUpperCase()) {
      case 'KYC_AGENT':
      case 'KYC':
        return 'var(--agent-watchlist)';
      case 'PATTERN_AGENT':
      case 'PATTERN':
        return 'var(--agent-pattern)';
      case 'BEHAVIORAL_AGENT':
      case 'BEHAVIORAL':
        return 'var(--agent-behaviour)';
      case 'GRAPH_AGENT':
      case 'GRAPH':
        return 'var(--agent-graph)';
      default:
        return 'var(--primary)';
    }
  };

  const formatConfidence = (scoreStr?: string | null): string => {
    if (!scoreStr) return '85%';
    const val = parseFloat(scoreStr);
    if (isNaN(val)) return scoreStr;
    const pct = val <= 1 ? Math.round(val * 100) : Math.round(val);
    return `${pct}% sure`;
  };

  const memoryIdentity = caseData ? getRevealedIdentity(caseData.id) : null;

  const latestReveal = useMemo(() => {
    if (caseReveals.length === 0) return null;
    return [...caseReveals].sort(
      (a, b) => (b.id > a.id ? 1 : -1)
    )[0];
  }, [caseReveals]);

  const signalContribs = useMemo(() => {
    return contributions(caseData);
  }, [caseData]);

  const parsedScore = useMemo(() => {
    return parseScore(caseData?.verdict?.summary);
  }, [caseData]);

  const isOverridden = caseData?.status === 'OVERRIDDEN';

  // Submit Reveal Request
  const handleRevealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData) return;
    if (!revealDetail.trim()) {
      setRevealError('Please provide an explanation for this request.');
      return;
    }

    setRevealSubmitting(true);
    setRevealError(null);
    try {
      const fullReason = `${revealCategory}: ${revealDetail.trim()}`;
      await api.submitReveal(caseData.id, fullReason);
      setIsRevealModalOpen(false);
      setRevealDetail('');
      await fetchCaseDetail();
    } catch (err: unknown) {
      setRevealError((err as Error).message || COPY.auth.networkError);
    } finally {
      setRevealSubmitting(false);
    }
  };

  // Submit AI Verdict Override
  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData) return;
    if (!overrideReason.trim()) {
      setOverrideError('Please explain why you are changing the rating.');
      return;
    }

    setOverrideSubmitting(true);
    setOverrideError(null);
    try {
      await api.overrideCase(caseData.id, overrideLevel, overrideReason.trim());
      setIsOverrideModalOpen(false);
      setOverrideReason('');
      await fetchCaseDetail();
    } catch (err: unknown) {
      setOverrideError((err as Error).message || COPY.auth.networkError);
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const handleCopyFingerprint = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 1500);
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Skeleton width="120px" height="36px" />
          </div>
          <div className="tessera-card" style={{ padding: '2rem' }}>
            <Skeleton width="40%" height="2rem" style={{ marginBottom: '1rem' }} />
            <Skeleton width="80%" height="1.25rem" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !caseData) {
    return (
      <AppShell>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--primary)',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} />
            <span>{COPY.caseDetail.backToQueue}</span>
          </Link>
          <ErrorBanner
            message={error || "Case record was not found or couldn't be loaded."}
            onRetry={fetchCaseDetail}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Back Link */}
        <div>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--primary)',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} />
            <span>{COPY.caseDetail.backToQueue}</span>
          </Link>
        </div>

        {/* Case Header Banner */}
        <div
          className="tessera-card"
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1
              className="mono"
              style={{
                fontSize: '1.375rem',
                fontWeight: 600,
                color: 'var(--ink)',
                letterSpacing: '-0.01em',
              }}
            >
              {caseData.id}
            </h1>
            <Chip
              label={caseData.verdict?.risk_level || 'LOW'}
              variant={
                caseData.verdict?.risk_level === 'HIGH' ||
                caseData.verdict?.risk_level === 'CRITICAL'
                  ? 'high'
                  : caseData.verdict?.risk_level === 'MEDIUM'
                  ? 'med'
                  : 'low'
              }
              score={parsedScore}
            />
            <Chip
              label={
                COPY.statusLabels[caseData.status.toUpperCase()] || caseData.status
              }
              variant={
                caseData.status === 'OPEN' || caseData.status === 'UNDER_REVIEW'
                  ? 'info'
                  : caseData.status === 'RESOLVED'
                  ? 'low'
                  : 'neutral'
              }
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {hasPermission('cases:override') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOverrideModalOpen(true)}
                icon={<AlertTriangle size={15} />}
              >
                {COPY.caseDetail.changeRiskButton}
              </Button>
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
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                marginBottom: '0.25rem',
              }}
            >
              {COPY.caseDetail.amount}
            </div>
            <div
              className="mono"
              style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)' }}
            >
              {formatINR(caseData.transaction?.amount)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              Reference ID: <span className="mono">{caseData.transaction_id}</span>
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                marginBottom: '0.35rem',
              }}
            >
              {COPY.caseDetail.customer}
            </div>
            <TokenChip
              token={caseData.transaction?.sender_token_id || 'UNKNOWN'}
              tooltip={COPY.caseQueue.table.anonymousIdTooltip}
            />
          </div>

          <div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                marginBottom: '0.35rem',
              }}
            >
              {COPY.caseDetail.recipient}
            </div>
            <TokenChip
              token={caseData.transaction?.receiver_token_id || 'UNKNOWN'}
              tooltip={COPY.caseQueue.table.anonymousIdTooltip}
            />
          </div>

          <div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                marginBottom: '0.25rem',
              }}
            >
              {COPY.caseDetail.raised}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--ink)' }}>
              {caseData.transaction?.txn_time
                ? new Date(caseData.transaction.txn_time).toLocaleString()
                : 'N/A'}
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>
              {COPY.caseDetail.whyFlagged}
            </h2>
            {isOverridden && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--warn-pill)',
                  backgroundColor: 'var(--warn-pill-bg)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--warn-pill-border)',
                }}
              >
                <AlertTriangle size={12} />
                {COPY.caseDetail.riskChangedBy(user?.username || 'analyst')}
              </span>
            )}
          </div>

          <p style={{ fontSize: '0.9375rem', color: 'var(--ink)', lineHeight: 1.55 }}>
            {caseData.verdict?.summary || 'Standard pattern without anomalous deviation.'}
          </p>

          {/* What raised the risk: Segmented Bar */}
          <div
            style={{
              marginTop: '1.5rem',
              borderTop: '1px solid var(--line)',
              paddingTop: '1.25rem',
            }}
          >
            <div
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: '0.75rem',
              }}
            >
              {COPY.caseDetail.whatRaisedRisk}
            </div>

            {/* Segmented Bar with Agent Colors */}
            <div
              style={{
                display: 'flex',
                height: '10px',
                borderRadius: '5px',
                overflow: 'hidden',
                backgroundColor: 'var(--neutral-bg)',
                marginBottom: '0.75rem',
              }}
            >
              {signalContribs.map((s) => (
                <div
                  key={s.agent}
                  style={{
                    width: `${s.percent}%`,
                    backgroundColor: s.detected ? s.colorVar : 'transparent',
                    transition: 'width 0.3s ease',
                  }}
                  title={`${s.label}: ${s.percent}%`}
                />
              ))}
            </div>

            {/* Small Legend Below Score Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                fontSize: '0.75rem',
                color: 'var(--muted)',
              }}
            >
              <span>{COPY.caseDetail.scoreCaption}</span>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {signalContribs.map((s) => (
                  <span
                    key={s.agent}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '2px',
                        backgroundColor: s.detected ? s.colorVar : 'var(--neutral-bg)',
                        border: s.detected ? `1px solid ${s.colorVar}` : '1px solid var(--line)',
                      }}
                    />
                    <span style={{ color: s.detected ? 'var(--ink)' : 'var(--muted)' }}>
                      {s.label} ({s.detected ? `${s.percent}%` : '—'})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Evidence List from Checks */}
        <div
          className="tessera-card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface)',
          }}
        >
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--ink)',
              marginBottom: '1rem',
            }}
          >
            {COPY.caseDetail.evidenceList} ({caseData.findings.length})
          </h2>

          {caseData.findings.length === 0 ? (
            <div style={{ fontSize: '0.875rem', color: 'var(--muted)', padding: '1rem 0' }}>
              No risk findings recorded for this transaction.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {caseData.findings.map((f) => {
                const checkColor = getAgentColor(f.agent_type);
                const checkLabel =
                  COPY.agentLabels[f.agent_type] || f.agent_type;
                return (
                  <div
                    key={f.id}
                    style={{
                      padding: '1rem 1.125rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--surface-2)',
                      border: '1px solid var(--line)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '2px',
                            backgroundColor: checkColor,
                          }}
                        />
                        <span
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: 'var(--ink)',
                          }}
                        >
                          {checkLabel}
                        </span>
                      </div>
                      <span
                        className="mono"
                        style={{ fontSize: '0.75rem', color: 'var(--muted)' }}
                      >
                        {formatConfidence(f.confidence_score)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.5 }}>
                      {f.summary}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Identity Box */}
        <div
          className="tessera-card"
          style={{
            padding: '1.5rem',
            backgroundColor: memoryIdentity ? 'var(--warn-pill-bg)' : 'var(--surface-2)',
            border: memoryIdentity
              ? '1px solid var(--warn-pill-border)'
              : '1px dashed var(--line-strong)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {memoryIdentity ? (
                <Unlock size={20} color="var(--warn-pill)" />
              ) : (
                <Lock size={20} color="var(--muted)" />
              )}
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>
                {memoryIdentity
                  ? COPY.caseDetail.identityBox.unlockedTitle
                  : COPY.caseDetail.identityBox.lockedTitle}
              </h2>
            </div>

            {latestReveal && (
              <Chip
                label={COPY.statusLabels[latestReveal.status] || latestReveal.status}
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

          {memoryIdentity ? (
            /* Unmasked in memory */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--warn-pill)',
                  lineHeight: 1.5,
                }}
              >
                {COPY.caseDetail.identityBox.unlockedHelp}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  backgroundColor: 'var(--surface)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--warn-pill-border)',
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
                    {COPY.caseDetail.identityBox.realName}
                  </div>
                  <div
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    {memoryIdentity.senderRealValue}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                    Anonymous ID: <span className="mono">{caseData.transaction?.sender_token_id}</span>
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
                    {COPY.caseDetail.identityBox.accountNumber}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    {memoryIdentity.receiverRealValue}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                    Anonymous ID: <span className="mono">{caseData.transaction?.receiver_token_id}</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--muted)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <span>
                  {COPY.caseDetail.identityBox.releasedBy}:{' '}
                  <strong>{memoryIdentity.approvedBy}</strong>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="mono">
                    {COPY.nameRequests.successModal.fingerprint}: {memoryIdentity.hash.slice(0, 10)}...
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyFingerprint(memoryIdentity.hash)}
                    title={copiedFingerprint ? COPY.common.copied : COPY.common.copy}
                    style={{
                      color: 'var(--muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px',
                    }}
                  >
                    {copiedFingerprint ? <Check size={13} color="var(--primary)" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>
          ) : latestReveal?.status === 'PENDING' ? (
            /* Pending senior approval */
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--warn-pill-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--warn-pill-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'var(--warn-pill)',
                }}
              >
                <Clock size={16} />
                <span>{COPY.caseDetail.identityBox.requestPending}</span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--ink)', lineHeight: 1.5 }}>
                A request was submitted by <strong>{latestReveal.requested_by}</strong>.
              </div>
              <div
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--muted)',
                  backgroundColor: 'var(--surface)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                }}
              >
                <strong>Reason:</strong> {latestReveal.reason}
              </div>
            </div>
          ) : (
            /* Ready to request */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.55 }}>
                {COPY.caseDetail.identityBox.lockedHelp}
              </p>

              <div>
                {hasPermission('reveal:request') ? (
                  <Button
                    variant="dark"
                    size="md"
                    onClick={() => setIsRevealModalOpen(true)}
                    icon={<KeyRound size={16} />}
                  >
                    {COPY.caseDetail.identityBox.requestButton}
                  </Button>
                ) : (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    Your role cannot request customer names.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Request Customer Name Modal */}
      <Modal
        isOpen={isRevealModalOpen}
        onClose={() => setIsRevealModalOpen(false)}
        title={COPY.caseDetail.requestModal.title}
        maxWidth="540px"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsRevealModalOpen(false)}
              disabled={revealSubmitting}
            >
              {COPY.caseDetail.requestModal.cancel}
            </Button>
            <Button
              variant="primary"
              onClick={handleRevealSubmit}
              loading={revealSubmitting}
            >
              {revealSubmitting
                ? COPY.caseDetail.requestModal.submitting
                : COPY.caseDetail.requestModal.submit}
            </Button>
          </>
        }
      >
        <form
          onSubmit={handleRevealSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          {revealError && <ErrorBanner message={revealError} />}

          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--surface-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line)',
              fontSize: '0.8125rem',
              color: 'var(--muted)',
              lineHeight: 1.5,
            }}
          >
            {COPY.caseDetail.requestModal.help}
          </div>

          <div>
            <label
              htmlFor="reveal-category"
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--ink)',
                marginBottom: '0.375rem',
              }}
            >
              {COPY.caseDetail.requestModal.categoryLabel}
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
                color: 'var(--ink)',
                minHeight: '44px',
              }}
            >
              {COPY.caseDetail.requestModal.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="reveal-detail"
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--ink)',
                marginBottom: '0.375rem',
              }}
            >
              {COPY.caseDetail.requestModal.detailLabel}
            </label>
            <textarea
              id="reveal-detail"
              value={revealDetail}
              onChange={(e) => setRevealDetail(e.target.value)}
              placeholder={COPY.caseDetail.requestModal.detailPlaceholder}
              rows={4}
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface)',
                color: 'var(--ink)',
                resize: 'vertical',
              }}
            />
          </div>
        </form>
      </Modal>

      {/* Change Risk Rating Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title={COPY.caseDetail.overrideModal.title}
        maxWidth="520px"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsOverrideModalOpen(false)}
              disabled={overrideSubmitting}
            >
              {COPY.caseDetail.overrideModal.cancel}
            </Button>
            <Button
              variant="primary"
              onClick={handleOverrideSubmit}
              loading={overrideSubmitting}
            >
              {overrideSubmitting
                ? COPY.caseDetail.overrideModal.submitting
                : COPY.caseDetail.overrideModal.submit}
            </Button>
          </>
        }
      >
        <form
          onSubmit={handleOverrideSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          {overrideError && <ErrorBanner message={overrideError} />}

          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5 }}>
            {COPY.caseDetail.overrideModal.help}
          </div>

          <div>
            <label
              htmlFor="override-level"
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--ink)',
                marginBottom: '0.375rem',
              }}
            >
              {COPY.caseDetail.overrideModal.newRiskLabel}
            </label>
            <select
              id="override-level"
              value={overrideLevel}
              onChange={(e) => setOverrideLevel(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface)',
                color: 'var(--ink)',
                minHeight: '44px',
              }}
            >
              <option value="LOW">{COPY.riskLabels.LOW}</option>
              <option value="MEDIUM">{COPY.riskLabels.MEDIUM}</option>
              <option value="HIGH">{COPY.riskLabels.HIGH}</option>
              <option value="CRITICAL">{COPY.riskLabels.CRITICAL}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="override-reason"
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--ink)',
                marginBottom: '0.375rem',
              }}
            >
              {COPY.caseDetail.overrideModal.reasonLabel}
            </label>
            <textarea
              id="override-reason"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder={COPY.caseDetail.overrideModal.reasonPlaceholder}
              rows={4}
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface)',
                color: 'var(--ink)',
                resize: 'vertical',
              }}
            />
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};

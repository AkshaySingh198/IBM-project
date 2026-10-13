import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  KeyRound,
  Eye,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { api } from '../api/client';
import type { FraudCaseDTO, RevealRequestDTO } from '../api/types';
import { parseScore, tokenLabels, contributions } from '../api/derive';
import { AppShell } from '../components/layout/AppShell';
import { KpiCard } from '../components/common/KpiCard';
import { Chip } from '../components/common/Chip';
import { TokenChip } from '../components/common/TokenChip';
import { DataTable } from '../components/common/DataTable';
import type { Column } from '../components/common/DataTable';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { Button } from '../components/common/Button';
import { COPY } from '../copy';

export const CaseQueuePage: React.FC = () => {
  const navigate = useNavigate();

  const [cases, setCases] = useState<FraudCaseDTO[]>([]);
  const [reveals, setReveals] = useState<RevealRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  // Selected case for compact side panel
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesData, revealsData] = await Promise.all([
        api.listCases(),
        api.listReveals().catch(() => [] as RevealRequestDTO[]),
      ]);
      setCases(casesData);
      setReveals(revealsData);
      if (casesData.length > 0 && !selectedCaseId) {
        setSelectedCaseId(casesData[0].id);
      }
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || COPY.auth.networkError;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [selectedCaseId]);

  useEffect(() => {
    document.title = `${COPY.brand.name} — ${COPY.caseQueue.title}`;
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Format currency with Indian digit grouping
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

  // Format relative timestamp
  const formatRelativeTime = (isoString?: string): string => {
    if (!isoString) return 'Just now';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 1) return 'Recent';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // KPI Calculations
  const awaitingReviewCount = useMemo(() => {
    return cases.filter((c) => c.status === 'OPEN' || c.status === 'UNDER_REVIEW').length;
  }, [cases]);

  const highRiskCount = useMemo(() => {
    return cases.filter(
      (c) => c.verdict?.risk_level === 'HIGH' || c.verdict?.risk_level === 'CRITICAL'
    ).length;
  }, [cases]);

  const pendingRevealsCount = useMemo(() => {
    return reveals.filter((r) => r.status === 'PENDING').length;
  }, [reveals]);

  // Sorting and Filtering
  const filteredAndSortedCases = useMemo(() => {
    const riskWeight = (level?: string | null) => {
      switch (level?.toUpperCase()) {
        case 'CRITICAL':
        case 'HIGH':
          return 3;
        case 'MEDIUM':
          return 2;
        case 'LOW':
          return 1;
        default:
          return 0;
      }
    };

    return cases
      .filter((c) => {
        // Status filter
        if (statusFilter !== 'ALL' && c.status.toUpperCase() !== statusFilter.toUpperCase()) {
          return false;
        }
        // Risk filter
        if (
          riskFilter !== 'ALL' &&
          c.verdict?.risk_level.toUpperCase() !== riskFilter.toUpperCase()
        ) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const tokens = tokenLabels(c).map((t) => t.toLowerCase());
          const matchId = c.id.toLowerCase().includes(q);
          const matchTxn = c.transaction_id.toLowerCase().includes(q);
          const matchToken = tokens.some((t) => t.includes(q));
          const matchSummary = c.verdict?.summary.toLowerCase().includes(q);
          const matchFinding = c.findings.some((f) => f.summary.toLowerCase().includes(q));
          if (!matchId && !matchTxn && !matchToken && !matchSummary && !matchFinding) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        // 1. Sort by risk level
        const rwA = riskWeight(a.verdict?.risk_level);
        const rwB = riskWeight(b.verdict?.risk_level);
        if (rwA !== rwB) return rwB - rwA;

        // 2. Sort by parsed score
        const scoreA = parseScore(a.verdict?.summary) || 0;
        const scoreB = parseScore(b.verdict?.summary) || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;

        // 3. Sort by newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [cases, statusFilter, riskFilter, searchQuery]);

  const selectedCase = useMemo(() => {
    return cases.find((c) => c.id === selectedCaseId) || null;
  }, [cases, selectedCaseId]);

  // Columns definition
  const columns: Column<FraudCaseDTO>[] = [
    {
      key: 'id',
      header: COPY.caseQueue.table.caseId,
      width: '100px',
      render: (c) => (
        <span className="mono" style={{ fontWeight: 600, color: 'var(--ink)' }}>
          {c.id}
        </span>
      ),
    },
    {
      key: 'subject',
      header: COPY.caseQueue.table.customer,
      width: '150px',
      render: (c) => {
        const tokens = tokenLabels(c);
        const displayToken = tokens[0] || c.transaction?.sender_token_id || 'UNKNOWN';
        return (
          <TokenChip
            token={displayToken}
            tooltip={COPY.caseQueue.table.anonymousIdTooltip}
          />
        );
      },
    },
    {
      key: 'findings',
      header: COPY.caseDetail.whatWeFound,
      render: (c) => {
        const text =
          c.findings[0]?.summary || c.verdict?.summary || 'No risk signals recorded';
        return (
          <div
            style={{
              maxWidth: '340px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.8125rem',
              color: 'var(--ink)',
            }}
            title={text}
          >
            {text}
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: COPY.caseQueue.table.amount,
      width: '120px',
      align: 'right',
      render: (c) => (
        <span className="mono" style={{ fontWeight: 600 }}>
          {formatINR(c.transaction?.amount)}
        </span>
      ),
    },
    {
      key: 'risk',
      header: COPY.caseQueue.table.risk,
      width: '130px',
      render: (c) => {
        const level = c.verdict?.risk_level || 'LOW';
        const score = parseScore(c.verdict?.summary);
        const variant =
          level === 'HIGH' || level === 'CRITICAL'
            ? 'high'
            : level === 'MEDIUM'
            ? 'med'
            : 'low';
        return <Chip label={level} variant={variant} score={score} />;
      },
    },
    {
      key: 'signals',
      header: COPY.caseQueue.table.checks,
      width: '110px',
      render: (c) => {
        const sigs = contributions(c);
        return (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {sigs.map((s) => (
              <span
                key={s.agent}
                title={`${s.label}: ${s.detected ? 'Active check' : 'Not triggered'}`}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  backgroundColor: s.detected ? s.colorVar : 'var(--neutral-bg)',
                  border: s.detected ? `1px solid ${s.colorVar}` : '1px solid var(--line)',
                }}
              />
            ))}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: COPY.caseQueue.table.status,
      width: '110px',
      render: (c) => {
        const status = c.status.toUpperCase();
        const variant =
          status === 'OPEN' || status === 'UNDER_REVIEW'
            ? 'info'
            : status === 'RESOLVED' || status === 'APPROVED'
            ? 'low'
            : status === 'PENDING'
            ? 'amber'
            : 'neutral';
        return (
          <Chip
            label={COPY.statusLabels[status] || status}
            variant={variant}
          />
        );
      },
    },
    {
      key: 'opened',
      header: COPY.caseQueue.table.raised,
      width: '100px',
      render: (c) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
          {formatRelativeTime(c.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: COPY.caseQueue.table.actions,
      width: '90px',
      align: 'right',
      render: (c) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/cases/${c.id}`);
          }}
          icon={<ChevronRight size={14} />}
        >
          {COPY.caseQueue.table.review}
        </Button>
      ),
    },
  ];

  return (
    <AppShell onSearch={setSearchQuery} searchPlaceholder={COPY.caseQueue.searchPlaceholder}>
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
              {COPY.caseQueue.title}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
              {COPY.caseQueue.subLine(filteredAndSortedCases.length)}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && <ErrorBanner message={error} onRetry={fetchData} />}

        {/* KPI Cards Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1rem',
          }}
        >
          <KpiCard
            label={COPY.caseQueue.kpis.waiting}
            value={awaitingReviewCount}
            subtext="Status OPEN or UNDER_REVIEW"
            tone="info"
            icon={<Clock size={18} />}
          />
          <KpiCard
            label={COPY.caseQueue.kpis.highRisk}
            value={highRiskCount}
            subtext="Score ≥ 60 or Watchlist match"
            tone="high"
            icon={<ShieldAlert size={18} />}
          />
          <KpiCard
            label={COPY.caseQueue.kpis.pendingReveals}
            value={pendingRevealsCount}
            subtext="Awaiting senior approval"
            tone="med"
            icon={<KeyRound size={18} />}
          />
          <KpiCard
            label={COPY.caseQueue.kpis.aiNamesSeen}
            value={0}
            subtext={COPY.caseQueue.kpis.aiNamesSub}
            isHero={true}
            icon={<Eye size={18} />}
          />
        </div>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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

            {/* Status Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label htmlFor="status-select" style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                Status
              </label>
              <select
                id="status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--ink)',
                  fontSize: '0.8125rem',
                }}
              >
                <option value="ALL">{COPY.caseQueue.filters.allStatuses}</option>
                <option value="OPEN">{COPY.caseQueue.filters.open}</option>
                <option value="UNDER_REVIEW">{COPY.caseQueue.filters.underReview}</option>
                <option value="RESOLVED">{COPY.caseQueue.filters.resolved}</option>
                <option value="OVERRIDDEN">{COPY.caseQueue.filters.overridden}</option>
              </select>
            </div>

            {/* Risk Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label htmlFor="risk-select" style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                Risk
              </label>
              <select
                id="risk-select"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--ink)',
                  fontSize: '0.8125rem',
                }}
              >
                <option value="ALL">{COPY.caseQueue.filters.allRisks}</option>
                <option value="CRITICAL">{COPY.caseQueue.filters.critical}</option>
                <option value="HIGH">{COPY.caseQueue.filters.high}</option>
                <option value="MEDIUM">{COPY.caseQueue.filters.medium}</option>
                <option value="LOW">{COPY.caseQueue.filters.low}</option>
              </select>
            </div>
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
            Showing <strong>{filteredAndSortedCases.length}</strong> of{' '}
            <strong>{cases.length}</strong> cases
          </div>
        </div>

        {/* Main Content: Split Table and Detail Side Panel */}
        <div className="case-queue-layout">
          {/* Main Table */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <DataTable
              columns={columns}
              data={filteredAndSortedCases}
              keyExtractor={(c) => c.id}
              selectedKey={selectedCaseId}
              onRowClick={(c) => setSelectedCaseId(c.id)}
              loading={loading}
              emptyTitle={COPY.caseQueue.emptyState}
            />
          </div>

          {/* Responsive Side Detail Panel */}
          {selectedCase && (
            <div
              className="tessera-card case-side-panel"
              style={{
                width: '320px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                alignSelf: 'flex-start',
                backgroundColor: 'var(--surface)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--line)',
                  paddingBottom: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
                    {COPY.caseQueue.previewTitle}
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--ink)' }}
                  >
                    {selectedCase.id}
                  </div>
                </div>
                <Chip
                  label={selectedCase.verdict?.risk_level || 'LOW'}
                  variant={
                    selectedCase.verdict?.risk_level === 'HIGH' ||
                    selectedCase.verdict?.risk_level === 'CRITICAL'
                      ? 'high'
                      : selectedCase.verdict?.risk_level === 'MEDIUM'
                      ? 'med'
                      : 'low'
                  }
                  score={parseScore(selectedCase.verdict?.summary)}
                />
              </div>

              {/* Amount and Customer */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {COPY.caseDetail.amount}
                </div>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  {formatINR(selectedCase.transaction?.amount)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                  {COPY.caseQueue.table.customer}
                </div>
                <TokenChip
                  token={
                    tokenLabels(selectedCase)[0] ||
                    selectedCase.transaction?.sender_token_id ||
                    'UNKNOWN'
                  }
                  tooltip={COPY.caseQueue.table.anonymousIdTooltip}
                />
              </div>

              {/* Checks */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                  {COPY.caseQueue.table.checks}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {contributions(selectedCase).map((s) => (
                    <div
                      key={s.agent}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '2px',
                            backgroundColor: s.detected ? s.colorVar : 'var(--neutral-bg)',
                            border: s.detected
                              ? `1px solid ${s.colorVar}`
                              : '1px solid var(--line)',
                          }}
                        />
                        <span style={{ color: s.detected ? 'var(--ink)' : 'var(--muted)' }}>
                          {s.label}
                        </span>
                      </div>
                      <span
                        className="mono"
                        style={{
                          fontWeight: s.detected ? 600 : 400,
                          color: s.detected ? 'var(--ink)' : 'var(--muted)',
                        }}
                      >
                        {s.detected ? `${s.percent}%` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What We Found summary */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                  {COPY.caseDetail.whatWeFound}
                </div>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--ink)',
                    lineHeight: 1.4,
                    backgroundColor: 'var(--surface-2)',
                    padding: '0.625rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--line)',
                  }}
                >
                  {selectedCase.verdict?.summary ||
                    selectedCase.findings[0]?.summary ||
                    'No summary available'}
                </div>
              </div>

              {/* Open full case button */}
              <Button
                variant="primary"
                onClick={() => navigate(`/cases/${selectedCase.id}`)}
                icon={<ExternalLink size={15} />}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {COPY.caseQueue.viewFullCase}
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .case-queue-layout {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }
        @media (max-width: 1100px) {
          .case-queue-layout {
            flex-direction: column;
          }
          .case-side-panel {
            width: 100% !important;
          }
        }
      `}</style>
    </AppShell>
  );
};

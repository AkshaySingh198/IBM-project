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
import { useAuth } from '../context/AuthContext';
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

export const CaseQueuePage: React.FC = () => {
  const { revealedCount } = useAuth();
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
      setError((err as Error).message || 'Failed to load case queue');
    } finally {
      setLoading(false);
    }
  }, [selectedCaseId]);

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
    return cases.filter((c) => c.verdict?.risk_level === 'HIGH' || c.verdict?.risk_level === 'CRITICAL').length;
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
        if (riskFilter !== 'ALL' && c.verdict?.risk_level.toUpperCase() !== riskFilter.toUpperCase()) {
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
      header: 'Case',
      width: '100px',
      render: (c) => (
        <span className="mono" style={{ fontWeight: 600, color: 'var(--ink)' }}>
          {c.id}
        </span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject Token',
      width: '150px',
      render: (c) => {
        const tokens = tokenLabels(c);
        const displayToken = tokens[0] || c.transaction?.sender_token_id || 'UNKNOWN';
        return <TokenChip token={displayToken} />;
      },
    },
    {
      key: 'findings',
      header: 'What we found',
      render: (c) => {
        const text = c.findings[0]?.summary || c.verdict?.summary || 'No risk signals recorded';
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
      header: 'Amount',
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
      header: 'Risk',
      width: '130px',
      render: (c) => {
        const level = c.verdict?.risk_level || 'LOW';
        const score = parseScore(c.verdict?.summary);
        return <Chip label={level} variant={level.toLowerCase() as any} score={score} />;
      },
    },
    {
      key: 'signals',
      header: 'Signals',
      width: '110px',
      render: (c) => {
        const sigs = contributions(c);
        return (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {sigs.map((s) => (
              <span
                key={s.agent}
                title={`${s.label}: ${s.detected ? 'Active finding' : 'Not detected'}`}
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '2px',
                  backgroundColor: s.detected ? 'var(--accent)' : '#E0DDD5',
                  border: s.detected ? '1px solid var(--accent-hover)' : '1px solid #D1CDC4',
                }}
              />
            ))}
          </div>
        );
      },
    },
    {
      key: 'opened',
      header: 'Opened',
      width: '100px',
      render: (c) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
          {formatRelativeTime(c.created_at)}
        </span>
      ),
    },
  ];

  return (
    <AppShell onSearch={setSearchQuery} searchPlaceholder="Search case ID, token, narrative...">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Page Title & Context */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              Case queue
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
              {filteredAndSortedCases.length} {filteredAndSortedCases.length === 1 ? 'case needs' : 'cases need'} review, highest risk first
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
            label="Awaiting review"
            value={awaitingReviewCount}
            subtext="Status OPEN or UNDER_REVIEW"
            icon={<Clock size={18} />}
          />
          <KpiCard
            label="High risk"
            value={highRiskCount}
            subtext="Score ≥ 60 or Watchlist match"
            icon={<ShieldAlert size={18} />}
          />
          <KpiCard
            label="Pending reveal requests"
            value={pendingRevealsCount}
            subtext="Awaiting dual-control approval"
            icon={<KeyRound size={18} />}
          />
          <KpiCard
            label="Real names on this page"
            value={revealedCount}
            subtext={revealedCount === 0 ? 'Strict privacy mode (Zero PII)' : 'Decrypted in current session'}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--muted)', fontSize: '0.8125rem' }}>
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
                  padding: '0.35rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--surface)',
                }}
              >
                <option value="ALL">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="OVERRIDDEN">Overridden</option>
              </select>
            </div>

            {/* Risk Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label htmlFor="risk-select" style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                Risk level
              </label>
              <select
                id="risk-select"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                style={{
                  padding: '0.35rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--surface)',
                }}
              >
                <option value="ALL">All risks</option>
                <option value="HIGH">High risk</option>
                <option value="MEDIUM">Medium risk</option>
                <option value="LOW">Low risk</option>
              </select>
            </div>
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
            Showing <strong>{filteredAndSortedCases.length}</strong> of {cases.length} cases
          </div>
        </div>

        {/* Main Content Area: Table + Side Panel */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: selectedCase ? '1fr 320px' : '1fr',
            gap: '1.25rem',
            alignItems: 'start',
          }}
          className="queue-split-container"
        >
          {/* Table Container */}
          <div style={{ minWidth: 0 }}>
            <DataTable
              columns={columns}
              data={filteredAndSortedCases}
              keyExtractor={(c) => c.id}
              selectedKey={selectedCaseId}
              onRowClick={(c) => setSelectedCaseId(c.id)}
              loading={loading}
              emptyTitle="No fraud cases match criteria"
              emptyDescription="Try clearing filters or search query to see other assigned cases."
            />
          </div>

          {/* Compact Right Detail Panel */}
          {selectedCase && (
            <div
              className="tessera-card"
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontWeight: 600, fontSize: '1rem' }}>
                  {selectedCase.id}
                </span>
                <Chip
                  label={selectedCase.verdict?.risk_level || 'LOW'}
                  variant={selectedCase.verdict?.risk_level.toLowerCase() as any}
                  score={parseScore(selectedCase.verdict?.summary)}
                />
              </div>

              {/* Transaction Summary */}
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#FAF9F5',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--line)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Transaction Amount
                </div>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  {formatINR(selectedCase.transaction?.amount)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
                  ID: <span className="mono">{selectedCase.transaction_id}</span>
                </div>
              </div>

              {/* Tokens Involved */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Protected Entities
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {tokenLabels(selectedCase).map((t) => (
                    <TokenChip key={t} token={t} />
                  ))}
                </div>
              </div>

              {/* Rationale */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Assessment Rationale
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--ink)', lineHeight: 1.45 }}>
                  {selectedCase.verdict?.summary || 'Standard transaction pattern without anomalous deviation.'}
                </div>
              </div>

              {/* Findings count badge */}
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                Signals detected: <strong>{selectedCase.findings.length} agents flagged</strong>
              </div>

              {/* Open full case button */}
              <Button
                variant="dark"
                size="md"
                onClick={() => navigate(`/cases/${selectedCase.id}`)}
                icon={<ExternalLink size={16} />}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                Open full case
                <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .queue-split-container {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AppShell>
  );
};

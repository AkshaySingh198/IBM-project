import type { FraudCaseDTO } from './types';

/**
 * Extracts numeric risk score from verdict summary string.
 * Example: "Composite Risk Score: 90/100 (HIGH)..." -> 90
 */
export function parseScore(verdictSummary?: string | null): number | null {
  if (!verdictSummary) return null;
  const match = verdictSummary.match(/(?:Risk Score:\s*|Composite Risk Score:\s*)(\d{1,3})\/100/i);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    return isNaN(num) ? null : num;
  }
  // Fallback pattern matching any "\b\d{1,3}/100\b"
  const generalMatch = verdictSummary.match(/\b(\d{1,3})\/100\b/);
  if (generalMatch && generalMatch[1]) {
    const num = parseInt(generalMatch[1], 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

export interface SignalContribution {
  agent: string;
  label: string;
  weight: number;
  percent: number;
  detected: boolean;
  colorVar: string;
}

/**
 * Maps findings to signals using Aggregator weights:
 * Pattern: 30, KYC: 30, Behavioral: 30, Graph: 10
 */
export function contributions(caseData?: FraudCaseDTO | null): SignalContribution[] {
  if (!caseData || !caseData.findings) {
    return [
      {
        agent: 'PATTERN_AGENT',
        label: 'Past fraud match',
        weight: 30,
        percent: 0,
        detected: false,
        colorVar: 'var(--agent-pattern)',
      },
      {
        agent: 'KYC_AGENT',
        label: 'Watchlist check',
        weight: 30,
        percent: 0,
        detected: false,
        colorVar: 'var(--agent-watchlist)',
      },
      {
        agent: 'BEHAVIORAL_AGENT',
        label: 'Unusual behaviour',
        weight: 30,
        percent: 0,
        detected: false,
        colorVar: 'var(--agent-behaviour)',
      },
      {
        agent: 'GRAPH_AGENT',
        label: 'Linked accounts',
        weight: 10,
        percent: 0,
        detected: false,
        colorVar: 'var(--agent-graph)',
      },
    ];
  }

  const detectedAgents = new Set(caseData.findings.map((f) => f.agent_type.toUpperCase()));

  const signals = [
    {
      agent: 'PATTERN_AGENT',
      label: 'Past fraud match',
      weight: 30,
      detected: detectedAgents.has('PATTERN_AGENT') || detectedAgents.has('PATTERN'),
      colorVar: 'var(--agent-pattern)',
    },
    {
      agent: 'KYC_AGENT',
      label: 'Watchlist check',
      weight: 30,
      detected: detectedAgents.has('KYC_AGENT') || detectedAgents.has('KYC'),
      colorVar: 'var(--agent-watchlist)',
    },
    {
      agent: 'BEHAVIORAL_AGENT',
      label: 'Unusual behaviour',
      weight: 30,
      detected: detectedAgents.has('BEHAVIORAL_AGENT') || detectedAgents.has('BEHAVIORAL'),
      colorVar: 'var(--agent-behaviour)',
    },
    {
      agent: 'GRAPH_AGENT',
      label: 'Linked accounts',
      weight: 10,
      detected: detectedAgents.has('GRAPH_AGENT') || detectedAgents.has('GRAPH'),
      colorVar: 'var(--agent-graph)',
    },
  ];

  const totalDetectedWeight = signals
    .filter((s) => s.detected)
    .reduce((sum, s) => sum + s.weight, 0);

  return signals.map((s) => ({
    ...s,
    percent:
      s.detected && totalDetectedWeight > 0
        ? Math.round((s.weight / totalDetectedWeight) * 100)
        : 0,
  }));
}

/**
 * Extracts token labels (e.g. PERSON_001, ACCOUNT_NUMBER_001, LOCATION_001) from findings,
 * transaction tokens, or summaries.
 */
export function tokenLabels(caseData?: FraudCaseDTO | null): string[] {
  if (!caseData) return [];

  const foundTokens = new Set<string>();

  // Extract from transaction fields
  if (caseData.transaction?.sender_token_id) {
    foundTokens.add(caseData.transaction.sender_token_id);
  }
  if (caseData.transaction?.receiver_token_id) {
    foundTokens.add(caseData.transaction.receiver_token_id);
  }

  // Regex for token formats: PERSON_001, ACCOUNT_NUMBER_001, LOCATION_001, etc.
  const tokenRegex =
    /\b(PERSON_\d+|ACCOUNT_NUMBER_\d+|LOCATION_\d+|DEVICE_ID_\d+|IP_ADDRESS_\d+)\b/g;

  // Search in findings summaries
  if (caseData.findings) {
    for (const finding of caseData.findings) {
      const matches = finding.summary.match(tokenRegex);
      if (matches) {
        matches.forEach((t) => foundTokens.add(t));
      }
    }
  }

  // Search in verdict summary
  if (caseData.verdict?.summary) {
    const matches = caseData.verdict.summary.match(tokenRegex);
    if (matches) {
      matches.forEach((t) => foundTokens.add(t));
    }
  }

  // Filter out internal db IDs like "tok_subj_1" if standard tokens exist
  const standardTokens = Array.from(foundTokens).filter((t) =>
    /^(PERSON|ACCOUNT_NUMBER|LOCATION|DEVICE_ID|IP_ADDRESS)_\d+/.test(t)
  );

  if (standardTokens.length > 0) {
    return standardTokens;
  }

  return Array.from(foundTokens);
}

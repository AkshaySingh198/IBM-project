// API Type Definitions matching OpenAPI 3.1.0 and app/db/init_db.py

export class ApiError extends Error {
  status: number;
  override message: string;
  detail?: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.message = message;
    this.detail = detail;
  }
}

export interface UserDTO {
  id: string;
  username: string;
  email: string;
  role_id: string;
  role_name: string;
  permissions: string[];
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user_id: string;
  username: string;
  role: string;
  permissions: string[];
}

export interface RoleDTO {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
}

export interface PermissionDTO {
  id: string;
  name: string;
}

export interface TransactionDTO {
  id: string;
  sender_token_id: string;
  receiver_token_id: string;
  amount: string; // Indian rupees formatted e.g. "230968.00"
  txn_time: string; // ISO 8601
}

export type AgentType =
  | 'KYC_AGENT'
  | 'GRAPH_AGENT'
  | 'PATTERN_AGENT'
  | 'BEHAVIORAL_AGENT'
  | string;

export interface AgentFindingDTO {
  id: string;
  case_id: string;
  agent_type: AgentType;
  confidence_score: string; // e.g. "0.95"
  summary: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface VerdictDTO {
  id: string;
  case_id: string;
  risk_level: RiskLevel;
  summary: string;
}

export type CaseStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'OVERRIDDEN';

export interface FraudCaseDTO {
  id: string;
  transaction_id: string;
  assigned_to: string | null;
  status: CaseStatus;
  created_at: string;
  transaction: TransactionDTO | null;
  findings: AgentFindingDTO[];
  verdict: VerdictDTO | null;
}

export interface OverrideRequest {
  override_risk_level: string;
  reason: string;
}

export type RevealStatus = 'PENDING' | 'APPROVED' | 'DENIED';

export interface RevealRequestCreate {
  reason: string;
}

export interface RevealRequestDTO {
  id: string;
  case_id: string;
  requested_by: string;
  reason: string;
  status: RevealStatus;
  approved_by: string | null;
  revealed_at: string | null;
}

export interface RevealApprovalResponse {
  request_id: string;
  case_id: string;
  status: 'APPROVED';
  approved_by: string;
  sender_real_value: string;
  receiver_real_value: string;
  audit_log_id: string;
  hash: string;
}

export interface AuditLogDTO {
  id: string;
  actor_id: string;
  action_type: string;
  target_id: string | null;
  prev_hash: string;
  hash: string;
  created_at: string;
}

export interface HashVerificationResponse {
  total_logs: number;
  is_valid: boolean;
  tampered_log_id: string | null;
  message: string;
}

export interface Api {
  login(email: string, password: string): Promise<Token>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<UserDTO>;
  listCases(status?: string): Promise<FraudCaseDTO[]>;
  getCase(id: string): Promise<FraudCaseDTO>;
  overrideCase(id: string, level: string, reason: string): Promise<VerdictDTO>;
  submitReveal(caseId: string, reason: string): Promise<RevealRequestDTO>;
  listReveals(status?: string): Promise<RevealRequestDTO[]>;
  approveReveal(id: string): Promise<RevealApprovalResponse>;
  denyReveal(id: string): Promise<RevealRequestDTO>;
  listAudit(): Promise<AuditLogDTO[]>;
  verifyAudit(): Promise<HashVerificationResponse>;
  downloadReport(format: 'pdf' | 'csv'): Promise<Blob>;
}

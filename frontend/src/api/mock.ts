import { ApiError } from './types';
import type {
  Api,
  AuditLogDTO,
  FraudCaseDTO,
  HashVerificationResponse,
  RevealApprovalResponse,
  RevealRequestDTO,
  Token,
  UserDTO,
  VerdictDTO,
} from './types';

interface MockVaultEntity {
  tokenId: string;
  tokenValue: string;
  realValue: string;
}

const SEEDED_VAULT: Record<string, MockVaultEntity> = {
  tok_subj_1: { tokenId: 'tok_subj_1', tokenValue: 'PERSON_001', realValue: 'Aryan Maharaj' },
  tok_subj_2: { tokenId: 'tok_subj_2', tokenValue: 'PERSON_002', realValue: 'Oni Kannan' },
  tok_subj_3: { tokenId: 'tok_subj_3', tokenValue: 'PERSON_004', realValue: 'Aishani Bassi' },
  tok_acc_1: { tokenId: 'tok_acc_1', tokenValue: 'ACCOUNT_NUMBER_001', realValue: '1819600133' },
  tok_acc_2: { tokenId: 'tok_acc_2', tokenValue: 'ACCOUNT_NUMBER_002', realValue: '2654235116' },
  tok_acc_3: { tokenId: 'tok_acc_3', tokenValue: 'ACCOUNT_NUMBER_003', realValue: '1849593103' },
  tok_loc_1: { tokenId: 'tok_loc_1', tokenValue: 'LOCATION_001', realValue: 'Kishanganj' },
};

interface SeedUser {
  id: string;
  username: string;
  email: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

const SEEDED_USERS: SeedUser[] = [
  {
    id: 'user_analyst',
    username: 'analyst',
    email: 'analyst@bank.com',
    roleId: 'role_analyst',
    roleName: 'Analyst',
    permissions: ['cases:read', 'cases:override', 'reveal:request'],
  },
  {
    id: 'user_investigator',
    username: 'investigator',
    email: 'investigator@bank.com',
    roleId: 'role_senior_investigator',
    roleName: 'SeniorInvestigator',
    permissions: ['cases:read', 'cases:override', 'reveal:request', 'reveal:approve', 'audit:read', 'audit:export'],
  },
  {
    id: 'user_auditor',
    username: 'auditor',
    email: 'auditor@bank.com',
    roleId: 'role_auditor',
    roleName: 'Auditor',
    permissions: ['cases:read', 'audit:read', 'audit:export'],
  },
  {
    id: 'user_admin',
    username: 'admin',
    email: 'admin@bank.com',
    roleId: 'role_admin',
    roleName: 'Admin',
    permissions: ['users:manage', 'roles:manage', 'audit:read', 'audit:export'],
  },
  {
    id: 'user_service',
    username: 'service_acc',
    email: 'service@bank.com',
    roleId: 'role_service_account',
    roleName: 'ServiceAccount',
    permissions: ['cases:read'],
  },
];

class MockApi implements Api {
  private currentUser: SeedUser | null = null;
  private cases: FraudCaseDTO[] = [];
  private reveals: RevealRequestDTO[] = [];
  private auditLogs: AuditLogDTO[] = [];

  constructor() {
    this.resetData();
  }

  private resetData() {
    this.cases = [
      {
        id: 'case_1',
        transaction_id: 'txn_101',
        assigned_to: 'user_analyst',
        status: 'OPEN',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        transaction: {
          id: 'txn_101',
          sender_token_id: 'tok_subj_1',
          receiver_token_id: 'tok_acc_1',
          amount: '230968.00',
          txn_time: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        findings: [
          {
            id: 'af_1',
            case_id: 'case_1',
            agent_type: 'KYC_AGENT',
            confidence_score: '0.95',
            summary: 'Matches RBI High-Risk Watchlist entry for PERSON_001.',
          },
          {
            id: 'af_1_graph',
            case_id: 'case_1',
            agent_type: 'GRAPH_AGENT',
            confidence_score: '0.80',
            summary: 'Detected 3 linked token entities forming suspicious cluster.',
          },
          {
            id: 'af_2',
            case_id: 'case_1',
            agent_type: 'PATTERN_AGENT',
            confidence_score: '0.88',
            summary: 'High value transfer to new recipient from unusual device.',
          },
          {
            id: 'af_3',
            case_id: 'case_1',
            agent_type: 'BEHAVIORAL_AGENT',
            confidence_score: '0.85',
            summary: 'FLAGGED - unusual transaction pattern, 5 failed login attempts and after hours access.',
          },
        ],
        verdict: {
          id: 'verd_1',
          case_id: 'case_1',
          risk_level: 'HIGH',
          summary: 'Composite Risk Score: 90/100 (HIGH). Multiple signals: Pattern Flag + KYC Match + Behavioral Anomaly + Graph Ring.',
        },
      },
      {
        id: 'case_2',
        transaction_id: 'txn_102',
        assigned_to: 'user_analyst',
        status: 'OPEN',
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        transaction: {
          id: 'txn_102',
          sender_token_id: 'tok_subj_2',
          receiver_token_id: 'tok_acc_2',
          amount: '178582.00',
          txn_time: new Date(Date.now() - 3600000 * 12).toISOString(),
        },
        findings: [
          {
            id: 'af_2_geo',
            case_id: 'case_2',
            agent_type: 'BEHAVIORAL_AGENT',
            confidence_score: '0.65',
            summary: 'Geographic jump detected from LOCATION_001 without prior device authentication.',
          },
        ],
        verdict: {
          id: 'verd_2',
          case_id: 'case_2',
          risk_level: 'MEDIUM',
          summary: 'Composite Risk Score: 30/100 (MEDIUM). Geolocation deviation flagged for review.',
        },
      },
      {
        id: 'case_3',
        transaction_id: 'txn_103',
        assigned_to: 'user_investigator',
        status: 'OPEN',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        transaction: {
          id: 'txn_103',
          sender_token_id: 'tok_subj_3',
          receiver_token_id: 'tok_acc_3',
          amount: '174829.00',
          txn_time: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
        findings: [],
        verdict: {
          id: 'verd_3',
          case_id: 'case_3',
          risk_level: 'LOW',
          summary: 'Composite Risk Score: 0/100 (LOW). Standard verified transaction pattern.',
        },
      },
    ];

    this.reveals = [];

    // Genesis audit log
    const genesisTime = new Date(Date.now() - 3600000 * 48).toISOString();
    const genesisPrev = '0000000000000000000000000000000000000000000000000000000000000000';
    const genesisHash = this.computeSha256(
      `${genesisPrev}|${genesisTime}|user_admin|SYSTEM_INIT|DATABASE_GENESIS`
    );

    this.auditLogs = [
      {
        id: 'log_genesis',
        actor_id: 'user_admin',
        action_type: 'SYSTEM_INIT',
        target_id: 'DATABASE_GENESIS',
        prev_hash: genesisPrev,
        hash: genesisHash,
        created_at: genesisTime,
      },
    ];
  }

  private computeSha256(text: string): string {
    // Deterministic pseudo-sha256 hex string for in-memory mock testing
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < text.length; i++) {
      const ch = text.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
    const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
    const part3 = (Math.imul(h1, 31) >>> 0).toString(16).padStart(8, '0');
    const part4 = (Math.imul(h2, 37) >>> 0).toString(16).padStart(8, '0');
    return `${part1}${part2}${part3}${part4}${part1}${part2}${part3}${part4}`;
  }

  private appendAuditLog(actorId: string, actionType: string, targetId: string | null): AuditLogDTO {
    const prevLog = this.auditLogs[this.auditLogs.length - 1];
    const prevHash = prevLog ? prevLog.hash : '0000000000000000000000000000000000000000000000000000000000000000';
    const createdAt = new Date().toISOString();
    const payload = `${prevHash}|${createdAt}|${actorId}|${actionType}|${targetId || ''}`;
    const hash = this.computeSha256(payload);

    const log: AuditLogDTO = {
      id: `log_${Math.random().toString(16).substring(2, 10)}`,
      actor_id: actorId,
      action_type: actionType,
      target_id: targetId,
      prev_hash: prevHash,
      hash,
      created_at: createdAt,
    };
    this.auditLogs.push(log);
    return log;
  }

  private checkAuth(): SeedUser {
    if (!this.currentUser) {
      throw new ApiError(401, 'Could not validate credentials');
    }
    return this.currentUser;
  }

  private checkPermission(permission: string): SeedUser {
    const user = this.checkAuth();
    if (!user.permissions.includes(permission)) {
      throw new ApiError(
        403,
        `Permission Denied. Required permission '${permission}' is missing for role '${user.roleName}'.`
      );
    }
    return user;
  }

  async login(email: string, password: string): Promise<Token> {
    if (password !== 'password123') {
      throw new ApiError(401, 'Incorrect email/username or password');
    }
    const found = SEEDED_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      throw new ApiError(401, 'Incorrect email/username or password');
    }

    this.currentUser = found;
    this.appendAuditLog(found.id, 'LOGIN', found.id);

    return {
      access_token: `mock_jwt_token_${found.id}`,
      token_type: 'bearer',
      user_id: found.id,
      username: found.username,
      role: found.roleName,
      permissions: found.permissions,
    };
  }

  async logout(): Promise<void> {
    this.currentUser = null;
  }

  async getCurrentUser(): Promise<UserDTO> {
    const u = this.checkAuth();
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      role_id: u.roleId,
      role_name: u.roleName,
      permissions: u.permissions,
      created_at: new Date(Date.now() - 3600000 * 100).toISOString(),
    };
  }

  async listCases(status?: string): Promise<FraudCaseDTO[]> {
    this.checkPermission('cases:read');
    if (!status) return [...this.cases];
    return this.cases.filter((c) => c.status.toUpperCase() === status.toUpperCase());
  }

  async getCase(id: string): Promise<FraudCaseDTO> {
    this.checkPermission('cases:read');
    const c = this.cases.find((item) => item.id === id);
    if (!c) {
      throw new ApiError(404, 'Fraud case not found');
    }
    return { ...c };
  }

  async overrideCase(id: string, level: string, reason: string): Promise<VerdictDTO> {
    const user = this.checkPermission('cases:override');
    const c = this.cases.find((item) => item.id === id);
    if (!c) {
      throw new ApiError(404, 'Fraud case not found');
    }

    c.status = 'OVERRIDDEN';
    const newVerdict: VerdictDTO = {
      id: `verd_ovr_${c.id}`,
      case_id: c.id,
      risk_level: level.toUpperCase() as FraudCaseDTO['verdict'] extends null ? never : any,
      summary: `[ANALYST OVERRIDE by ${user.username}] ${reason}`,
    };
    c.verdict = newVerdict;

    this.appendAuditLog(user.id, 'VERDICT_OVERRIDE', c.id);
    return newVerdict;
  }

  async submitReveal(caseId: string, reason: string): Promise<RevealRequestDTO> {
    const user = this.checkPermission('reveal:request');
    if (!reason || !reason.trim()) {
      throw new ApiError(400, "The 'reason' field in the request body cannot be empty.");
    }

    const c = this.cases.find((item) => item.id === caseId);
    if (!c) {
      throw new ApiError(404, `Fraud case '${caseId}' not found.`);
    }

    const req: RevealRequestDTO = {
      id: `rev_req_${Math.random().toString(16).substring(2, 10)}`,
      case_id: c.id,
      requested_by: user.id,
      reason: reason.trim(),
      status: 'PENDING',
      approved_by: null,
      revealed_at: null,
    };
    this.reveals.push(req);
    this.appendAuditLog(user.id, 'REVEAL_REQUEST_SUBMITTED', req.id);
    return req;
  }

  async listReveals(status?: string): Promise<RevealRequestDTO[]> {
    this.checkPermission('cases:read');
    if (!status) return [...this.reveals];
    return this.reveals.filter((r) => r.status.toUpperCase() === status.toUpperCase());
  }

  async approveReveal(id: string): Promise<RevealApprovalResponse> {
    const user = this.checkPermission('reveal:approve');

    if (user.roleName === 'Admin') {
      throw new ApiError(
        403,
        'Security Violation: System Admin role is explicitly prohibited from approving identity reveal requests (Separation of Duties).'
      );
    }

    const req = this.reveals.find((r) => r.id === id);
    if (!req) {
      throw new ApiError(404, `Reveal request '${id}' not found.`);
    }

    if (req.status !== 'PENDING') {
      throw new ApiError(400, `Cannot approve reveal request with status '${req.status}'. Must be PENDING.`);
    }

    if (req.requested_by === user.id) {
      throw new ApiError(400, 'Security Violation: Investigators cannot approve their own identity reveal requests.');
    }

    const linkedCase = this.cases.find((c) => c.id === req.case_id);
    const senderToken = linkedCase?.transaction?.sender_token_id || 'tok_subj_1';
    const receiverToken = linkedCase?.transaction?.receiver_token_id || 'tok_acc_1';

    const senderReal = SEEDED_VAULT[senderToken]?.realValue || 'Decrypted Entity';
    const receiverReal = SEEDED_VAULT[receiverToken]?.realValue || 'Decrypted Account';

    req.status = 'APPROVED';
    req.approved_by = user.id;
    req.revealed_at = new Date().toISOString();

    const audit = this.appendAuditLog(user.id, 'REVEAL_APPROVED', req.id);

    return {
      request_id: req.id,
      case_id: req.case_id,
      status: 'APPROVED',
      approved_by: `${user.username} (${user.roleName})`,
      sender_real_value: senderReal,
      receiver_real_value: receiverReal,
      audit_log_id: audit.id,
      hash: audit.hash,
    };
  }

  async denyReveal(id: string): Promise<RevealRequestDTO> {
    const user = this.checkPermission('reveal:approve');
    const req = this.reveals.find((r) => r.id === id);
    if (!req) {
      throw new ApiError(404, `Reveal request '${id}' not found.`);
    }

    if (req.status !== 'PENDING') {
      throw new ApiError(400, `Cannot deny reveal request with status '${req.status}'. Must be PENDING.`);
    }

    req.status = 'DENIED';
    req.approved_by = user.id;
    req.revealed_at = new Date().toISOString();

    this.appendAuditLog(user.id, 'REVEAL_DENIED', req.id);
    return { ...req };
  }

  async listAudit(): Promise<AuditLogDTO[]> {
    this.checkPermission('audit:read');
    return [...this.auditLogs].reverse();
  }

  async verifyAudit(): Promise<HashVerificationResponse> {
    this.checkPermission('audit:read');
    let expectedPrev = '0000000000000000000000000000000000000000000000000000000000000000';

    for (const log of this.auditLogs) {
      if (log.prev_hash !== expectedPrev) {
        return {
          total_logs: this.auditLogs.length,
          is_valid: false,
          tampered_log_id: log.id,
          message: `Hash chain broken at log ID ${log.id}: prev_hash mismatch.`,
        };
      }
      const recalculated = this.computeSha256(
        `${log.prev_hash}|${log.created_at}|${log.actor_id}|${log.action_type}|${log.target_id || ''}`
      );
      if (log.hash !== recalculated) {
        return {
          total_logs: this.auditLogs.length,
          is_valid: false,
          tampered_log_id: log.id,
          message: `Log entry tampered at log ID ${log.id}: hash mismatch.`,
        };
      }
      expectedPrev = log.hash;
    }

    return {
      total_logs: this.auditLogs.length,
      is_valid: true,
      tampered_log_id: null,
      message: 'Cryptographic SHA-256 hash chain is valid and untampered.',
    };
  }

  async downloadReport(format: 'pdf' | 'csv'): Promise<Blob> {
    this.checkPermission('audit:export');
    if (format === 'csv') {
      const header = 'ID,Timestamp (ISO),Actor ID,Action Type,Target ID,Previous Hash,Current Hash\n';
      const rows = this.auditLogs
        .map(
          (l) => `${l.id},${l.created_at},${l.actor_id},${l.action_type},${l.target_id || ''},${l.prev_hash},${l.hash}`
        )
        .join('\n');
      return new Blob([header + rows], { type: 'text/csv' });
    }
    return new Blob(['%PDF-1.4 Mock Compliance Audit Trail Report'], { type: 'application/pdf' });
  }
}

export const mockApi = new MockApi();

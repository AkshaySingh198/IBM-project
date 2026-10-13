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
import { mockApi } from './mock';

// In-memory token storage ONLY (Never localStorage/sessionStorage/cookies)
let inMemoryJwtToken: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  inMemoryJwtToken = token;
}

export function getAuthToken(): string | null {
  return inMemoryJwtToken;
}

export function setOnUnauthorized(callback: () => void) {
  onUnauthorizedCallback = callback;
}

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = `${rawApiUrl.replace(/\/+$/, '')}/api/v1`;

class RealApiClient implements Api {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (inMemoryJwtToken) {
      headers['Authorization'] = `Bearer ${inMemoryJwtToken}`;
    }

    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const url = `${API_BASE}${endpoint}`;

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (err: unknown) {
      throw new ApiError(0, `Network error: ${(err as Error).message || 'Failed to fetch'}`);
    }

    if (response.status === 401) {
      // Clear memory token immediately on 401
      inMemoryJwtToken = null;
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    if (!response.ok) {
      let detailMsg = `Request failed with status ${response.status}`;
      let detailData: unknown = null;
      try {
        const errJson = await response.json();
        detailData = errJson;
        if (errJson && typeof errJson.detail === 'string') {
          detailMsg = errJson.detail;
        } else if (errJson && Array.isArray(errJson.detail)) {
          // Pydantic validation error array
          detailMsg = errJson.detail.map((e: { msg?: string }) => e.msg || 'Invalid field').join(', ');
        }
      } catch {
        // Response was not JSON
      }
      throw new ApiError(response.status, detailMsg, detailData);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<Token> {
    const data = await this.request<Token>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.access_token);
    return data;
  }

  async logout(): Promise<void> {
    setAuthToken(null);
  }

  async getCurrentUser(): Promise<UserDTO> {
    return this.request<UserDTO>('/auth/me', {
      method: 'GET',
    });
  }

  async listCases(status?: string): Promise<FraudCaseDTO[]> {
    const query = status ? `?status_filter=${encodeURIComponent(status)}` : '';
    return this.request<FraudCaseDTO[]>(`/cases${query}`, {
      method: 'GET',
    });
  }

  async getCase(id: string): Promise<FraudCaseDTO> {
    return this.request<FraudCaseDTO>(`/cases/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
  }

  async overrideCase(id: string, level: string, reason: string): Promise<VerdictDTO> {
    return this.request<VerdictDTO>(`/cases/${encodeURIComponent(id)}/override`, {
      method: 'POST',
      body: JSON.stringify({
        override_risk_level: level,
        reason,
      }),
    });
  }

  async submitReveal(caseId: string, reason: string): Promise<RevealRequestDTO> {
    return this.request<RevealRequestDTO>(`/cases/${encodeURIComponent(caseId)}/reveal-requests`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async listReveals(status?: string): Promise<RevealRequestDTO[]> {
    const query = status ? `?status_filter=${encodeURIComponent(status)}` : '';
    return this.request<RevealRequestDTO[]>(`/reveal-requests${query}`, {
      method: 'GET',
    });
  }

  async approveReveal(id: string): Promise<RevealApprovalResponse> {
    return this.request<RevealApprovalResponse>(`/reveal-requests/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
    });
  }

  async denyReveal(id: string): Promise<RevealRequestDTO> {
    return this.request<RevealRequestDTO>(`/reveal-requests/${encodeURIComponent(id)}/deny`, {
      method: 'POST',
    });
  }

  async listAudit(): Promise<AuditLogDTO[]> {
    return this.request<AuditLogDTO[]>('/audit-logs', {
      method: 'GET',
    });
  }

  async verifyAudit(): Promise<HashVerificationResponse> {
    return this.request<HashVerificationResponse>('/audit-logs/verify', {
      method: 'GET',
    });
  }

  async downloadReport(format: 'pdf' | 'csv'): Promise<Blob> {
    const headers: Record<string, string> = {};
    if (inMemoryJwtToken) {
      headers['Authorization'] = `Bearer ${inMemoryJwtToken}`;
    }

    const response = await fetch(`${API_BASE}/reports/compliance?format=${format}`, {
      method: 'GET',
      headers,
    });

    if (response.status === 401) {
      inMemoryJwtToken = null;
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    if (!response.ok) {
      let detailMsg = `Failed to download report (status ${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson.detail) detailMsg = errJson.detail;
      } catch {
        // ignore
      }
      throw new ApiError(response.status, detailMsg);
    }

    return response.blob();
  }
}

const isMockEnabled = import.meta.env.VITE_USE_MOCK === 'true';

export const realApi = new RealApiClient();
export const api: Api = isMockEnabled ? mockApi : realApi;

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Token, UserDTO } from '../api/types';
import { api, setAuthToken, setOnUnauthorized } from '../api/client';

export interface RevealedIdentity {
  caseId: string;
  senderRealValue: string;
  receiverRealValue: string;
  approvedBy: string;
  auditLogId: string;
  hash: string;
  revealedAt: string;
}

interface AuthContextType {
  user: UserDTO | null;
  tokenInfo: Token | null;
  permissions: string[];
  isAuthenticated: boolean;
  sessionExpired: boolean;
  revealedIdentities: Record<string, RevealedIdentity>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearSessionExpired: () => void;
  hasPermission: (permission: string) => boolean;
  recordRevealedIdentity: (identity: RevealedIdentity) => void;
  getRevealedIdentity: (caseId: string) => RevealedIdentity | null;
  revealedCount: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // All state stored in React memory only - never persisted to storage
  const [user, setUser] = useState<UserDTO | null>(null);
  const [tokenInfo, setTokenInfo] = useState<Token | null>(null);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const [revealedIdentities, setRevealedIdentities] = useState<Record<string, RevealedIdentity>>({});

  const clearSession = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setTokenInfo(null);
    setRevealedIdentities({});
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearSession();
    setSessionExpired(true);
  }, [clearSession]);

  useEffect(() => {
    setOnUnauthorized(handleUnauthorized);
  }, [handleUnauthorized]);

  const login = useCallback(async (email: string, password: string) => {
    setSessionExpired(false);
    const token = await api.login(email, password);
    setTokenInfo(token);
    setUser({
      id: token.user_id,
      username: token.username,
      email,
      role_id: `role_${token.role.toLowerCase()}`,
      role_name: token.role,
      permissions: token.permissions,
      created_at: new Date().toISOString(),
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Ignore errors on logout
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!tokenInfo?.permissions) return false;
      return tokenInfo.permissions.includes(permission);
    },
    [tokenInfo]
  );

  const recordRevealedIdentity = useCallback((identity: RevealedIdentity) => {
    setRevealedIdentities((prev) => ({
      ...prev,
      [identity.caseId]: identity,
    }));
  }, []);

  const getRevealedIdentity = useCallback(
    (caseId: string): RevealedIdentity | null => {
      return revealedIdentities[caseId] || null;
    },
    [revealedIdentities]
  );

  const revealedCount = useMemo(() => {
    return Object.keys(revealedIdentities).length;
  }, [revealedIdentities]);

  const permissions = useMemo(() => {
    return tokenInfo?.permissions || [];
  }, [tokenInfo]);

  const value = useMemo(
    () => ({
      user,
      tokenInfo,
      permissions,
      isAuthenticated: !!tokenInfo,
      sessionExpired,
      revealedIdentities,
      login,
      logout,
      clearSessionExpired,
      hasPermission,
      recordRevealedIdentity,
      getRevealedIdentity,
      revealedCount,
    }),
    [
      user,
      tokenInfo,
      permissions,
      sessionExpired,
      revealedIdentities,
      login,
      logout,
      clearSessionExpired,
      hasPermission,
      recordRevealedIdentity,
      getRevealedIdentity,
      revealedCount,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// oxlint-disable-next-line react/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

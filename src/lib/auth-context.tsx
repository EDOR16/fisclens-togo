/**
 * Store auth côté client — gère session, token, tenantId courant et mode expert.
 * Pas de Zustand pour garder les dépendances minimales — Context React simple.
 */
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Role = "GERANT" | "COMPTABLE" | "LECTURE" | "CABINET" | "ADMIN_SYS";

export type TenantSummary = {
  id: string;
  name: string;
  regime: string;
  exerciceOuvert: boolean;
};

export type SessionUser = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  tenantIds: string[];
  tenants: TenantSummary[];
  require2fa: boolean;
};

type AuthState = {
  user: SessionUser | null;
  currentTenantId: string | null;
  /** Mode expert = vocabulaire comptable (cabinet) vs vulgarisé (gérant) */
  expertMode: boolean;
  isLoading: boolean;
};

type AuthActions = {
  login: (token: string, tenantId: string) => Promise<void>;
  logout: () => void;
  switchTenant: (tenantId: string) => void;
  toggleExpertMode: () => void;
  refreshSession: () => Promise<void>;
};

type AuthContextValue = AuthState & AuthActions;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    currentTenantId: null,
    expertMode: false,
    isLoading: true,
  });

  const refreshSession = useCallback(async () => {
    const token = localStorage.getItem("fl_token");
    if (!token) {
      setState((s) => ({ ...s, user: null, isLoading: false }));
      return;
    }
    try {
      const user = await api.get<SessionUser>("/auth/me");
      const storedTenant = localStorage.getItem("fl_tenant_id");
      const tenantId =
        storedTenant && user.tenantIds.includes(storedTenant)
          ? storedTenant
          : (user.tenantIds[0] ?? null);
      setState((s) => ({ ...s, user, currentTenantId: tenantId, isLoading: false }));
    } catch {
      localStorage.removeItem("fl_token");
      localStorage.removeItem("fl_tenant_id");
      setState((s) => ({ ...s, user: null, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    void refreshSession();
    // Lire le mode expert sauvegardé
    const stored = localStorage.getItem("fl_expert_mode");
    if (stored === "true") {
      setState((s) => ({ ...s, expertMode: true }));
    }
  }, [refreshSession]);

  const login = useCallback(async (token: string, tenantId: string) => {
    localStorage.setItem("fl_token", token);
    localStorage.setItem("fl_tenant_id", tenantId);
    // Stocker aussi dans un cookie pour que le middleware Next.js puisse lire le token
    // (localStorage n'est pas accessible côté serveur/Edge)
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `fl_token=${token}; path=/; expires=${expires}; SameSite=Lax`;
    document.cookie = `fl_tenant_id=${tenantId}; path=/; expires=${expires}; SameSite=Lax`;
    await refreshSession();
  }, [refreshSession]);

  const logout = useCallback(() => {
    localStorage.removeItem("fl_token");
    localStorage.removeItem("fl_tenant_id");
    // Supprimer aussi les cookies
    document.cookie = "fl_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "fl_tenant_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    setState({ user: null, currentTenantId: null, expertMode: false, isLoading: false });
  }, []);

  const switchTenant = useCallback((tenantId: string) => {
    localStorage.setItem("fl_tenant_id", tenantId);
    setState((s) => ({ ...s, currentTenantId: tenantId }));
  }, []);

  const toggleExpertMode = useCallback(() => {
    setState((s) => {
      const next = !s.expertMode;
      localStorage.setItem("fl_expert_mode", String(next));
      return { ...s, expertMode: next };
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, logout, switchTenant, toggleExpertMode, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Vérifie si le rôle courant fait partie d'une liste de rôles autorisés */
export function useHasRole(...roles: Role[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return roles.includes(user.role);
}

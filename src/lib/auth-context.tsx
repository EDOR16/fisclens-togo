"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Role = "GERANT" | "COMPTABLE" | "LECTURE" | "CABINET" | "ADMIN_SYS";

export type SubscriptionPlan = "STARTER" | "PRO" | "PREMIUM";

export type TenantSummary = {
  id: string;
  name: string;
  regime: string;
  exerciceOuvert: boolean;
  plan: SubscriptionPlan;
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
      setState((s) => ({ ...s, user: null, currentTenantId: null, isLoading: false }));
      return;
    }

    try {
      // Correction URL API : /api/v1/auth/me
      const user = await api.get<SessionUser>("/api/v1/auth/me");

      const storedTenant = localStorage.getItem("fl_tenant_id");
      const tenantId =
        storedTenant && user.tenantIds.includes(storedTenant)
          ? storedTenant
          : user.tenantIds[0] ?? null;

      if (tenantId) {
        localStorage.setItem("fl_tenant_id", tenantId);
      }

      setState((s) => ({ ...s, user, currentTenantId: tenantId, isLoading: false }));
    } catch {
      localStorage.removeItem("fl_token");
      localStorage.removeItem("fl_tenant_id");
      
      document.cookie = "fl_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      document.cookie = "fl_tenant_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";

      setState((s) => ({ ...s, user: null, currentTenantId: null, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    void refreshSession();
    const stored = localStorage.getItem("fl_expert_mode");
    if (stored === "true") {
      setState((s) => ({ ...s, expertMode: true }));
    }
  }, [refreshSession]);

  const login = useCallback(
    async (token: string, tenantId: string) => {
      localStorage.setItem("fl_token", token);
      localStorage.setItem("fl_tenant_id", tenantId);

      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `fl_token=${token}; path=/; expires=${expires}; SameSite=Lax`;
      document.cookie = `fl_tenant_id=${tenantId}; path=/; expires=${expires}; SameSite=Lax`;

      await refreshSession();
    },
    [refreshSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("fl_token");
    localStorage.removeItem("fl_tenant_id");
    localStorage.removeItem("fl_expert_mode");

    document.cookie = "fl_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "fl_tenant_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";

    setState({ user: null, currentTenantId: null, expertMode: false, isLoading: false });
  }, []);

  const switchTenant = useCallback((tenantId: string) => {
    localStorage.setItem("fl_tenant_id", tenantId);
    
    const token = localStorage.getItem("fl_token");
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    if (token) {
        document.cookie = `fl_token=${token}; path=/; expires=${expires}; SameSite=Lax`;
    }
    document.cookie = `fl_tenant_id=${tenantId}; path=/; expires=${expires}; SameSite=Lax`;

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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function useHasRole(...roles: Role[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return roles.includes(user.role);
}
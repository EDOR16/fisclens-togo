"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, RefreshCw, Search, ShieldCheck, Shield,
  Key, Loader2, CheckCircle2, XCircle, Building2
} from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

type UserEntry = {
  id: string;
  name: string;
  email: string;
  authProvider: string;
  require2fa: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  primaryRole: string;
  primaryTenant: string;
  tenants: Array<{ id: string; name: string; role: string }>;
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  ADMIN_SYS:  { bg: "#FEF3C7", text: "#92400E" },
  GERANT:     { bg: "#D1FAE5", text: "#065F46" },
  COMPTABLE:  { bg: "#DBEAFE", text: "#1E40AF" },
  CABINET:    { bg: "#EDE9FE", text: "#4C1D95" },
  LECTURE:    { bg: "#F3F4F6", text: "#374151" },
};

export function AdminUsers() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await api.get<{ users: UserEntry[]; total: number }>(
        `/api/v1/admin/users?${params.toString()}`
      );
      setUsers(res.users);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const runAction = async (userId: string, action: string, label: string) => {
    setActionLoading(`${userId}-${action}`);
    try {
      await api.patch("/api/v1/admin/users", { userId, action });
      setToast({ msg: `✓ ${label} effectué`, ok: true });
      await fetchUsers();
    } catch {
      setToast({ msg: `✗ Erreur lors de ${label}`, ok: false });
    } finally {
      setActionLoading(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Stats rapides
  const superAdmins = users.filter((u) => u.isSuperAdmin).length;
  const with2fa = users.filter((u) => u.require2fa).length;
  const withGoogle = users.filter((u) => u.authProvider === "GOOGLE").length;

  return (
    <div
      className="space-y-6 p-3 sm:p-5 md:p-6"
      style={{
        background: "#F5F0E4",
        backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #E6DEC8 31px, #E6DEC8 32px)",
        minHeight: "100%",
      }}
    >
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="stamp-badge" style={{ borderColor: "#157A46", color: "#157A46", fontSize: "0.6rem" }}>
              SuperAdmin
            </span>
            <h2
              className="chapter-heading text-xl sm:text-2xl"
              style={{ fontFamily: "var(--font-hand), cursive", color: "#0B3D2E" }}
            >
              Gestion des Utilisateurs
            </h2>
          </div>
          <p className="font-mono text-[11px] text-[#33604C] tracking-widest uppercase">
            {total} utilisateur(s) · {superAdmins} superadmin · {with2fa} avec 2FA · {withGoogle} via Google
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
          disabled={loading}
          className="bg-white/80 border-[#C8BEA8] text-[#0B3D2E] hover:bg-white text-xs self-start"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      {/* Compteurs rapides */}
      <div className="grid grid-cols-3 gap-3">
        <div className="receipt shadow-sm" style={{ borderTop: "3px solid #157A46", borderRadius: "6px", padding: "1rem", background: "#FAF7EE" }}>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#157A46]">Total</p>
          <div className="text-2xl font-bold font-mono text-[#0B3D2E] mt-1">{total}</div>
          <p className="text-[11px] font-mono text-[#33604C] mt-0.5">Comptes actifs</p>
        </div>
        <div className="receipt shadow-sm" style={{ borderTop: "3px solid #D97706", borderRadius: "6px", padding: "1rem", background: "#FAF7EE" }}>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#D97706]">2FA activée</p>
          <div className="text-2xl font-bold font-mono text-[#0B3D2E] mt-1">{with2fa}</div>
          <p className="text-[11px] font-mono text-[#33604C] mt-0.5">
            {total > 0 ? Math.round((with2fa / total) * 100) : 0}% des users
          </p>
        </div>
        <div className="receipt shadow-sm" style={{ borderTop: "3px solid #2563EB", borderRadius: "6px", padding: "1rem", background: "#FAF7EE" }}>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#2563EB]">Google SSO</p>
          <div className="text-2xl font-bold font-mono text-[#0B3D2E] mt-1">{withGoogle}</div>
          <p className="text-[11px] font-mono text-[#33604C] mt-0.5">via OAuth</p>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-mono flex items-center gap-2",
            toast.ok ? "bg-[#0B3D2E] text-white" : "bg-[#B3261E] text-white"
          )}
        >
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#33604C]" />
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs font-mono rounded border border-[#C8BEA8] bg-white/80 focus:outline-none focus:ring-1 focus:ring-[#157A46]"
        />
      </div>

      {/* Tableau */}
      <div className="receipt shadow-sm" style={{ borderRadius: "6px", padding: 0, background: "#FAF7EE" }}>
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ background: "#0B3D2E", borderRadius: "5px 5px 0 0" }}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#FCD116]" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#FBF7EC]">
              Liste des Utilisateurs
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#BFD8CC]">
            {loading ? "..." : `${users.length} résultat(s)`}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs font-mono">Chargement...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-[#B3261E] font-mono text-[10px] uppercase tracking-wider text-[#33604C]">
                  <th className="py-2 px-4">Utilisateur</th>
                  <th className="py-2 px-3">Rôle</th>
                  <th className="py-2 px-3">Dossier(s)</th>
                  <th className="py-2 px-3 text-center">Auth</th>
                  <th className="py-2 px-3 text-center">2FA</th>
                  <th className="py-2 px-3">Créé le</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE8D9]">
                {users.map((u) => {
                  const roleCol = ROLE_COLORS[u.primaryRole] || ROLE_COLORS["LECTURE"];
                  const isActioning2fa = actionLoading === `${u.id}-disable_2fa`;
                  return (
                    <tr key={u.id} className="hover:bg-black/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-sm text-[#0B3D2E] flex items-center gap-1.5">
                          {u.isSuperAdmin && <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />}
                          {u.name}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded border"
                          style={{ background: roleCol.bg, color: roleCol.text, borderColor: roleCol.bg }}
                        >
                          {u.primaryRole}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {u.tenants.length === 0 ? (
                          <span className="text-[11px] font-mono text-muted-foreground">Sans dossier</span>
                        ) : u.tenants.length === 1 ? (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-[#0B3D2E]">
                            <Building2 className="h-3 w-3 text-[#33604C]" />
                            {u.tenants[0].name}
                          </div>
                        ) : (
                          <div className="text-[11px] font-mono text-[#33604C]">
                            {u.tenants.length} dossiers
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={cn(
                          "text-[10px] font-mono px-1.5 py-0.5 rounded",
                          u.authProvider === "GOOGLE"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-50 text-gray-600"
                        )}>
                          {u.authProvider}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {u.require2fa ? (
                          <Shield className="h-4 w-4 text-emerald-600 mx-auto" />
                        ) : (
                          <span className="text-[10px] font-mono text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#33604C]">
                        {formatDate(new Date(u.createdAt))}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {u.require2fa && !u.isSuperAdmin && (
                            <button
                              onClick={() => runAction(u.id, "disable_2fa", "Désactivation 2FA")}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded border border-[#C8BEA8] bg-white hover:bg-amber-50 hover:border-amber-300 transition-colors text-[#33604C] disabled:opacity-50"
                              title="Désactiver la 2FA (support)"
                            >
                              {isActioning2fa ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Key className="h-3 w-3" />
                              )}
                              Reset 2FA
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2" style={{ opacity: 0.35 }}>
        <div className="stamp-badge" style={{ borderColor: "#157A46", color: "#157A46", fontSize: "0.55rem" }}>
          FiscLens Admin · Contrôle des Accès
        </div>
      </div>
    </div>
  );
}

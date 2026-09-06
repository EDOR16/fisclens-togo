"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2, Users, ShieldCheck, FileSpreadsheet, RefreshCw,
  ExternalLink, CheckCircle2, AlertTriangle, ArrowRight,
  Settings, Lock, Eye, Activity, Calendar
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/lib/utils";
import { cn } from "@/lib/utils";

type AdminStatsResponse = {
  platformStats: {
    totalTenants: number;
    totalUsers: number;
    totalEcritures: number;
    totalVolumeMouvements: number;
  };
  tenants: Array<{
    id: string;
    name: string;
    regime: string;
    nif: string;
    city: string;
    formeJuridique: string;
    exerciceOuvert: boolean;
    userCount: number;
    ecritureCount: number;
    createdAt: string;
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    tenantName: string;
    tenantId: string;
    createdAt: string;
  }>;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    userEmail: string;
    timestamp: string;
    metadata: string | null;
  }>;
};

export function AdminDashboard() {
  const { currentTenantId, switchTenant } = useAuth();
  const [data, setData] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<AdminStatsResponse>("/api/v1/admin/dashboard-stats");
      setData(res);
    } catch (e) {
      console.error("Erreur chargement stats admin:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  const stats = data?.platformStats;
  const tenants = data?.tenants || [];
  const recentUsers = data?.recentUsers || [];

  return (
    <div
      className="space-y-6 sm:space-y-8 p-3 sm:p-5 md:p-6"
      style={{
        background: "#F5F0E4",
        backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #E6DEC8 31px, #E6DEC8 32px)",
        minHeight: "100%",
      }}
    >
      {/* ── En-tête SuperAdmin ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="stamp-badge" style={{ borderColor: "#157A46", color: "#157A46", fontSize: "0.6rem" }}>
              SuperAdmin
            </span>
            <h2
              className="chapter-heading text-xl sm:text-2xl"
              style={{ fontFamily: "var(--font-hand), cursive", color: "#0B3D2E" }}
            >
              Supervision Plateforme FiscLens
            </h2>
          </div>
          <p className="font-mono text-[11px] text-[#33604C] tracking-widest uppercase">
            Espace Administrateur Système · Multi-Entreprises & Sécurité
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAdminStats}
            disabled={loading}
            className="bg-white/80 border-[#C8BEA8] text-[#0B3D2E] hover:bg-white text-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
            Actualiser
          </Button>

          <Link href="/parametres/parametres-fiscaux">
            <Button size="sm" className="bg-[#0B3D2E] hover:bg-[#157A46] text-white text-xs">
              <Settings className="h-4 w-4 mr-1.5" />
              Paramètres Fiscaux OTR
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 4 Cartes Métriques Plateforme ── */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Entreprises */}
        <div
          className="receipt shadow-sm"
          style={{
            borderTop: "3px solid #157A46",
            borderRadius: "6px",
            padding: "1.25rem",
            background: "#FAF7EE",
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#157A46]">
              Entreprises Clientes
            </p>
            <Building2 className="h-4 w-4 text-[#157A46]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#0B3D2E]">
            {loading && !data ? "..." : stats?.totalTenants ?? 0}
          </div>
          <p className="mt-1 text-xs text-[#33604C] font-mono">
            {stats?.totalTenants ? `${stats.totalTenants} dossier(s) actif(s)` : "Aucune entreprise"}
          </p>
        </div>

        {/* Utilisateurs */}
        <div
          className="receipt shadow-sm"
          style={{
            borderTop: "3px solid #2563EB",
            borderRadius: "6px",
            padding: "1.25rem",
            background: "#FAF7EE",
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#2563EB]">
              Utilisateurs Inscrits
            </p>
            <Users className="h-4 w-4 text-[#2563EB]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#0B3D2E]">
            {loading && !data ? "..." : stats?.totalUsers ?? 0}
          </div>
          <p className="mt-1 text-xs text-[#33604C] font-mono">
            Gérants, comptables & auditeurs
          </p>
        </div>

        {/* Écritures SYSCOHADA */}
        <div
          className="receipt shadow-sm"
          style={{
            borderTop: "3px solid #D97706",
            borderRadius: "6px",
            padding: "1.25rem",
            background: "#FAF7EE",
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#D97706]">
              Écritures SYSCOHADA
            </p>
            <FileSpreadsheet className="h-4 w-4 text-[#D97706]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#0B3D2E]">
            {loading && !data ? "..." : stats?.totalEcritures ?? 0}
          </div>
          <p className="mt-1 text-xs text-[#33604C] font-mono">
            Vol. : {formatFcfa(stats?.totalVolumeMouvements ?? 0)}
          </p>
        </div>

        {/* Sécurité & Intégrité */}
        <div
          className="receipt shadow-sm"
          style={{
            borderTop: "3px solid #0B3D2E",
            borderRadius: "6px",
            padding: "1.25rem",
            background: "#FAF7EE",
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#0B3D2E]">
              Intégrité Système
            </p>
            <ShieldCheck className="h-4 w-4 text-[#157A46]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#157A46] flex items-center gap-1.5 mt-1">
            <CheckCircle2 className="h-5 w-5" /> Opérationnel
          </div>
          <p className="mt-1 text-xs text-[#33604C] font-mono">
            Multi-Tenant strict & isolation DB
          </p>
        </div>
      </div>

      {/* ── Supervision des Dossiers Entreprises (Clients) ── */}
      <div className="receipt shadow-sm" style={{ borderRadius: "6px", padding: 0, background: "#FAF7EE" }}>
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ background: "#0B3D2E", borderRadius: "5px 5px 0 0" }}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#FCD116]" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#FBF7EC]">
              Dossiers Entreprises Enregistrés sur FiscLens
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#BFD8CC]">
            {tenants.filter((t) => t.id !== "tenant-fisclens-admin").length} entreprise(s) cliente(s)
          </span>
        </div>

        <div className="p-4 sm:p-5">
          {tenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-mono text-xs">
              Aucun dossier d&apos;entreprise enregistré
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-[#B3261E] pb-2 font-mono text-[10px] uppercase tracking-wider text-[#33604C]">
                    <th className="py-2 pr-3">Entreprise</th>
                    <th className="py-2 px-3">Régime fiscal</th>
                    <th className="py-2 px-3">Ville / Forme</th>
                    <th className="py-2 px-3 text-center">Utilisateurs</th>
                    <th className="py-2 px-3 text-center">Écritures</th>
                    <th className="py-2 px-3 text-center">Exercice</th>
                    <th className="py-2 pl-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE8D9]">
                  {tenants.map((t) => {
                    const isAdminTenant = t.id === "tenant-fisclens-admin";
                    const isCurrent = t.id === currentTenantId;

                    return (
                      <tr key={t.id} className={cn("hover:bg-black/5 transition-colors", isCurrent && "bg-emerald-50/50")}>
                        <td className="py-3 pr-3">
                          <div className="font-semibold text-sm text-[#0B3D2E] flex items-center gap-2">
                            {t.name}
                            {isAdminTenant && (
                              <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300">
                                Administration
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-[9px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                Actif
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            ID: {t.id}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="inline-block bg-white border border-[#E6DEC8] px-2 py-0.5 rounded text-[11px]">
                            {t.regime}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[#33604C]">
                          {t.city} · {t.formeJuridique}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-[#0B3D2E]">
                          {t.userCount}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-[#0B3D2E]">
                          {t.ecritureCount}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {t.exerciceOuvert ? (
                            <span className="text-emerald-700 font-medium">Ouvert ✓</span>
                          ) : (
                            <span className="text-red-700 font-medium">Clôturé 🔒</span>
                          )}
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <Button
                            size="sm"
                            variant={isCurrent ? "secondary" : "outline"}
                            onClick={() => switchTenant(t.id)}
                            className="text-xs h-7 gap-1 border-[#C8BEA8]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {isCurrent ? "Dossier sélectionné" : "Auditer / Basculer"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Deux colonnes : Derniers Utilisateurs & Raccourcis Rapides ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Utilisateurs inscrits récents */}
        <div className="receipt shadow-sm" style={{ borderRadius: "6px", padding: 0, background: "#FAF7EE" }}>
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ background: "#0B3D2E", borderRadius: "5px 5px 0 0" }}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#FCD116]" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#FBF7EC]">
                Utilisateurs Récents
              </span>
            </div>
            <Link href="/parametres/utilisateurs" className="text-[10px] font-mono text-[#A8D5BA] hover:underline">
              Gérer les accès →
            </Link>
          </div>

          <div className="p-4">
            <div className="space-y-2">
              {recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between py-2 border-b border-[#EDE8D9] text-xs"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="font-semibold text-[#0B3D2E] truncate">{u.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">{u.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-[10px] bg-white border border-[#E6DEC8] px-2 py-0.5 rounded font-semibold text-[#0B3D2E]">
                      {u.role}
                    </span>
                    <p className="text-[10px] text-[#33604C] font-mono mt-0.5">{u.tenantName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Raccourcis d'administration système */}
        <div className="receipt shadow-sm" style={{ borderRadius: "6px", padding: 0, background: "#FAF7EE" }}>
          <div
            className="flex items-center gap-2 px-5 py-3"
            style={{ background: "#0B3D2E", borderRadius: "5px 5px 0 0" }}
          >
            <ShieldCheck className="h-4 w-4 text-[#FCD116]" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#FBF7EC]">
              Modules & Sécurité SuperAdmin
            </span>
          </div>

          <div className="p-4 sm:p-5 space-y-3">
            <Link
              href="/parametres/parametres-fiscaux"
              className="flex items-center justify-between p-3 rounded-lg border border-[#E6DEC8] bg-white/70 hover:bg-white transition-colors group"
            >
              <div>
                <p className="font-semibold text-sm text-[#0B3D2E] group-hover:text-[#157A46] transition-colors">
                  Paramètres Fiscaux Nationaux (OTR / CGI Togo)
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  Taux de TVA (18%), Taux IS (27%/25%), Acomptes IMF & Barèmes
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-[#33604C] group-hover:translate-x-0.5 transition-transform shrink-0" />
            </Link>

            <Link
              href="/parametres/audit-logs"
              className="flex items-center justify-between p-3 rounded-lg border border-[#E6DEC8] bg-white/70 hover:bg-white transition-colors group"
            >
              <div>
                <p className="font-semibold text-sm text-[#0B3D2E] group-hover:text-[#157A46] transition-colors">
                  Journaux d&apos;Audit & Sécurité (Audit Logs)
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  Traçabilité immuable des connexions et des opérations critiques
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-[#33604C] group-hover:translate-x-0.5 transition-transform shrink-0" />
            </Link>

            <Link
              href="/parametres/plan-comptes"
              className="flex items-center justify-between p-3 rounded-lg border border-[#E6DEC8] bg-white/70 hover:bg-white transition-colors group"
            >
              <div>
                <p className="font-semibold text-sm text-[#0B3D2E] group-hover:text-[#157A46] transition-colors">
                  Plan Comptable SYSCOHADA Révisé
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  Gestion des comptes généraux (Classes 1 à 8)
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-[#33604C] group-hover:translate-x-0.5 transition-transform shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

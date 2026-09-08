"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard, RefreshCw, TrendingUp, Star, Zap, Crown,
  Building2, ChevronDown, Loader2, CheckCircle2
} from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tenant = {
  id: string;
  name: string;
  regime: string;
  city: string;
  formeJuridique: string;
  plan: "STARTER" | "PRO" | "PREMIUM";
  userCount: number;
  ecritureCount: number;
  exerciceOuvert: boolean;
  isAdminTenant: boolean;
};

const PLAN_CONFIG = {
  STARTER: {
    label: "Starter",
    icon: Star,
    color: "#6B7280",
    bg: "#F9FAFB",
    border: "#D1D5DB",
    price: 15000,
    features: ["1 utilisateur", "500 écritures/mois", "Journaux de base"],
  },
  PRO: {
    label: "Pro",
    icon: Zap,
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#93C5FD",
    price: 35000,
    features: ["5 utilisateurs", "Illimité", "BI & Analyse", "Calendrier fiscal"],
  },
  PREMIUM: {
    label: "Premium",
    icon: Crown,
    color: "#B45309",
    bg: "#FFFBEB",
    border: "#FCD34D",
    price: 75000,
    features: ["Utilisateurs illimités", "Multi-dossiers", "Support prioritaire", "API accès"],
  },
};

export function AdminAbonnements() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ tenants: Tenant[] }>("/api/v1/admin/tenants");
      setTenants(res.tenants);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updatePlan = async (tenantId: string, plan: string) => {
    setUpdatingId(tenantId);
    try {
      await api.patch(`/api/v1/admin/tenants/${tenantId}`, { plan });
      setToast(`✓ Plan mis à jour vers ${plan}`);
      await fetchData();
    } catch {
      setToast("✗ Erreur lors de la mise à jour");
    } finally {
      setUpdatingId(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const clientTenants = tenants.filter((t) => !t.isAdminTenant);
  const byPlan = {
    STARTER: clientTenants.filter((t) => t.plan === "STARTER"),
    PRO:     clientTenants.filter((t) => t.plan === "PRO"),
    PREMIUM: clientTenants.filter((t) => t.plan === "PREMIUM"),
  };

  const mrr = clientTenants.reduce((acc, t) => acc + PLAN_CONFIG[t.plan].price, 0);
  const arr = mrr * 12;

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
              Plans & Abonnements
            </h2>
          </div>
          <p className="font-mono text-[11px] text-[#33604C] tracking-widest uppercase">
            {clientTenants.length} clients · MRR estimé {mrr.toLocaleString("fr-FR")} FCFA · ARR {Math.round(arr / 1000).toLocaleString("fr-FR")}k FCFA
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="bg-white/80 border-[#C8BEA8] text-[#0B3D2E] hover:bg-white text-xs self-start"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-mono bg-[#0B3D2E] text-white flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Métriques MRR/ARR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="receipt shadow-sm" style={{ borderTop: "3px solid #157A46", borderRadius: "6px", padding: "1.25rem", background: "#FAF7EE" }}>
          <div className="flex items-start justify-between mb-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#157A46]">MRR Estimé</p>
            <TrendingUp className="h-4 w-4 text-[#157A46]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0B3D2E]">
            {loading ? "..." : `${mrr.toLocaleString("fr-FR")} FCFA`}
          </div>
          <p className="mt-1 text-xs font-mono text-[#33604C]">Revenu mensuel récurrent</p>
        </div>
        <div className="receipt shadow-sm" style={{ borderTop: "3px solid #2563EB", borderRadius: "6px", padding: "1.25rem", background: "#FAF7EE" }}>
          <div className="flex items-start justify-between mb-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#2563EB]">ARR Estimé</p>
            <CreditCard className="h-4 w-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0B3D2E]">
            {loading ? "..." : `${Math.round(arr / 1000).toLocaleString("fr-FR")}k FCFA`}
          </div>
          <p className="mt-1 text-xs font-mono text-[#33604C]">Revenu annuel récurrent</p>
        </div>
        <div className="receipt shadow-sm" style={{ borderTop: "3px solid #B45309", borderRadius: "6px", padding: "1.25rem", background: "#FAF7EE" }}>
          <div className="flex items-start justify-between mb-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#B45309]">Clients actifs</p>
            <Building2 className="h-4 w-4 text-[#B45309]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0B3D2E]">
            {loading ? "..." : clientTenants.length}
          </div>
          <p className="mt-1 text-xs font-mono text-[#33604C]">Dossiers sur la plateforme</p>
        </div>
      </div>

      {/* Cartes Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {(["STARTER", "PRO", "PREMIUM"] as const).map((planKey) => {
          const cfg = PLAN_CONFIG[planKey];
          const Icon = cfg.icon;
          const group = byPlan[planKey];
          return (
            <div
              key={planKey}
              className="receipt shadow-sm flex flex-col"
              style={{ borderRadius: "6px", padding: 0, background: "#FAF7EE" }}
            >
              {/* Header */}
              <div
                className="px-5 py-4"
                style={{
                  background: cfg.bg,
                  borderRadius: "5px 5px 0 0",
                  borderBottom: `2px solid ${cfg.border}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" style={{ color: cfg.color }} />
                    <span className="font-mono font-bold text-sm" style={{ color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                  <span className="font-mono text-xl font-bold" style={{ color: "#0B3D2E" }}>
                    {group.length}
                  </span>
                </div>
                <p className="font-mono text-[11px] mt-1" style={{ color: cfg.color }}>
                  {cfg.price.toLocaleString("fr-FR")} FCFA/mois · {(cfg.price * group.length).toLocaleString("fr-FR")} FCFA MRR
                </p>
                <div className="mt-2 space-y-0.5">
                  {cfg.features.map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: cfg.color }}>
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Liste des clients */}
              <div className="flex-1 divide-y divide-[#EDE8D9]">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : group.length === 0 ? (
                  <div className="text-center py-6 text-[11px] font-mono text-muted-foreground">
                    Aucun client sur ce plan
                  </div>
                ) : (
                  group.map((t) => {
                    const isUpdating = updatingId === t.id;
                    return (
                      <div key={t.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-black/5 transition-colors">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-semibold text-xs text-[#0B3D2E] truncate">{t.name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {t.city} · {t.userCount} user(s)
                          </p>
                        </div>
                        <div className="relative shrink-0">
                          <select
                            value={t.plan}
                            onChange={(e) => updatePlan(t.id, e.target.value)}
                            disabled={isUpdating}
                            className="appearance-none text-[10px] font-mono font-semibold px-2 py-1 pr-6 rounded border cursor-pointer focus:outline-none disabled:opacity-50"
                            style={{
                              background: PLAN_CONFIG[t.plan].bg,
                              color: PLAN_CONFIG[t.plan].color,
                              borderColor: PLAN_CONFIG[t.plan].border,
                            }}
                          >
                            <option value="STARTER">STARTER</option>
                            <option value="PRO">PRO</option>
                            <option value="PREMIUM">PREMIUM</option>
                          </select>
                          {isUpdating ? (
                            <Loader2 className="absolute right-1.5 top-1.5 h-2.5 w-2.5 animate-spin" />
                          ) : (
                            <ChevronDown className="absolute right-1.5 top-1.5 h-2.5 w-2.5 pointer-events-none text-[#33604C]" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2" style={{ opacity: 0.35 }}>
        <div className="stamp-badge" style={{ borderColor: "#157A46", color: "#157A46", fontSize: "0.55rem" }}>
          FiscLens Admin · Plans & Revenus
        </div>
      </div>
    </div>
  );
}

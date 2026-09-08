"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, RefreshCw, Search, CheckCircle2, XCircle,
  ChevronDown, Users, FileSpreadsheet, Globe, Phone, Loader2
} from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

type Tenant = {
  id: string;
  name: string;
  regime: string;
  nif: string;
  rccm: string;
  centreFiscal: string;
  formeJuridique: string;
  secteurActivite: string;
  phone: string;
  address: string;
  city: string;
  exerciceOuvert: boolean;
  plan: "STARTER" | "PRO" | "PREMIUM";
  userCount: number;
  ecritureCount: number;
  createdAt: string;
  isAdminTenant: boolean;
};

type PlanStats = { STARTER: number; PRO: number; PREMIUM: number };

const PLAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  STARTER: { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" },
  PRO:     { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  PREMIUM: { bg: "#FEF9C3", text: "#854D0E", border: "#FDE68A" },
};

const PLAN_PRICES: Record<string, number> = {
  STARTER: 15000,
  PRO:     35000,
  PREMIUM: 75000,
};

export function AdminTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [planStats, setPlanStats] = useState<PlanStats>({ STARTER: 0, PRO: 0, PREMIUM: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterPlan) params.set("plan", filterPlan);
      const res = await api.get<{ tenants: Tenant[]; planStats: PlanStats }>(
        `/api/v1/admin/tenants?${params.toString()}`
      );
      setTenants(res.tenants);
      setPlanStats(res.planStats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, filterPlan]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const updatePlan = async (tenantId: string, plan: string) => {
    setUpdatingId(tenantId);
    try {
      await api.patch(`/api/v1/admin/tenants/${tenantId}`, { plan });
      await fetchTenants();
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExercice = async (tenant: Tenant) => {
    setUpdatingId(tenant.id);
    try {
      await api.patch(`/api/v1/admin/tenants/${tenant.id}`, {
        exerciceOuvert: !tenant.exerciceOuvert,
      });
      await fetchTenants();
    } finally {
      setUpdatingId(null);
    }
  };

  const clientTenants = tenants.filter((t) => !t.isAdminTenant);
  const mrr = clientTenants.reduce((acc, t) => acc + (PLAN_PRICES[t.plan] || 0), 0);

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
              Gestion des Entreprises Clientes
            </h2>
          </div>
          <p className="font-mono text-[11px] text-[#33604C] tracking-widest uppercase">
            {clientTenants.length} dossier(s) · MRR estimé : {mrr.toLocaleString("fr-FR")} FCFA/mois
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTenants}
          disabled={loading}
          className="bg-white/80 border-[#C8BEA8] text-[#0B3D2E] hover:bg-white text-xs self-start"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      {/* Stats Plans */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {(["STARTER", "PRO", "PREMIUM"] as const).map((plan) => {
          const col = PLAN_COLORS[plan];
          return (
            <div
              key={plan}
              className="receipt shadow-sm cursor-pointer"
              style={{
                borderTop: `3px solid ${col.border}`,
                borderRadius: "6px",
                padding: "1rem",
                background: col.bg,
              }}
              onClick={() => setFilterPlan(filterPlan === plan ? "" : plan)}
            >
              <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: col.text }}>
                {plan}
              </p>
              <div className="text-2xl font-bold font-mono mt-1" style={{ color: "#0B3D2E" }}>
                {planStats[plan]}
              </div>
              <p className="text-[11px] font-mono mt-0.5" style={{ color: col.text }}>
                {PLAN_PRICES[plan].toLocaleString("fr-FR")} FCFA/mois
              </p>
            </div>
          );
        })}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#33604C]" />
          <input
            type="text"
            placeholder="Rechercher par nom, NIF, ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-mono rounded border border-[#C8BEA8] bg-white/80 focus:outline-none focus:ring-1 focus:ring-[#157A46]"
          />
        </div>
        {filterPlan && (
          <button
            onClick={() => setFilterPlan("")}
            className="text-xs font-mono text-[#B3261E] hover:underline px-3 py-2 bg-white/80 rounded border border-[#C8BEA8]"
          >
            × Filtre {filterPlan}
          </button>
        )}
      </div>

      {/* Tableau des tenants */}
      <div className="receipt shadow-sm" style={{ borderRadius: "6px", padding: 0, background: "#FAF7EE" }}>
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ background: "#0B3D2E", borderRadius: "5px 5px 0 0" }}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#FCD116]" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#FBF7EC]">
              Dossiers Enregistrés
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#BFD8CC]">
            {loading ? "..." : `${clientTenants.length} résultat(s)`}
          </span>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs font-mono">Chargement...</span>
            </div>
          ) : clientTenants.length === 0 ? (
            <div className="text-center py-10 text-xs font-mono text-muted-foreground">
              Aucun dossier trouvé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-[#B3261E] font-mono text-[10px] uppercase tracking-wider text-[#33604C]">
                    <th className="py-2 px-4">Entreprise</th>
                    <th className="py-2 px-3">Régime</th>
                    <th className="py-2 px-3">Localisation</th>
                    <th className="py-2 px-3 text-center">
                      <Users className="h-3 w-3 inline" /> Users
                    </th>
                    <th className="py-2 px-3 text-center">
                      <FileSpreadsheet className="h-3 w-3 inline" /> Écrits
                    </th>
                    <th className="py-2 px-3">Plan</th>
                    <th className="py-2 px-3">Exercice</th>
                    <th className="py-2 px-3">Créé le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE8D9]">
                  {clientTenants.map((t) => {
                    const isUpdating = updatingId === t.id;
                    const planCol = PLAN_COLORS[t.plan];
                    return (
                      <tr key={t.id} className="hover:bg-black/5 transition-colors group">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-sm text-[#0B3D2E]">{t.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            NIF: {t.nif} · {t.formeJuridique}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block bg-white border border-[#E6DEC8] px-2 py-0.5 rounded text-[11px] font-mono">
                            {t.regime}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[#33604C]">
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {t.city}
                          </div>
                          {t.phone !== "—" && (
                            <div className="flex items-center gap-1 text-[10px] mt-0.5">
                              <Phone className="h-2.5 w-2.5" />
                              {t.phone}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-[#0B3D2E]">
                          {t.userCount}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-[#0B3D2E]">
                          {t.ecritureCount}
                        </td>
                        <td className="py-3 px-3">
                          <div className="relative group/plan">
                            <select
                              value={t.plan}
                              onChange={(e) => updatePlan(t.id, e.target.value)}
                              disabled={isUpdating}
                              className="appearance-none text-[11px] font-mono font-semibold px-2 py-1 pr-6 rounded border cursor-pointer focus:outline-none disabled:opacity-50"
                              style={{
                                background: planCol.bg,
                                color: planCol.text,
                                borderColor: planCol.border,
                              }}
                            >
                              <option value="STARTER">STARTER</option>
                              <option value="PRO">PRO</option>
                              <option value="PREMIUM">PREMIUM</option>
                            </select>
                            {isUpdating ? (
                              <Loader2 className="absolute right-1.5 top-1.5 h-3 w-3 animate-spin text-[#33604C]" />
                            ) : (
                              <ChevronDown className="absolute right-1.5 top-1.5 h-3 w-3 pointer-events-none text-[#33604C]" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => toggleExercice(t)}
                            disabled={isUpdating}
                            className="flex items-center gap-1 text-[11px] font-mono font-medium transition-opacity disabled:opacity-50"
                            style={{ color: t.exerciceOuvert ? "#157A46" : "#B3261E" }}
                          >
                            {t.exerciceOuvert ? (
                              <><CheckCircle2 className="h-3.5 w-3.5" /> Ouvert</>
                            ) : (
                              <><XCircle className="h-3.5 w-3.5" /> Clôturé</>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#33604C]">
                          {formatDate(new Date(t.createdAt))}
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

      {/* Tampon SYSCOHADA */}
      <div className="flex justify-end pt-2" style={{ opacity: 0.35 }}>
        <div className="stamp-badge" style={{ borderColor: "#157A46", color: "#157A46", fontSize: "0.55rem" }}>
          FiscLens Admin · Gestion Multi-Tenant
        </div>
      </div>
    </div>
  );
}

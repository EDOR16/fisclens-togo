"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { formatFcfa, formatDate } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, AlertTriangle, CalendarClock,
  BookOpen, Receipt, CheckCircle2, Clock, Loader2, RefreshCw, PlusCircle
} from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardStatsResponse = {
  chiffreAffaires: number;
  totalCharges: number;
  resultatNet: number;
  tresorerie: number;
  encoursClients: number;
  encoursFournisseurs: number;
  tvaCollectee: number;
  tvaDeductible: number;
  tvaADeclarer: number;
  creditTva: number;
  totalEcrituresCount: number;
  recentEntries: Array<{
    id: string;
    date: string;
    piece: string;
    journal: string;
    libelle: string;
    debit: number;
    credit: number;
    status: string;
  }>;
};

const OBLIGATIONS_TOGO = [
  { label: "Déclaration TVA (OTR M-1)", date: "15 du mois", status: "warning", icon: Receipt },
  { label: "Acompte IS / IMF Trimestriel", date: "31 mars / 30 juin", status: "ok", icon: CalendarClock },
  { label: "Déclaration & Paiement CNSS", date: "15 du mois", status: "ok", icon: CheckCircle2 },
];

const STATUS_BADGE: Record<string, React.ReactNode> = {
  urgent:  <Badge variant="destructive">Urgent</Badge>,
  warning: <Badge variant="warning">À venir</Badge>,
  ok:      <Badge variant="success">Planifié</Badge>,
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<DashboardStatsResponse>("/accounting/dashboard-stats");
      setData(res);
    } catch {
      // Garder les stats par défaut en cas d'absence de session ou offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const ca = data?.chiffreAffaires ?? 0;
  const charges = data?.totalCharges ?? 0;
  const tva = data?.tvaADeclarer ?? 0;
  const totalEcritures = data?.totalEcrituresCount ?? 0;
  const entries = data?.recentEntries ?? [];

  const kpis = [
    {
      label: "Chiffre d'affaires",
      value: formatFcfa(ca),
      change: ca > 0 ? "Comptes 70x mouvementés" : "Aucun produit saisi",
      up: ca > 0,
      icon: TrendingUp,
      accentColor: "#157A46",
    },
    {
      label: "Charges d'exploitation",
      value: formatFcfa(charges),
      change: charges > 0 ? "Comptes 60x mouvementés" : "Aucune charge saisie",
      up: false,
      icon: TrendingDown,
      accentColor: "#B3261E",
    },
    {
      label: "TVA nette à déclarer",
      value: formatFcfa(tva),
      change: (data?.tvaDeductible ?? 0) > 0 ? `TVA déd: ${formatFcfa(data?.tvaDeductible ?? 0)}` : "TVA Togo (18%)",
      up: true,
      icon: Receipt,
      accentColor: "#2563EB",
    },
    {
      label: "Total Écritures BDD",
      value: `${totalEcritures} ${totalEcritures > 1 ? "écritures" : "écriture"}`,
      change: totalEcritures > 0 ? "SYSCOHADA actif" : "Aucune écriture",
      up: totalEcritures > 0,
      icon: totalEcritures > 0 ? CheckCircle2 : AlertTriangle,
      accentColor: "#D97706",
    },
  ];

  return (
    <div
      className="space-y-8 p-6"
      style={{
        background: "#F5F0E4",
        backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #E6DEC8 31px, #E6DEC8 32px)",
        minHeight: "100%",
      }}
    >
      {/* ── En-tête chapitre grand livre ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2
            className="chapter-heading text-2xl mb-1"
            style={{ fontFamily: "var(--font-hand), cursive", color: "#0B3D2E" }}
          >
            Tableau de bord comptable & fiscal
          </h2>
          <p className="font-mono text-[10px] text-[#33604C] tracking-widest uppercase mt-3">
            SYSCOHADA Révisé · République Togolaise
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="bg-white/80 border-[#C8BEA8] text-[#0B3D2E] hover:bg-white"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
            Actualiser
          </Button>
          <a href="/comptabilite/saisie">
            <Button size="sm" className="bg-[#0B3D2E] hover:bg-[#157A46] text-white">
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Saisir écriture
            </Button>
          </a>
          <div
            className="margin-note text-sm hidden md:block"
            style={{ fontFamily: "var(--font-hand), cursive" }}
          >
            Données au {formatDate(new Date())}
          </div>
        </div>
      </div>

      {/* ── KPI Cards — style reçu perforé ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="receipt shadow-sm"
              style={{
                borderTop: `3px solid ${stat.accentColor}`,
                borderRadius: "6px",
                padding: "1.25rem 1.25rem 1.5rem",
                position: "relative",
                background: "#FAF7EE",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <p
                  className="font-mono text-[10px] uppercase tracking-wider leading-tight"
                  style={{ color: stat.accentColor, opacity: 0.9 }}
                >
                  {stat.label}
                </p>
                <Icon className="h-4 w-4 shrink-0" style={{ color: stat.accentColor }} />
              </div>
              <div
                className="text-2xl font-bold tabular-nums"
                style={{ fontFamily: "var(--font-mono), monospace", color: "#0B3D2E" }}
              >
                {loading && !data ? "..." : stat.value}
              </div>
              <div className="mt-2">
                <span
                  className="text-xs font-mono"
                  style={{ color: stat.up ? "#157A46" : "#B3261E" }}
                >
                  {stat.change}
                </span>
              </div>
              {/* Perforation bas de reçu */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "1rem",
                  right: "1rem",
                  height: "1px",
                  backgroundImage: "repeating-linear-gradient(90deg, transparent 0, transparent 4px, #E2D9C2 4px, #E2D9C2 8px)",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ── Panneaux bas de page ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Obligations fiscales */}
        <div className="receipt shadow-sm" style={{ borderRadius: "6px", padding: 0, background: "#FAF7EE" }}>
          <div
            className="flex items-center gap-2 px-5 py-3"
            style={{ background: "#0B3D2E", borderRadius: "5px 5px 0 0" }}
          >
            <CalendarClock className="h-4 w-4" style={{ color: "#FBF7EC" }} />
            <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: "#FBF7EC" }}>
              Échéances fiscales Togo (OTR / CNSS)
            </span>
          </div>
          <div className="px-5 py-4">
            <div className="space-y-2">
              {OBLIGATIONS_TOGO.map((ob, i) => {
                const Icon = ob.icon;
                return (
                  <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid #EDE8D9" }}>
                    <span className="ledger-line-num font-mono text-xs">{String(i + 1).padStart(3, "0")}</span>
                    <Icon className="h-4 w-4" style={{ color: "#33604C" }} />
                    <span className="flex-1 text-sm font-medium" style={{ color: "#0B3D2E" }}>{ob.label}</span>
                    <span className="font-mono text-xs" style={{ color: "#33604C" }}>{ob.date}</span>
                    {STATUS_BADGE[ob.status]}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dernières écritures réelles */}
        <div className="receipt shadow-sm" style={{ borderRadius: "6px", padding: 0, background: "#FAF7EE" }}>
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ background: "#0B3D2E", borderRadius: "5px 5px 0 0" }}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" style={{ color: "#FBF7EC" }} />
              <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: "#FBF7EC" }}>
                Dernières écritures réelles
              </span>
            </div>
            <a href="/comptabilite/journaux" className="text-[10px] font-mono text-[#A8D5BA] hover:underline">
              Voir tout →
            </a>
          </div>
          <div className="px-5 py-4">
            {loading && !data ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-xs font-mono">Chargement...</span>
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2" style={{ opacity: 0.6 }}>
                <Clock className="h-8 w-8" style={{ color: "#33604C" }} />
                <p className="font-mono text-xs tracking-wide" style={{ color: "#33604C" }}>
                  Aucune écriture comptable enregistrée
                </p>
                <span
                  className="margin-note text-[11px]"
                  style={{ fontFamily: "var(--font-hand), cursive" }}
                >
                  Grand livre vide — Débit = Crédit
                </span>
              </div>
            ) : (
              <div>
                {/* En-tête colonnes */}
                <div
                  className="grid gap-2 pb-1 mb-2 text-xs"
                  style={{
                    gridTemplateColumns: "2.5rem 4.5rem 1fr auto auto",
                    borderBottom: "2px solid #B3261E",
                  }}
                >
                  <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "#B3261E" }}>#</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "#33604C" }}>Pièce</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "#33604C" }}>Libellé</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-right" style={{ color: "#B3261E" }}>Débit</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-right" style={{ color: "#157A46" }}>Crédit</span>
                </div>
                {entries.map((e, i) => (
                  <div
                    key={e.id || i}
                    className="grid gap-2 py-2 items-center text-xs"
                    style={{
                      gridTemplateColumns: "2.5rem 4.5rem 1fr auto auto",
                      borderBottom: "1px solid #EDE8D9",
                    }}
                  >
                    <span className="ledger-line-num font-mono">{String(i + 1).padStart(3, "0")}</span>
                    <span className="font-mono text-[11px] font-semibold text-[#0B3D2E] truncate">{e.piece}</span>
                    <span className="truncate text-[#0B3D2E]">{e.libelle}</span>
                    <span className="font-mono font-semibold text-right text-[#B3261E]">
                      {e.debit > 0 ? formatFcfa(e.debit) : "—"}
                    </span>
                    <span className="font-mono font-semibold text-right text-[#157A46]">
                      {e.credit > 0 ? formatFcfa(e.credit) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Tampon SYSCOHADA bas de page ── */}
      <div className="flex justify-end pt-2" style={{ opacity: 0.35 }}>
        <div
          className="stamp-badge"
          style={{ borderColor: "#157A46", color: "#157A46", fontSize: "0.55rem" }}
        >
          SYSCOHADA Révisé · OTR · CGI Togo
        </div>
      </div>
    </div>
  );
}

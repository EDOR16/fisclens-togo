import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { formatFcfa, formatDate } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, AlertTriangle, CalendarClock,
  BookOpen, Receipt, CheckCircle2, Clock,
} from "lucide-react";

export const metadata: Metadata = { title: "Tableau de bord" };

// ---------------------------------------------------------------------------
// Données — état vide tant qu'aucune écriture n'est saisie (pas de données fictives)
// ---------------------------------------------------------------------------

const EMPTY_STATS = [
  { label: "Chiffre d'affaires (mois)", value: "0 FCFA",  change: "Aucune donnée",       up: true,  icon: TrendingUp,    accentColor: "#157A46" },
  { label: "Charges du mois",           value: "0 FCFA",  change: "Aucune donnée",       up: false, icon: TrendingDown,  accentColor: "#B3261E" },
  { label: "TVA à déclarer",            value: "0 FCFA",  change: "Aucune déclaration",  up: true,  icon: Receipt,       accentColor: "#2563EB" },
  { label: "Anomalies détectées",       value: "0",       change: "Aucune anomalie",     up: false, icon: AlertTriangle, accentColor: "#D97706" },
] as const;

const EMPTY_OBLIGATIONS: Array<{ label: string; date: string; status: string; icon: any }> = [];
const EMPTY_ENTRIES: Array<{ date: string; libelle: string; journal: string; debit: number; credit: number }> = [];

const STATUS_BADGE: Record<string, React.ReactNode> = {
  urgent:  <Badge variant="destructive">Urgent</Badge>,
  warning: <Badge variant="warning">À venir</Badge>,
  ok:      <Badge variant="success">Planifié</Badge>,
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
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
      <div className="flex items-start justify-between">
        <div>
          <h2
            className="chapter-heading text-2xl mb-1"
            style={{ fontFamily: "var(--font-hand), cursive", color: "#0B3D2E" }}
          >
            Tableau de bord
          </h2>
          <p className="font-mono text-[10px] text-[#33604C] tracking-widest uppercase mt-3">
            Exercice 2025
          </p>
        </div>
        {/* Annotation manuscrite date en marge */}
        <div
          className="margin-note text-sm mt-1"
          style={{ fontFamily: "var(--font-hand), cursive" }}
        >
          Données au {formatDate(new Date())}
        </div>
      </div>

      {/* ── KPI Cards — style reçu perforé ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {EMPTY_STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="receipt"
              style={{
                borderTop: `3px solid ${stat.accentColor}`,
                borderRadius: "6px",
                padding: "1.25rem 1.25rem 1.5rem",
                position: "relative",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <p
                  className="font-mono text-[10px] uppercase tracking-wider leading-tight"
                  style={{ color: stat.accentColor, opacity: 0.8 }}
                >
                  {stat.label}
                </p>
                <Icon className="h-4 w-4 shrink-0" style={{ color: stat.accentColor }} />
              </div>
              <div
                className="text-2xl font-bold tabular-nums"
                style={{ fontFamily: "var(--font-mono), monospace", color: "#0B3D2E" }}
              >
                {stat.value}
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
        <div className="receipt" style={{ borderRadius: "6px", padding: 0 }}>
          <div
            className="flex items-center gap-2 px-5 py-3"
            style={{ background: "#0B3D2E", borderRadius: "5px 5px 0 0" }}
          >
            <CalendarClock className="h-4 w-4" style={{ color: "#FBF7EC" }} />
            <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: "#FBF7EC" }}>
              Obligations à venir
            </span>
          </div>
          <div className="px-5 py-4">
            {EMPTY_OBLIGATIONS.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2" style={{ opacity: 0.6 }}>
                <CheckCircle2 className="h-8 w-8" style={{ color: "#157A46" }} />
                <p className="font-mono text-xs tracking-wide" style={{ color: "#33604C" }}>
                  Aucune obligation enregistrée
                </p>
                <span
                  className="margin-note text-[11px]"
                  style={{ fontFamily: "var(--font-hand), cursive" }}
                >
                  Commencez par saisir votre premier journal
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {EMPTY_OBLIGATIONS.map((ob, i) => {
                  const Icon = ob.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid #EDE8D9" }}>
                      <span className="ledger-line-num">{String(i + 1).padStart(3, "0")}</span>
                      <Icon className="h-4 w-4" style={{ color: "#33604C" }} />
                      <span className="flex-1 text-sm" style={{ color: "#0B3D2E" }}>{ob.label}</span>
                      <span className="font-mono text-xs" style={{ color: "#33604C" }}>{ob.date}</span>
                      {STATUS_BADGE[ob.status]}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dernières écritures */}
        <div className="receipt" style={{ borderRadius: "6px", padding: 0 }}>
          <div
            className="flex items-center gap-2 px-5 py-3"
            style={{ background: "#0B3D2E", borderRadius: "5px 5px 0 0" }}
          >
            <BookOpen className="h-4 w-4" style={{ color: "#FBF7EC" }} />
            <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: "#FBF7EC" }}>
              Dernières écritures
            </span>
          </div>
          <div className="px-5 py-4">
            {EMPTY_ENTRIES.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2" style={{ opacity: 0.6 }}>
                <Clock className="h-8 w-8" style={{ color: "#33604C" }} />
                <p className="font-mono text-xs tracking-wide" style={{ color: "#33604C" }}>
                  Aucune écriture comptable
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
                  className="grid gap-2 pb-1 mb-2"
                  style={{
                    gridTemplateColumns: "3rem 1fr auto auto",
                    borderBottom: "2px solid #B3261E",
                  }}
                >
                  <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "#B3261E" }}>#</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "#33604C" }}>Libellé</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-right" style={{ color: "#B3261E" }}>Débit</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-right" style={{ color: "#157A46" }}>Crédit</span>
                </div>
                {EMPTY_ENTRIES.map((e, i) => (
                  <div
                    key={i}
                    className="grid gap-2 py-1.5"
                    style={{
                      gridTemplateColumns: "3rem 1fr auto auto",
                      borderBottom: "1px solid #EDE8D9",
                    }}
                  >
                    <span className="ledger-line-num">{String(i + 1).padStart(3, "0")}</span>
                    <span className="text-xs truncate" style={{ color: "#0B3D2E" }}>{e.libelle}</span>
                    <span className="badge-debit">{formatFcfa(e.debit)}</span>
                    <span className="badge-credit">{formatFcfa(e.credit)}</span>
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

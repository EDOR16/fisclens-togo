import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFcfa, formatDate } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, AlertTriangle, CalendarClock,
  BookOpen, Receipt, CheckCircle2, Clock,
} from "lucide-react";

export const metadata: Metadata = { title: "Tableau de bord" };

// ---------------------------------------------------------------------------
// Données statiques (sera remplacé par Server Component → service/)
// ---------------------------------------------------------------------------

const STATS = [
  {
    label: "Chiffre d'affaires (mois)",
    value: formatFcfa(12_450_000),
    change: "+8.2%",
    up: true,
    icon: TrendingUp,
    color: "text-green-600",
  },
  {
    label: "Charges du mois",
    value: formatFcfa(8_120_000),
    change: "+2.1%",
    up: false,
    icon: TrendingDown,
    color: "text-red-500",
  },
  {
    label: "TVA à déclarer",
    value: formatFcfa(856_000),
    change: "Échéance : 20 sept.",
    up: true,
    icon: Receipt,
    color: "text-blue-500",
  },
  {
    label: "Anomalies détectées",
    value: "3",
    change: "À traiter",
    up: false,
    icon: AlertTriangle,
    color: "text-yellow-500",
  },
];

const UPCOMING_OBLIGATIONS = [
  { label: "Déclaration TVA — août",      date: "2025-09-20", status: "urgent",  icon: Receipt },
  { label: "Acompte IS — septembre",      date: "2025-09-30", status: "warning", icon: BookOpen },
  { label: "CNSS — cotisations août",     date: "2025-09-15", status: "ok",      icon: CheckCircle2 },
  { label: "Déclaration IRPP employeur",  date: "2026-03-31", status: "ok",      icon: Clock },
];

const RECENT_ENTRIES = [
  { date: "2025-08-14", libelle: "Achat matériel bureau",   journal: "ACHATS",  debit: 450_000,       credit: 0 },
  { date: "2025-08-13", libelle: "Encaissement client SATI",journal: "BANQUE",  debit: 0,             credit: 2_300_000 },
  { date: "2025-08-12", libelle: "Paie août — personnel",   journal: "PAIE",    debit: 3_200_000,     credit: 0 },
  { date: "2025-08-10", libelle: "Facture fournisseur #84", journal: "ACHATS",  debit: 780_000,       credit: 0 },
];

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
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-xl font-semibold">Tableau de bord</h2>
        <p className="text-sm text-muted-foreground">
          Exercice 2025 — Données au {formatDate(new Date())}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-medium">{stat.label}</CardDescription>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold tabular-nums">{stat.value}</div>
                <p className={`text-xs mt-1 ${stat.up ? "text-green-600" : "text-muted-foreground"}`}>
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Obligations fiscales à venir */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Obligations à venir</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {UPCOMING_OBLIGATIONS.map((obl) => {
              const Icon = obl.icon;
              return (
                <div key={obl.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{obl.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(obl.date)}
                      </p>
                    </div>
                  </div>
                  {STATUS_BADGE[obl.status]}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Dernières écritures */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Dernières écritures</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Libellé</th>
                  <th className="pb-2 text-right text-xs font-medium text-muted-foreground">Débit</th>
                  <th className="pb-2 text-right text-xs font-medium text-muted-foreground">Crédit</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_ENTRIES.map((e, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">
                      <p className="font-medium truncate max-w-[160px]">{e.libelle}</p>
                      <p className="text-xs text-muted-foreground">{e.journal} · {formatDate(e.date)}</p>
                    </td>
                    <td className="py-2 text-right tabular-nums font-mono text-sm">
                      {e.debit > 0 ? formatFcfa(e.debit) : "—"}
                    </td>
                    <td className="py-2 text-right tabular-nums font-mono text-sm">
                      {e.credit > 0 ? formatFcfa(e.credit) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

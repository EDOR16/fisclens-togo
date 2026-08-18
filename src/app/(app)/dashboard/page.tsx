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
// Données statiques interdites en environnement réel.
// Le tableau de bord affiche un état vide tant qu'aucune écriture n'est saisie.
// ---------------------------------------------------------------------------

const EMPTY_STATS = [
  { label: "Chiffre d'affaires (mois)", value: "0 FCFA", change: "Aucune donnée", up: true, icon: TrendingUp, color: "text-green-600" },
  { label: "Charges du mois", value: "0 FCFA", change: "Aucune donnée", up: false, icon: TrendingDown, color: "text-red-500" },
  { label: "TVA à déclarer", value: "0 FCFA", change: "Aucune déclaration", up: true, icon: Receipt, color: "text-blue-500" },
  { label: "Anomalies détectées", value: "0", change: "Aucune anomalie", up: false, icon: AlertTriangle, color: "text-yellow-500" },
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
        {EMPTY_STATS.map((stat) => {
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
            {EMPTY_OBLIGATIONS.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                Aucune obligation fiscalement déclenchée pour ce tenant.
              </div>
            ) : EMPTY_OBLIGATIONS.map((obl) => {
              const Icon = obl.icon;
              return (
                <div key={obl.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{obl.label}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(obl.date)}</p>
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
            {EMPTY_ENTRIES.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                Votre grand livre est vierge. Aucune donnée fictive ici : ce que vous saisirez sera votre seule vérité.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Libellé</th>
                    <th className="pb-2 text-right text-xs font-medium text-muted-foreground">Débit</th>
                    <th className="pb-2 text-right text-xs font-medium text-muted-foreground">Crédit</th>
                  </tr>
                </thead>
                <tbody>
                  {EMPTY_ENTRIES.map((e, i) => (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

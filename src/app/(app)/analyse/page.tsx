import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFcfa, formatAmount } from "@/lib/utils";
import { BarChart3, TrendingUp, Users, Wallet } from "lucide-react";

export const metadata: Metadata = { title: "Analyse" };

const KPI = [
  { label: "CA annuel (projeté)",    value: formatFcfa(149_400_000), icon: TrendingUp, trend: "+12%" },
  { label: "Marge brute",            value: "34.7%",                icon: BarChart3,  trend: "+2.1pt" },
  { label: "Clients actifs",         value: "47",                   icon: Users,      trend: "+5" },
  { label: "Trésorerie nette",       value: formatFcfa(4_200_000),  icon: Wallet,     trend: "Stable" },
];

export default function AnalysePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Analyse & Indicateurs</h2>
        <p className="text-sm text-muted-foreground">Phase 4 — Disponible prochainement</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-medium">{k.label}</CardDescription>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold tabular-nums">{k.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{k.trend} vs N-1</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="opacity-60">
          <CardHeader><CardTitle className="text-sm">Analyse RFM clients</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Récence, Fréquence, Montant — Phase 4</p><Badge variant="outline" className="mt-2">À venir</Badge></CardContent>
        </Card>
        <Card className="opacity-60">
          <CardHeader><CardTitle className="text-sm">Concentration client</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Pareto 80/20, dépendance client — Phase 4</p><Badge variant="outline" className="mt-2">À venir</Badge></CardContent>
        </Card>
        <Card className="opacity-60">
          <CardHeader><CardTitle className="text-sm">Prévision trésorerie</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Projection 3-6 mois — Phase 4</p><Badge variant="outline" className="mt-2">À venir</Badge></CardContent>
        </Card>
      </div>
    </div>
  );
}

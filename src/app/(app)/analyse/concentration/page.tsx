"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart } from "lucide-react";

export default function ConcentrationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" /> Indice de Concentration & Risque Dépendance
        </h2>
        <p className="text-sm text-muted-foreground">Loi de Pareto (80/20) et dépendance au Top 5 clients — Phase 4</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Concentration du Chiffre d&apos;Affaires</CardTitle>
            <Badge variant="outline">Phase 4</Badge>
          </div>
          <CardDescription>Indicateur Herfindahl-Hirschman (HHI) et seuil d&apos;alerte OTR / Banque</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ce module sera activé en Phase 4 pour calculer automatiquement la répartition du CA par tiers client.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

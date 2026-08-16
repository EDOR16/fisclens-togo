"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";

export default function TresoreriePrevisionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" /> Prévisionnel de Trésorerie & BFR
        </h2>
        <p className="text-sm text-muted-foreground">Projection glissante sur 3 à 6 mois des encaissements / décaissements — Phase 4</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Plan de Trésorerie Prévisionnel</CardTitle>
            <Badge variant="outline">Phase 4</Badge>
          </div>
          <CardDescription>Intégration des échéances fiscales (TVA, IS, CNSS) et factures non échues</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ce module sera activé en Phase 4 avec les algorithmes d&apos;estimation statistique des dates d&apos;encaissement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

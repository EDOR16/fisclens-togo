"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export default function RfmPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Segmentation RFM Clients
        </h2>
        <p className="text-sm text-muted-foreground">Récence, Fréquence et Montant d&apos;achat — Phase 4</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Analyse Comportementale du Portefeuille</CardTitle>
            <Badge variant="outline">Phase 4</Badge>
          </div>
          <CardDescription>Catégorisation automatique : Champions, Fidèles, À risque, Inactifs</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ce module sera activé en Phase 4 avec les algorithmes d&apos;agrégation des écritures de ventes (Journal VENTES - 701).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

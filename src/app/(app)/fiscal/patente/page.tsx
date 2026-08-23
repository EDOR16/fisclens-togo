"use client";

import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/lib/utils";
import { AlertCircle, Download, FileCheck, Building2 } from "lucide-react";

export default function PatentePage() {
  const valeurLocative = 0;
  const chiffreAffaires = 0;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Taxe Professionnelle / Patente
            </h2>
            <Badge variant="warning" className="text-xs">
              À paramétrer (En attente de validation légale)
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Contribution des patentes assise sur la valeur locative des locaux professionnels et le CA
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.info("Téléchargement formulaire patente...") }>
          <Download className="h-4 w-4" /> Formulaire OTR
        </Button>
      </div>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-6 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm text-amber-900">
            <p className="font-semibold">Paramètres de barème communal en cours de validation</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Conformément à la section 6.5 du cahier des charges, les taux spécifiques par commune (Grand Lomé vs Régions)
              et catégories professionnelles sont marqués comme « à paramétrer » tant qu&apos;ils ne sont pas validés par l&apos;expert-comptable partenaire.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Éléments de base déclarative — Exercice 2025</CardTitle>
          <CardDescription>Données issues des écritures de loyers et du grand livre</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Valeur locative annuelle déclarée</p>
              <p className="text-xl font-bold font-mono mt-1 text-primary">{formatAmount(valeurLocative)} FCFA</p>
              <p className="text-xs text-muted-foreground mt-1">Aucune donnée immobilière enregistrée</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Chiffre d&apos;affaires N-1</p>
              <p className="text-xl font-bold font-mono mt-1">{formatAmount(chiffreAffaires)} FCFA</p>
              <p className="text-xs text-muted-foreground mt-1">Base d&apos;imposition complémentaire</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, Calendar } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

type FiscalEvent = {
  id: string;
  titre: string;
  echeance: string;
  type: string;
  regime: string;
  description: string;
  lien: string;
  statut: "A_JOUR" | "A_VENIR" | "URGENT" | "PASSE";
  joursRestants: number;
};

export default function CalendrierPage() {
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();

  // Échéancier officiel des impôts au Togo
  const events: FiscalEvent[] = [
    {
      id: "tva-mensuelle",
      titre: "Déclaration & Règlement TVA (CA3)",
      echeance: `${currentYear}-09-15`,
      type: "TVA",
      regime: "REEL_NORMAL & RSI",
      description: "Dépôt de la déclaration de TVA du mois M-1 et paiement du net dû à l'OTR.",
      lien: "/fiscal/tva",
      statut: "URGENT",
      joursRestants: 15,
    },
    {
      id: "irpp-cnss",
      titre: "Retenues IRPP & Cotisations CNSS / AMU",
      echeance: `${currentYear}-09-15`,
      type: "IRPP / Social",
      regime: "Tous régimes employeurs",
      description: "Versement des retenues IRPP et des cotisations sociales (Part salariale 9% [CNSS 4% + AMU 5%] & Part patronale 20% [CNSS 15% + AMU 5%]).",
      lien: "/fiscal/irpp",
      statut: "URGENT",
      joursRestants: 15,
    },
    {
      id: "is-acompte-3",
      titre: "3ème Acompte Provisionnel d'IS (25%)",
      echeance: `${currentYear}-09-30`,
      type: "Impôt Sociétés",
      regime: "REEL_NORMAL",
      description: "Paiement du 3ème quart de l'impôt sur les sociétés calculé sur la base de l'exercice N-1.",
      lien: "/fiscal/is",
      statut: "A_VENIR",
      joursRestants: 30,
    },
    {
      id: "is-acompte-4",
      titre: "4ème Acompte Provisionnel d'IS (25%)",
      echeance: `${currentYear}-12-31`,
      type: "Impôt Sociétés",
      regime: "REEL_NORMAL",
      description: "Paiement du 4ème et dernier acompte provisionnel d'IS de l'année.",
      lien: "/fiscal/is",
      statut: "A_VENIR",
      joursRestants: 122,
    },
    {
      id: "patente-annuelle",
      titre: "Taxe Professionnelle / Patente",
      echeance: `${currentYear + 1}-03-31`,
      type: "Patente",
      regime: "Tous régimes",
      description: "Contribution des patentes assise sur la valeur locative et le chiffre d'affaires.",
      lien: "/fiscal/patente",
      statut: "A_VENIR",
      joursRestants: 212,
    },
    {
      id: "dash-annuel",
      titre: "Déclaration Annuelle des Salaires (DASH)",
      echeance: `${currentYear + 1}-03-31`,
      type: "DASH",
      regime: "Tous régimes employeurs",
      description: "État récapitulatif annuel de la masse salariale brute, cotisations CNSS et IRPP versés.",
      lien: "/fiscal/irpp",
      statut: "A_VENIR",
      joursRestants: 212,
    },
    {
      id: "liasse-fiscale",
      titre: "Dépôt de la Liasse Fiscale & États Financiers SYSCOHADA",
      echeance: `${currentYear + 1}-04-30`,
      type: "Bilan & Liasse",
      regime: "REEL_NORMAL & RSI",
      description: "Dépôt des états financiers annuels certifiés et règlement du solde de liquidation de l'IS.",
      lien: "/comptabilite/etats-financiers",
      statut: "A_VENIR",
      joursRestants: 242,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" /> Calendrier Fiscal & Échéancier Réglementaire OTR Togo
          </h2>
          <p className="text-sm text-muted-foreground">
            Suivi automatisé des obligations déclaratives et paiements fiscaux selon le Code Général des Impôts
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-amber-900">Échéances du mois</CardDescription>
            <CardTitle className="text-2xl font-mono text-amber-700">2 déclarations</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-200 bg-blue-50/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-blue-900">Prochaine date limite</CardDescription>
            <CardTitle className="text-lg font-mono text-blue-950">15 du mois</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-emerald-900">Régime fiscal actif</CardDescription>
            <CardTitle className="text-lg font-mono text-emerald-800">RÉEL NORMAL</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">Calendrier des échéances {currentYear} – {currentYear + 1}</h3>
        <div className="grid gap-3">
          {events.map((evt) => (
            <Card key={evt.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{evt.titre}</p>
                      <Badge variant="outline" className="text-xs font-mono">{evt.type}</Badge>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">{evt.regime}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{evt.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <p className="text-xs font-mono font-semibold">
                      {new Date(evt.echeance).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Dans {evt.joursRestants} jours</p>
                  </div>
                  <Link href={evt.lien as any}>
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                      Traiter <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

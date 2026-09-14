"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Scale, Gavel, ShieldAlert } from "lucide-react";
import { formatAmount } from "@/lib/utils";
import { simulerControleOTR } from "@/lib/fiscal/sanctions-lpf";

export function SanctionsPanel() {
  const [droitsRappeles, setDroitsRappeles] = useState(1_000_000);
  const [moisRetard, setMoisRetard] = useState(3);
  const [mauvaiseFoi, setMauvaiseFoi] = useState(false);
  const [apresMED, setApresMED] = useState(false);
  const [refusCommunication, setRefusCommunication] = useState(false);
  const [preteNom, setPreteNom] = useState(false);
  const [retenuesNonEffectuees, setRetenuesNonEffectuees] = useState(0);
  const [dividendesVerses, setDividendesVerses] = useState(0);

  const result = simulerControleOTR({
    droitsRappeles,
    moisDeRetard: moisRetard,
    mauvaiseFoi,
    apresMiseEnDemeure: apresMED,
    refusCommunication,
    preteNom,
    montantRetenuesNonEffectuees: retenuesNonEffectuees || undefined,
    dividendesVerses: dividendesVerses || undefined,
  });

  const totalExigible = result.totalExigible;
  const ratioExigible = droitsRappeles > 0 ? totalExigible / droitsRappeles : 0;

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <CardTitle className="text-base">
              Simulateur d'exposition à un contrôle OTR
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Estimation préventive selon les sanctions du Livre des Procédures Fiscales togolais (Titre IV).
            Ce simulateur NE déclenche aucun redressement.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Résumé haut de page */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-blue-900">
              Droits rappelés
            </CardDescription>
            <CardTitle className="text-xl font-mono text-blue-950">
              {formatAmount(droitsRappeles)} FCFA
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-amber-900">
              Total sanctions
            </CardDescription>
            <CardTitle className="text-xl font-mono text-amber-700">
              {formatAmount(result.totalSanctions)} FCFA
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-200 bg-red-100/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-red-900">
              Total exigible OTR
            </CardDescription>
            <CardTitle className="text-2xl font-mono text-red-700 font-bold">
              {formatAmount(totalExigible)} FCFA
            </CardTitle>
            {ratioExigible > 1 && (
              <p className="text-[11px] text-red-600 mt-1">
                ×{ratioExigible.toFixed(2)} les droits initiaux
              </p>
            )}
          </CardHeader>
        </Card>
      </div>

      {/* Paramètres */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Paramètres du contrôle</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Droits rappelés (FCFA)</Label>
              <Input
                type="number"
                value={droitsRappeles}
                onChange={(e) => setDroitsRappeles(Math.max(0, Number(e.target.value)))}
                className="font-mono"
              />
            </div>
            <div>
              <Label className="text-xs">Mois de retard (min. 1)</Label>
              <Input
                type="number"
                min={1}
                value={moisRetard}
                onChange={(e) => setMoisRetard(Math.max(1, Number(e.target.value)))}
                className="font-mono"
              />
            </div>
            <div>
              <Label className="text-xs">Retenues non reversées (FCFA)</Label>
              <Input
                type="number"
                value={retenuesNonEffectuees}
                onChange={(e) => setRetenuesNonEffectuees(Math.max(0, Number(e.target.value)))}
                className="font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Amende 100% des retenues non effectuées (LPF art. 131)
              </p>
            </div>
            <div>
              <Label className="text-xs">Dividendes versés (FCFA)</Label>
              <Input
                type="number"
                value={dividendesVerses}
                onChange={(e) => setDividendesVerses(Math.max(0, Number(e.target.value)))}
                className="font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Amende 2M à 20M FCFA si défaut de déclaration des bénéficiaires effectifs
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Circonstances aggravantes
            </p>
            <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/40 cursor-pointer">
              <input
                type="checkbox"
                checked={mauvaiseFoi}
                onChange={(e) => setMauvaiseFoi(e.target.checked)}
                className="mt-1"
              />
              <div>
                <span className="text-sm font-medium">Mauvaise foi établie</span>
                <p className="text-xs text-muted-foreground">Majoration 40% (LPF art. 117)</p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/40 cursor-pointer">
              <input
                type="checkbox"
                checked={apresMED}
                onChange={(e) => setApresMED(e.target.checked)}
                className="mt-1"
              />
              <div>
                <span className="text-sm font-medium">Après mise en demeure</span>
                <p className="text-xs text-muted-foreground">
                  Amende renforcée + intérêt majoré
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/40 cursor-pointer">
              <input
                type="checkbox"
                checked={refusCommunication}
                onChange={(e) => setRefusCommunication(e.target.checked)}
                className="mt-1"
              />
              <div>
                <span className="text-sm font-medium">Refus de communication</span>
                <p className="text-xs text-muted-foreground">
                  Amende 2M / 4M FCFA (LPF art. 123)
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/40 cursor-pointer">
              <input
                type="checkbox"
                checked={preteNom}
                onChange={(e) => setPreteNom(e.target.checked)}
                className="mt-1"
              />
              <div>
                <span className="text-sm font-medium">Prête-nom / travestissement</span>
                <p className="text-xs text-muted-foreground">
                  Amende 50% des sommes (LPF art. 125-1)
                </p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Détail des sanctions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-red-600" />
            <CardTitle className="text-base">
              Détail des sanctions ({result.sanctions.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {result.sanctions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Aucune sanction applicable pour ces paramètres.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {result.sanctions.map((s, i) => (
                <div key={i} className="p-4 space-y-2 hover:bg-muted/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {s.type}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {s.article}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {s.commentaire}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-red-600">
                        {formatAmount(s.totalSanction)} FCFA
                      </p>
                    </div>
                  </div>
                  {(s.majorationFcfa > 0 ||
                    s.amendeFixe > 0 ||
                    s.interetRetard > 0) && (
                    <div className="flex gap-4 text-[10px] font-mono text-muted-foreground pl-1">
                      {s.majorationFcfa > 0 && (
                        <span>Majoration : {formatAmount(s.majorationFcfa)}</span>
                      )}
                      {s.amendeFixe > 0 && (
                        <span>Amende : {formatAmount(s.amendeFixe)}</span>
                      )}
                      {s.interetRetard > 0 && (
                        <span>Intérêt : {formatAmount(s.interetRetard)}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="border-t bg-muted/40 p-4 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Droits rappelés :</span>
              <span className="font-mono">{formatAmount(droitsRappeles)} FCFA</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total sanctions :</span>
              <span className="font-mono text-red-600">
                + {formatAmount(result.totalSanctions)} FCFA
              </span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-2 border-t">
              <span>TOTAL EXIGIBLE :</span>
              <span className="font-mono text-red-700">
                {formatAmount(totalExigible)} FCFA
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avertissement */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-4 flex gap-3 text-xs text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold">Simulation informative uniquement</p>
            <p className="mt-0.5 leading-relaxed">
              Cette estimation est basée sur les barèmes officiels du LPF togolais. Toute décision de
              redressement relève exclusivement de l'OTR. Les montants réels peuvent varier selon les
              circonstances, les négociations et les spécificités du dossier.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
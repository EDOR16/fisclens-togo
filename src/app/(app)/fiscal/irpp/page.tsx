"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/lib/utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, Calculator, Download, Play, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateTogoPayroll } from "@/lib/fiscal/togo-rules";

type TabType = "simulation" | "runs" | "annuelle";

// Barème progressif annuel CGI art. 74 (Loi n°2022-022 du 27/12/2022) — en FCFA/an
const TRANCHES_ANNUELLES = [
  { min: 0, max: 900_000, taux: 0, label: "0 – 900 000" },
  { min: 900_000, max: 3_000_000, taux: 3, label: "900 001 – 3 000 000" },
  { min: 3_000_000, max: 6_000_000, taux: 10, label: "3 000 001 – 6 000 000" },
  { min: 6_000_000, max: 9_000_000, taux: 15, label: "6 000 001 – 9 000 000" },
  { min: 9_000_000, max: 12_000_000, taux: 20, label: "9 000 001 – 12 000 000" },
  { min: 12_000_000, max: 15_000_000, taux: 25, label: "12 000 001 – 15 000 000" },
  { min: 15_000_000, max: 20_000_000, taux: 30, label: "15 000 001 – 20 000 000" },
  { min: 20_000_000, max: Infinity, taux: 35, label: "Plus de 20 000 000" },
];

function computeBaremeTranches(baseImposableAnnuelle: number) {
  return TRANCHES_ANNUELLES.map((t) => {
    if (baseImposableAnnuelle <= t.min) return { ...t, montantDansLaTranche: 0, impot: 0 };
    const assiette = Math.min(baseImposableAnnuelle, t.max === Infinity ? baseImposableAnnuelle : t.max) - t.min;
    return { ...t, montantDansLaTranche: assiette, impot: Math.round(assiette * t.taux / 100) };
  });
}

export default function IrppPage() {
  const [tab, setTab] = useState<TabType>("simulation");
  const [simuBrut, setSimuBrut] = useState(450_000);
  const [nbCharges, setNbCharges] = useState(0);

  const result = calculateTogoPayroll({
    salaireBrut: simuBrut,
    nombreChargesFamille: nbCharges,
  });

  // Barème annualisé pour affichage pédagogique
  const baseAnnuelle = result.baseImposableIrpp * 12;
  const tranches = computeBaremeTranches(baseAnnuelle);
  const irppBrutAnnuel = tranches.reduce((sum, t) => sum + t.impot, 0);
  const reductionAnnuelle = Math.min(nbCharges, 6) * 10_000 * 12;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> IRPP &amp; Paie Togo
            </h2>
            <Badge variant="outline" className="border-primary/40 text-primary text-xs">
              CGI art. 26 &amp; 74 — Loi n°2022-022
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Calcul IRPP progressif, CNSS (4% sal.) + AMU (5% sal.) et livre de paie conforme au CGI Togo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info("Export état récapitulatif (PDF) en cours de déploiement...")}>
            <Download className="h-4 w-4" /> État récapitulatif
          </Button>
          <Button size="sm" onClick={() => toast.info("Module gestion de la paie en cours...")}>
            <Play className="h-4 w-4" /> Nouveau run de paie
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b space-x-6">
        {([
          { key: "simulation", label: "Simulateur brut → net" },
          { key: "runs", label: "Historique des runs mensuels" },
          { key: "annuelle", label: "Déclaration annuelle (av. 31 mars)" },
        ] as { key: TabType; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── Onglet Simulation ─── */}
      {tab === "simulation" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" /> Paramètres du salarié
              </CardTitle>
              <CardDescription>Simulation instantanée — barème progressif CGI Togo art. 74</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="salaire-brut">Salaire de base brut mensuel (FCFA)</Label>
                <Input
                  id="salaire-brut"
                  type="number"
                  step="10000"
                  min={0}
                  value={simuBrut}
                  onChange={(e) => setSimuBrut(Math.max(0, Number(e.target.value)))}
                  className="font-mono text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nb-charges">Nombre de charges de famille (enfants à charge, max 6)</Label>
                <Input
                  id="nb-charges"
                  type="number"
                  min={0}
                  max={6}
                  value={nbCharges}
                  onChange={(e) => setNbCharges(Math.min(6, Math.max(0, Number(e.target.value))))}
                  className="font-mono text-base"
                />
              </div>

              {/* Note légale */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-1.5 text-xs text-blue-800">
                <p className="font-semibold flex items-center gap-1"><Info className="h-3.5 w-3.5" /> Règles appliquées (CGI Togo &amp; Décret AMU)</p>
                <p>• CNSS salarié : <strong>4%</strong> + AMU salarié : <strong>5%</strong> = <strong>9%</strong> prélevé sur brut</p>
                <p>• Charge patronale : CNSS <strong>15%</strong> + AMU <strong>5%</strong> = <strong>20%</strong></p>
                <p>• Abattement frais professionnels : <strong>28%</strong> (plafond 833 333 FCFA/mois)</p>
                <p>• Base arrondie au millier inférieur <em>(CGI art. 74)</em></p>
                <p>• Réduction charge de famille : <strong>10 000 FCFA/pers./mois</strong> (max 6 pers.)</p>
              </div>
            </CardContent>
          </Card>

          {/* Résultat fiche de paie */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base text-primary">Bulletin de salaire simplifié</CardTitle>
              <CardDescription>Montants en FCFA entiers — CGI / CNSS / AMU Togo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              {/* GAINS */}
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-2 mb-1">Éléments de rémunération</p>
              <div className="flex justify-between text-sm py-1.5 border-b">
                <span className="text-muted-foreground">Salaire de base brut</span>
                <span className="font-mono font-semibold">{formatAmount(result.salaireBrut)} FCFA</span>
              </div>

              {/* DÉDUCTIONS SOCIALES */}
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-3 mb-1">Cotisations salariales</p>
              <div className="flex justify-between text-sm py-1.5 border-b text-red-600">
                <span>− CNSS vieillesse-invalidité (4%)</span>
                <span className="font-mono font-medium">−{formatAmount(result.cnssSalariale)}</span>
              </div>
              <div className="flex justify-between text-sm py-1.5 border-b text-red-600">
                <span>− AMU — Assurance Maladie Universelle (5%)</span>
                <span className="font-mono font-medium">−{formatAmount(result.amuSalariale)}</span>
              </div>
              <div className="flex justify-between text-sm py-1.5 border-b text-muted-foreground">
                <span>= Brut après cotisations sociales</span>
                <span className="font-mono">{formatAmount(result.brutApresCotisations)}</span>
              </div>

              {/* BASE IRPP */}
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-3 mb-1">Calcul de l&apos;IRPP</p>
              <div className="flex justify-between text-sm py-1.5 border-b text-muted-foreground">
                <span>− Abattement forfaitaire (28%)</span>
                <span className="font-mono">−{formatAmount(result.abattementFraisPro)}</span>
              </div>
              <div className="flex justify-between text-sm py-1.5 border-b text-muted-foreground">
                <span>= Base imposable IRPP</span>
                <span className="font-mono">{formatAmount(result.baseImposableIrpp)}</span>
              </div>
              <div className="flex justify-between text-sm py-1.5 border-b text-muted-foreground">
                <span>IRPP brut (barème progressif)</span>
                <span className="font-mono">{formatAmount(result.irppBrut)}</span>
              </div>
              {result.reductionChargeFamille > 0 && (
                <div className="flex justify-between text-sm py-1.5 border-b text-green-700">
                  <span>− Réduction charge famille ({Math.min(nbCharges, 6)} pers. × 10 000)</span>
                  <span className="font-mono">−{formatAmount(result.reductionChargeFamille)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm py-1.5 border-b text-red-600 font-medium">
                <span>− IRPP net retenu à la source</span>
                <span className="font-mono">−{formatAmount(result.irppNet)}</span>
              </div>

              {/* NET */}
              <div className="flex justify-between text-base py-2.5 font-bold text-green-700 bg-green-100/60 px-3 rounded-md mt-3">
                <span>NET À PAYER AU SALARIÉ</span>
                <span className="font-mono">{formatAmount(result.netAPayer)} FCFA</span>
              </div>

              {/* Coût employeur */}
              <div className="mt-4 pt-3 border-t space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coût total employeur</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>+ CNSS patronale (15%) + AMU patronale (5%)</span>
                  <span className="font-mono">+{formatAmount(result.totalChargePatronale)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-foreground">
                  <span>Coût total employeur</span>
                  <span className="font-mono">{formatAmount(result.coutTotalEmployeur)} FCFA</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau du barème progressif */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Détail du calcul par tranche — Barème progressif annuel</CardTitle>
              <CardDescription>
                Base imposable annualisée : {formatAmount(baseAnnuelle)} FCFA
                {" · "}CGI art. 74, Loi n°2022-022 du 27/12/2022
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tranche de revenu (FCFA/an)</TableHead>
                    <TableHead className="text-right">Taux</TableHead>
                    <TableHead className="text-right">Assiette dans la tranche</TableHead>
                    <TableHead className="text-right">Impôt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tranches.map((t) => (
                    <TableRow
                      key={t.min}
                      className={t.montantDansLaTranche > 0 ? "bg-primary/5" : "text-muted-foreground"}
                    >
                      <TableCell className="text-xs">{t.label}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{t.taux}%</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {t.montantDansLaTranche > 0 ? formatAmount(t.montantDansLaTranche) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-medium">
                        {t.impot > 0 ? formatAmount(t.impot) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total brut */}
                  <TableRow className="bg-muted/30 font-semibold text-sm">
                    <TableCell colSpan={3}>IRPP brut total (annuel)</TableCell>
                    <TableCell className="text-right font-mono text-primary">{formatAmount(irppBrutAnnuel)}</TableCell>
                  </TableRow>
                  {reductionAnnuelle > 0 && (
                    <TableRow className="text-green-700 text-sm">
                      <TableCell colSpan={3}>
                        − Réduction charges de famille ({Math.min(nbCharges, 6)} pers. × 10 000 × 12 mois)
                      </TableCell>
                      <TableCell className="text-right font-mono">−{formatAmount(reductionAnnuelle)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow className="bg-primary/10 font-bold text-base">
                    <TableCell colSpan={3}>IRPP NET ANNUEL (≈ {formatAmount(result.irppNet * 12)} FCFA)</TableCell>
                    <TableCell className="text-right font-mono text-green-700">
                      {formatAmount(Math.max(0, irppBrutAnnuel - reductionAnnuelle))} FCFA
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Onglet Historique ─── */}
      {tab === "runs" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Runs de paie enregistrés</CardTitle>
            <CardDescription>Aucun run de paie n&apos;a encore été généré dans cet environnement.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-dashed border-border bg-muted/20 p-8 text-center">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Aucun bulletin de paie disponible</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Les montants CNSS, AMU et IRPP apparaîtront ici après la première génération d&apos;un run réel.
              </p>
              <Button size="sm" className="mt-4" onClick={() => toast.info("Module de gestion de la paie en cours de déploiement...")}>
                <Play className="h-4 w-4" /> Démarrer un run de paie
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Onglet Déclaration annuelle ─── */}
      {tab === "annuelle" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Déclaration Annuelle des Salaires et Honoraires (DASH)</CardTitle>
            <CardDescription>
              À déposer avant le 31 mars de l&apos;année N+1 (CGI Togo / LPF art. 65)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-amber-50 border-amber-200 space-y-2">
              <p className="text-sm font-semibold text-amber-800">Aucune donnée fiscale pour l&apos;instant</p>
              <p className="text-xs text-amber-700">
                Les cumuls annuels de masse salariale, CNSS, AMU et IRPP seront calculés automatiquement
                dès qu&apos;un exercice réel sera saisi et clôturé.
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold">Champs attendus dans la déclaration annuelle :</p>
              <p>• Masse salariale brute totale versée aux salariés</p>
              <p>• Total cotisations CNSS (salariale + patronale)</p>
              <p>• Total cotisations AMU (salariale + patronale)</p>
              <p>• Total IRPP retenu à la source</p>
              <p>• Déclaration des honoraires versés aux prestataires (retenue à la source 10%)</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

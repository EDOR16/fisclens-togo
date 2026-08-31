"use client";

import { useState, useEffect } from "react";
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
import { Users, Calculator, Download, Play, Info, RefreshCw, CheckCircle2, FileSpreadsheet, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateTogoPayroll } from "@/lib/fiscal/togo-rules";

type TabType = "simulation" | "runs" | "annuelle";

type IrppApiData = {
  tenant: { name: string; nif: string; regime: string };
  exercice: string;
  periode: string | null;
  hasEcritures: boolean;
  hasPayrollEcritures: boolean;
  totals: {
    totalBrut: number;
    totalCnssSalariale: number;
    totalCnssPatronale: number;
    totalIrpp: number;
    totalNet: number;
    coutTotalEmployeur: number;
    nbEcritures: number;
  };
  monthlyHistory: Array<{
    mois: string;
    brut: number;
    cnssPatronale: number;
    irpp: number;
    net: number;
    nbEcritures: number;
  }>;
};

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
  const [exercice, setExercice] = useState(new Date().getFullYear().toString());

  // API state
  const [apiData, setApiData] = useState<IrppApiData | null>(null);
  const [loadingApi, setLoadingApi] = useState(false);

  // Simulation inputs
  const [simuBrut, setSimuBrut] = useState(450_000);
  const [nbCharges, setNbCharges] = useState(0);

  async function loadFromApi() {
    setLoadingApi(true);
    try {
      const res = await fetch(`/api/v1/fiscal/irpp?exercice=${exercice}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const json: IrppApiData = await res.json();
      setApiData(json);
      if (json.hasPayrollEcritures && json.totals.totalBrut > 0) {
        setSimuBrut(json.totals.totalBrut);
      }
    } catch (err) {
      toast.error("Impossible de charger les données de paie comptable");
    } finally {
      setLoadingApi(false);
    }
  }

  useEffect(() => {
    loadFromApi();
  }, [exercice]);

  const result = calculateTogoPayroll({
    salaireBrut: simuBrut,
    nombreChargesFamille: nbCharges,
  });

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
              <Users className="h-5 w-5 text-primary" /> IRPP &amp; Paie Togo (SYSCOHADA &amp; OTR)
            </h2>
            <Badge variant="outline" className="border-primary/40 text-primary text-xs">
              CGI art. 26 &amp; 74 — Loi n°2022-022
            </Badge>
            {apiData?.hasPayrollEcritures && (
              <Badge className="bg-emerald-600 text-white text-xs gap-1 hover:bg-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Écritures de paie détectées
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Calcul IRPP progressif, CNSS (4% sal. + 15% pat.), AMU (5% sal. + 5% pat.) et traçabilité comptable (661/664/447/431)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="exercice-irpp" className="text-sm shrink-0">Exercice :</Label>
            <Input
              id="exercice-irpp"
              type="number"
              value={exercice}
              onChange={(e) => setExercice(e.target.value)}
              className="w-24 font-mono text-sm"
              min={2020}
              max={2030}
            />
          </div>
          <Button variant="outline" size="sm" onClick={loadFromApi} disabled={loadingApi}>
            <RefreshCw className={cn("h-4 w-4 mr-1", loadingApi && "animate-spin")} />
            Actualiser
          </Button>
          <Button size="sm" onClick={() => toast.info("Génération de l'état récapitulatif en cours...")}>
            <Download className="h-4 w-4 mr-1" /> Exporter état (PDF)
          </Button>
        </div>
      </div>

      {/* KPI Cards si données comptables */}
      {apiData && (
        <div className="grid sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-semibold">Masse Salariale Brute (661)</CardDescription>
              <CardTitle className="text-xl font-mono text-primary">
                {formatAmount(apiData.totals.totalBrut)} FCFA
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-semibold">IRPP Retenu (4471)</CardDescription>
              <CardTitle className="text-xl font-mono text-rose-600">
                {formatAmount(apiData.totals.totalIrpp)} FCFA
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-semibold">Charges Patronales (664)</CardDescription>
              <CardTitle className="text-xl font-mono text-amber-700">
                {formatAmount(apiData.totals.totalCnssPatronale)} FCFA
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-semibold text-emerald-900">Salaires Nets (421)</CardDescription>
              <CardTitle className="text-xl font-mono text-emerald-800">
                {formatAmount(apiData.totals.totalNet)} FCFA
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b space-x-6">
        {([
          { key: "simulation", label: "Simulateur brut → net" },
          { key: "runs", label: "Historique comptable mensuel" },
          { key: "annuelle", label: "Déclaration annuelle DASH (OTR)" },
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

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-1.5 text-xs text-blue-800">
                <p className="font-semibold flex items-center gap-1"><Info className="h-3.5 w-3.5" /> Règles appliquées (CGI Togo &amp; Décret AMU)</p>
                <p>• CNSS salarié : <strong>4%</strong> + AMU salarié : <strong>5%</strong> = <strong>9%</strong> prélevé sur brut</p>
                <p>• Charge patronale : CNSS <strong>15%</strong> + AMU <strong>5%</strong> = <strong>20%</strong></p>
                <p>• Abattement frais professionnels : <strong>28%</strong> (plafond 833 333 FCFA/mois)</p>
                <p>• Réduction charge de famille : <strong>10 000 FCFA/pers./mois</strong> (max 6 pers.)</p>
              </div>
            </CardContent>
          </Card>

          {/* Résultat fiche de paie */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base text-primary">Bulletin de salaire simulé</CardTitle>
              <CardDescription>Montants en FCFA entiers — CGI / CNSS / AMU Togo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-2 mb-1">Éléments de rémunération</p>
              <div className="flex justify-between text-sm py-1.5 border-b">
                <span className="text-muted-foreground">Salaire de base brut</span>
                <span className="font-mono font-semibold">{formatAmount(result.salaireBrut)} FCFA</span>
              </div>

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

              <div className="flex justify-between text-base py-2.5 font-bold text-green-700 bg-green-100/60 px-3 rounded-md mt-3">
                <span>NET À PAYER AU SALARIÉ</span>
                <span className="font-mono">{formatAmount(result.netAPayer)} FCFA</span>
              </div>

              <div className="mt-4 pt-3 border-t space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coût total employeur</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>+ Charges patronales CNSS (15%) + AMU (5%)</span>
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

      {/* ─── Onglet Historique comptable mensuel ─── */}
      {tab === "runs" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" /> Mouvements de paie enregistrés dans le Journal — Exercice {exercice}
            </CardTitle>
            <CardDescription>
              Cumuls calculés à partir de vos écritures SYSCOHADA (Comptes 661, 664, 447, 421)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {apiData?.monthlyHistory && apiData.monthlyHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mois</TableHead>
                    <TableHead className="text-right">Masse Brute (661)</TableHead>
                    <TableHead className="text-right">Patronale (664)</TableHead>
                    <TableHead className="text-right">IRPP Retenu (447)</TableHead>
                    <TableHead className="text-right">Net versé (421)</TableHead>
                    <TableHead className="text-right">Écritures</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiData.monthlyHistory.map((m) => (
                    <TableRow key={m.mois}>
                      <TableCell className="font-semibold font-mono">{m.mois}</TableCell>
                      <TableCell className="text-right font-mono">{formatAmount(m.brut)}</TableCell>
                      <TableCell className="text-right font-mono text-amber-700">{formatAmount(m.cnssPatronale)}</TableCell>
                      <TableCell className="text-right font-mono text-rose-600 font-medium">{formatAmount(m.irpp)}</TableCell>
                      <TableCell className="text-right font-mono text-emerald-700 font-bold">{formatAmount(m.net)}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">{m.nbEcritures}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/40 font-bold">
                    <TableCell>TOTAL ANNUEL</TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(apiData.totals.totalBrut)}</TableCell>
                    <TableCell className="text-right font-mono text-amber-700">{formatAmount(apiData.totals.totalCnssPatronale)}</TableCell>
                    <TableCell className="text-right font-mono text-rose-600">{formatAmount(apiData.totals.totalIrpp)}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-700">{formatAmount(apiData.totals.totalNet)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{apiData.totals.nbEcritures}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Aucune écriture de paie enregistrée sur l&apos;exercice {exercice}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Passez les écritures de salaires dans le Journal des OD ou PAIE (comptes 661, 664, 447, 431, 421) pour les voir apparaître automatiquement.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Onglet Déclaration annuelle DASH ─── */}
      {tab === "annuelle" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Déclaration Annuelle des Salaires et Honoraires (DASH — OTR)</CardTitle>
            <CardDescription>
              À déposer avant le 31 mars {Number(exercice) + 1} (CGI Togo / LPF art. 65)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rubrique de la déclaration DASH</TableHead>
                  <TableHead className="text-right">Montant cumulé (FCFA)</TableHead>
                  <TableHead>Compte SYSCOHADA associé</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Masse salariale brute annuelle</TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">
                    {formatAmount(apiData?.totals.totalBrut || 0)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">661 — Salaires du personnel</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Cotisations patronales CNSS &amp; AMU</TableCell>
                  <TableCell className="text-right font-mono font-semibold text-amber-700">
                    {formatAmount(apiData?.totals.totalCnssPatronale || 0)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">664 — Charges sociales patronales</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Total IRPP retenu à la source</TableCell>
                  <TableCell className="text-right font-mono font-semibold text-rose-600">
                    {formatAmount(apiData?.totals.totalIrpp || 0)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">4471 — Retenues IRPP</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Salaires nets versés</TableCell>
                  <TableCell className="text-right font-mono font-semibold text-emerald-700">
                    {formatAmount(apiData?.totals.totalNet || 0)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">421 — Personnel, rémunérations dues</TableCell>
                </TableRow>
                <TableRow className="bg-primary/10 font-bold">
                  <TableCell>Coût total employeur</TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    {formatAmount(apiData?.totals.coutTotalEmployeur || 0)} FCFA
                  </TableCell>
                  <TableCell className="text-xs font-mono">Classe 66</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

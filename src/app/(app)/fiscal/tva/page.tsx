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
import { Receipt, Download, FileText, Calculator, Info, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateTogoTva } from "@/lib/fiscal/togo-rules";

type TabType = "bordereau" | "simulation";

type TvaApiData = {
  tenant: { name: string; nif: string; regime: string };
  periode: string;
  calculation: {
    ventesTaxablesHt: number;
    tvaCollectee: number;
    tvaDeductibleImmo: number;
    tvaDeductibleBiensServices: number;
    tvaDeductibleApresProrata: number;
    creditReportePrecedent: number;
    tvaNetteDue: number;
    creditReportable: number;
    prorataApplique: number;
  };
};

export default function TvaPage() {
  const [tab, setTab] = useState<TabType>("bordereau");
  const [periode, setPeriode] = useState(new Date().toISOString().slice(0, 7));

  // État de la donnée comptable chargée depuis l'API
  const [apiData, setApiData] = useState<TvaApiData | null>(null);
  const [loadingApi, setLoadingApi] = useState(false);
  const [hasApiData, setHasApiData] = useState(false);

  // Inputs SAISIE manuelle (onglet simulation — permet ajustement manuel)
  const [ventesTaxables, setVentesTaxables] = useState(0);
  const [ventesExonerees, setVentesExonerees] = useState(0);
  const [tvaImmo, setTvaImmo] = useState(0);
  const [tvaBiensServices, setTvaBiensServices] = useState(0);
  const [creditPrecedent, setCreditPrecedent] = useState(0);
  const [prorataPct, setProrataPct] = useState(100);

  // Charger données comptables depuis l'API
  async function loadFromApi() {
    setLoadingApi(true);
    try {
      const res = await fetch(`/api/v1/fiscal/tva?periode=${periode}`);
      if (!res.ok) throw new Error("Erreur API");
      const data: TvaApiData = await res.json();
      setApiData(data);
      setHasApiData(true);
      // Pré-remplir les champs avec les données comptables réelles
      const c = data.calculation;
      setVentesTaxables(c.ventesTaxablesHt || 0);
      setTvaImmo(c.tvaDeductibleImmo || 0);
      setTvaBiensServices(c.tvaDeductibleBiensServices || 0);
      toast.success(`Données comptables chargées pour ${data.periode} — ${data.tenant.name}`);
    } catch (err) {
      toast.error("Impossible de charger les données comptables");
    } finally {
      setLoadingApi(false);
    }
  }

  useEffect(() => {
    loadFromApi();
  }, []);

  const result = calculateTogoTva({
    ventesTaxablesHt: ventesTaxables,
    ventesExonereesHt: ventesExonerees,
    achatsImmoTva: tvaImmo,
    achatsBiensServicesTva: tvaBiensServices,
    creditReportePrecedent: creditPrecedent,
    prorataDeductionPct: prorataPct,
  });

  const hasProrata = prorataPct < 100;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" /> Déclaration de TVA (Taux : 18%)
            </h2>
            <Badge variant="outline" className="border-primary/40 text-primary text-xs">
              CGI Togo art. 195 — Taux unique 18%
            </Badge>
            {hasApiData && (
              <Badge className="bg-emerald-600 text-white text-xs gap-1 hover:bg-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Données comptables réelles
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            État récapitulatif mensuel — montants calculés automatiquement depuis vos écritures comptables
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadFromApi} disabled={loadingApi}>
            <RefreshCw className={cn("h-4 w-4 mr-1", loadingApi && "animate-spin")} />
            Actualiser depuis la comptabilité
          </Button>
          <Button size="sm" onClick={() => toast.info("Génération formulaire OTR (CA3) en cours de déploiement...")}>
            <Download className="h-4 w-4" /> Formulaire OTR (PDF)
          </Button>
        </div>
      </div>

      {/* Période */}
      <div className="flex items-center gap-3">
        <Label htmlFor="periode-tva" className="text-sm font-medium shrink-0">
          Période déclarée :
        </Label>
        <Input
          id="periode-tva"
          type="month"
          value={periode}
          onChange={(e) => setPeriode(e.target.value)}
          className="w-36 text-sm font-mono"
        />
        <Button variant="outline" size="sm" onClick={loadFromApi} disabled={loadingApi}>
          Charger
        </Button>
        {apiData && (
          <span className="text-xs text-muted-foreground">
            Dossier : <strong>{apiData.tenant.name}</strong> — NIF : {apiData.tenant.nif || "Non renseigné"}
          </span>
        )}
      </div>

      {/* Bandeau info connexion comptable */}
      {hasApiData && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          <div>
            <p className="font-semibold">Données chargées depuis vos écritures comptables SYSCOHADA</p>
            <p className="text-xs mt-0.5">
              TVA collectée calculée depuis les comptes 443x (TVA facturée) et les ventes Classe 70.
              TVA déductible depuis les comptes 445x (4451 = immobilisations, 4452 = achats courants).
              Vous pouvez ajuster les montants dans l&apos;onglet « Saisie des données ».
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b space-x-6">
        {([
          { key: "bordereau", label: "Bordereau de déclaration" },
          { key: "simulation", label: "Saisie / Ajustements manuels" },
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

      {/* ─── Onglet Saisie / Ajustements ─── */}
      {tab === "simulation" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" /> TVA Collectée
              </CardTitle>
              <CardDescription>
                Pré-rempli depuis les comptes 70x (Ventes). Modifiable si nécessaire.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ventes-taxables">Ventes taxables HT (18%) — FCFA</Label>
                <Input id="ventes-taxables" type="number" step="10000" min={0} value={ventesTaxables}
                  onChange={(e) => setVentesTaxables(Math.max(0, Number(e.target.value)))} className="font-mono" />
                <p className="text-xs text-muted-foreground">TVA collectée : {formatAmount(result.tvaCollectee)} FCFA</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ventes-exo">Ventes exonérées / exportations HT — FCFA</Label>
                <Input id="ventes-exo" type="number" step="10000" min={0} value={ventesExonerees}
                  onChange={(e) => setVentesExonerees(Math.max(0, Number(e.target.value)))} className="font-mono" />
                <p className="text-xs text-muted-foreground">Ces ventes entrent dans le calcul du prorata de déduction</p>
              </div>

              {ventesExonerees > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
                  <p className="font-semibold"><Info className="inline h-3.5 w-3.5 mr-1" />Prorata de déduction (CGI art. 205)</p>
                  <div className="mt-2 space-y-1.5">
                    <Label htmlFor="prorata" className="text-amber-800">Prorata de déduction (%)</Label>
                    <Input id="prorata" type="number" step="1" min={1} max={100} value={prorataPct}
                      onChange={(e) => setProrataPct(Math.min(100, Math.max(1, Number(e.target.value))))}
                      className="font-mono bg-white" />
                    <Button type="button" variant="outline" size="sm" className="w-full text-amber-800 border-amber-400"
                      onClick={() => {
                        const total = ventesTaxables + ventesExonerees;
                        if (total > 0) setProrataPct(Math.round((ventesTaxables / total) * 100));
                      }}>
                      Calculer le prorata automatiquement
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" /> TVA Déductible
              </CardTitle>
              <CardDescription>
                Pré-rempli depuis les comptes 4451 (immos) et 4452 (achats courants)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="tva-immo">TVA sur immobilisations (compte 4451) — FCFA</Label>
                <Input id="tva-immo" type="number" step="10000" min={0} value={tvaImmo}
                  onChange={(e) => setTvaImmo(Math.max(0, Number(e.target.value)))} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tva-bs">TVA sur autres biens et services (compte 4452) — FCFA</Label>
                <Input id="tva-bs" type="number" step="10000" min={0} value={tvaBiensServices}
                  onChange={(e) => setTvaBiensServices(Math.max(0, Number(e.target.value)))} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="credit-precedent">Crédit de TVA reporté du mois précédent — FCFA</Label>
                <Input id="credit-precedent" type="number" step="10000" min={0} value={creditPrecedent}
                  onChange={(e) => setCreditPrecedent(Math.max(0, Number(e.target.value)))} className="font-mono" />
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 space-y-1">
                <p className="font-semibold"><Info className="inline h-3.5 w-3.5 mr-1" />Règles CGI Togo (art. 195–209)</p>
                <p>• Taux unique TVA : <strong>18%</strong></p>
                <p>• Déduction immédiate sur les achats grevés de TVA</p>
                <p>• Le crédit de TVA est reportable sur la déclaration suivante</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── KPI cards (toujours visibles) ─── */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">TVA Collectée (18%)</CardDescription>
            <CardTitle className="text-xl font-mono text-primary">{formatAmount(result.tvaCollectee)} FCFA</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">
              TVA Déductible{hasProrata ? ` (prorata ${prorataPct}%)` : ""}
            </CardDescription>
            <CardTitle className="text-xl font-mono text-blue-600">
              {formatAmount(result.tvaDeductibleApresProrata)} FCFA
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">Crédit reporté</CardDescription>
            <CardTitle className="text-xl font-mono text-muted-foreground">{formatAmount(result.creditReportePrecedent)} FCFA</CardTitle>
          </CardHeader>
        </Card>
        <Card className={result.tvaNetteDue > 0 ? "border-primary bg-primary/5" : "border-blue-400 bg-blue-50"}>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-primary">
              {result.tvaNetteDue > 0 ? "TVA Nette à reverser" : "Crédit à reporter"}
            </CardDescription>
            <CardTitle className={cn("text-xl font-mono", result.tvaNetteDue > 0 ? "text-green-700" : "text-blue-600")}>
              {formatAmount(result.tvaNetteDue > 0 ? result.tvaNetteDue : result.creditReportable)} FCFA
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* ─── Bordereau officiel ─── */}
      {tab === "bordereau" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Bordereau de Déclaration TVA (CA3) — Période : <span className="font-mono text-primary">{periode}</span></CardTitle>
                <CardDescription className="mt-1">
                  Conforme au modèle officiel OTR — CGI Togo art. 195 à 209
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">Ligne</TableHead>
                  <TableHead>Désignation des opérations</TableHead>
                  <TableHead className="text-right">Base HT (FCFA)</TableHead>
                  <TableHead className="text-right">Taux</TableHead>
                  <TableHead className="text-right">Montant TVA (FCFA)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Section I */}
                <TableRow className="bg-muted/40">
                  <TableCell colSpan={5} className="font-semibold text-xs uppercase">
                    I. CHIFFRE D&apos;AFFAIRES &amp; TVA COLLECTÉE
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs text-muted-foreground">01</TableCell>
                  <TableCell>Opérations taxables à 18% (ventes de biens et services)</TableCell>
                  <TableCell className="text-right font-mono">{formatAmount(ventesTaxables)}</TableCell>
                  <TableCell className="text-right font-mono">18%</TableCell>
                  <TableCell className="text-right font-mono font-medium">{formatAmount(result.tvaCollectee)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs text-muted-foreground">02</TableCell>
                  <TableCell>Opérations exonérées ou hors champ (exportations, etc.)</TableCell>
                  <TableCell className="text-right font-mono">{formatAmount(ventesExonerees)}</TableCell>
                  <TableCell className="text-right font-mono">0%</TableCell>
                  <TableCell className="text-right font-mono">0</TableCell>
                </TableRow>
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell colSpan={4}>TOTAL TVA COLLECTÉE (A)</TableCell>
                  <TableCell className="text-right font-mono text-primary">{formatAmount(result.tvaCollectee)}</TableCell>
                </TableRow>

                {/* Section II */}
                <TableRow className="bg-muted/40">
                  <TableCell colSpan={5} className="font-semibold text-xs uppercase">
                    II. DÉDUCTIONS &amp; TVA RÉCUPÉRABLE
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs text-muted-foreground">03</TableCell>
                  <TableCell>TVA sur immobilisations (compte 4451)</TableCell>
                  <TableCell className="text-right font-mono">—</TableCell>
                  <TableCell className="text-right font-mono">18%</TableCell>
                  <TableCell className="text-right font-mono font-medium">{formatAmount(result.tvaDeductibleImmo)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs text-muted-foreground">04</TableCell>
                  <TableCell>TVA sur autres biens et services (compte 4452)</TableCell>
                  <TableCell className="text-right font-mono">—</TableCell>
                  <TableCell className="text-right font-mono">18%</TableCell>
                  <TableCell className="text-right font-mono font-medium">{formatAmount(result.tvaDeductibleBiensServices)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs text-muted-foreground">05</TableCell>
                  <TableCell>Prorata général de déduction applicable</TableCell>
                  <TableCell className="text-right font-mono" colSpan={2}>{result.prorataApplique}%</TableCell>
                  <TableCell className="text-right font-mono font-medium">{formatAmount(result.tvaDeductibleApresProrata)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs text-muted-foreground">06</TableCell>
                  <TableCell>Crédit de TVA reporté du mois précédent</TableCell>
                  <TableCell className="text-right font-mono" colSpan={2}>—</TableCell>
                  <TableCell className="text-right font-mono font-medium">{formatAmount(result.creditReportePrecedent)}</TableCell>
                </TableRow>
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell colSpan={4}>TOTAL TVA DÉDUCTIBLE (B)</TableCell>
                  <TableCell className="text-right font-mono text-blue-600">
                    {formatAmount(result.tvaDeductibleApresProrata + result.creditReportePrecedent)}
                  </TableCell>
                </TableRow>

                {/* Section III */}
                {result.tvaNetteDue > 0 ? (
                  <TableRow className="bg-primary/10 font-bold text-base">
                    <TableCell colSpan={4}>III. TVA NETTE DUE À L&apos;OTR (A − B)</TableCell>
                    <TableCell className="text-right font-mono text-green-700">{formatAmount(result.tvaNetteDue)}</TableCell>
                  </TableRow>
                ) : (
                  <TableRow className="bg-blue-50 font-bold text-base">
                    <TableCell colSpan={4}>III. CRÉDIT DE TVA REPORTABLE (B &gt; A)</TableCell>
                    <TableCell className="text-right font-mono text-blue-600">{formatAmount(result.creditReportable)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

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
import { Receipt, Download, FileText, Calculator, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateTogoTva } from "@/lib/fiscal/togo-rules";

type TabType = "simulation" | "bordereau";

export default function TvaPage() {
  const [tab, setTab] = useState<TabType>("bordereau");
  const [periode, setPeriode] = useState("2025-08");

  // Inputs
  const [ventesTaxables, setVentesTaxables] = useState(0);
  const [ventesExonerees, setVentesExonerees] = useState(0);
  const [tvaImmo, setTvaImmo] = useState(0);
  const [tvaBiensServices, setTvaBiensServices] = useState(0);
  const [creditPrecedent, setCreditPrecedent] = useState(0);
  const [prorataPct, setProrataPct] = useState(100);

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
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            État récapitulatif mensuel, prorata de déduction et net à reverser à l&apos;OTR (échéance : 15 du mois M+1)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info("Export état des déductions TVA en cours de déploiement...")}>
            <FileText className="h-4 w-4" /> État des déductions
          </Button>
          <Button size="sm" onClick={() => toast.info("Génération formulaire OTR (CA3) en cours de déploiement...")}>
            <Download className="h-4 w-4" /> Formulaire OTR (PDF)
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b space-x-6">
        {([
          { key: "bordereau", label: "Bordereau de déclaration" },
          { key: "simulation", label: "Saisie des données" },
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

      {/* ─── Onglet Saisie ─── */}
      {tab === "simulation" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" /> TVA Collectée
              </CardTitle>
              <CardDescription>Ventes HT de la période — La TVA à 18% est calculée automatiquement</CardDescription>
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
                  <p>En présence de ventes exonérées, la TVA déductible doit être réduite d&apos;un coefficient (prorata).</p>
                  <div className="mt-2 space-y-1.5">
                    <Label htmlFor="prorata" className="text-amber-800">Prorata de déduction (%)</Label>
                    <Input id="prorata" type="number" step="1" min={1} max={100} value={prorataPct}
                      onChange={(e) => setProrataPct(Math.min(100, Math.max(1, Number(e.target.value))))}
                      className="font-mono bg-white" />
                    <p className="text-xs">Formule = Ventes taxables / (Ventes taxables + Ventes exonérées) × 100</p>
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
              <CardDescription>TVA figurant sur les factures d&apos;achats éligibles à la déduction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="tva-immo">TVA sur immobilisations (investissements) — FCFA</Label>
                <Input id="tva-immo" type="number" step="10000" min={0} value={tvaImmo}
                  onChange={(e) => setTvaImmo(Math.max(0, Number(e.target.value)))} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tva-bs">TVA sur autres biens et services (achats d&apos;exploitation) — FCFA</Label>
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
                <p>• Déduction immédiate sur les achats de biens et services grevés de TVA</p>
                <p>• Le crédit de TVA est reportable sur la déclaration suivante</p>
                <p>• Le prorata s&apos;applique aux assujettis partiels</p>
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
                <CardTitle className="text-base">Bordereau de Déclaration TVA (CA3) — Période
                  <Input
                    type="month"
                    value={periode}
                    onChange={(e) => setPeriode(e.target.value)}
                    className="inline-block ml-2 w-36 h-7 text-xs font-mono"
                  />
                </CardTitle>
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
                  <TableCell>TVA sur immobilisations (investissements)</TableCell>
                  <TableCell className="text-right font-mono">—</TableCell>
                  <TableCell className="text-right font-mono">18%</TableCell>
                  <TableCell className="text-right font-mono font-medium">{formatAmount(result.tvaDeductibleImmo)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs text-muted-foreground">04</TableCell>
                  <TableCell>TVA sur autres biens et services (achats d&apos;exploitation)</TableCell>
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

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
import { Building, Download, Calendar, Info, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateTogoIS } from "@/lib/fiscal/togo-rules";

type TabType = "simulation" | "acomptes";

export default function IsPage() {
  const [tab, setTab] = useState<TabType>("simulation");

  // Inputs simulateur
  const [ca, setCa] = useState(50_000_000);
  const [produits, setProduits] = useState(8_000_000);
  const [charges, setCharges] = useState(5_500_000);
  const [reintegrations, setReintegrations] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [impotN1, setImpotN1] = useState(0);

  const result = calculateTogoIS({
    chiffreAffairesHt: ca,
    totalProduits: produits,
    totalCharges: charges,
    reintegrationsFiscales: reintegrations,
    deductionsFiscales: deductions,
    impotExercicePrecedent: impotN1,
  });

  // Calcul du solde : impôt exigible N − acomptes versés (4 × 25% de N-1)
  const totalAcomptes = impotN1; // 4 acomptes = 100% de N-1
  const soldeAprilN1 = Math.max(0, result.impotExigible - totalAcomptes);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" /> Impôt sur les Sociétés (IS 27%) &amp; IMF
            </h2>
            <Badge variant="outline" className="border-primary/40 text-primary text-xs">
              CGI Togo art. 113 &amp; 120 — Règle Max(IS, IMF)
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Résultat fiscal, comparaison IS 27% vs IMF 1% (plancher 20 000 FCFA) et acomptes provisionnels
          </p>
        </div>
        <Button size="sm" onClick={() => toast.info("Génération liasse fiscale OTR en cours de déploiement...")}>
          <Download className="h-4 w-4" /> Liasse fiscale OTR (PDF)
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b space-x-6">
        {([
          { key: "simulation", label: "Simulateur IS / IMF" },
          { key: "acomptes", label: "Calendrier des acomptes" },
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
                <Calculator className="h-4 w-4 text-primary" /> Données de l&apos;exercice
              </CardTitle>
              <CardDescription>Saisir les données comptables pour obtenir le résultat fiscal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ca">Chiffre d&apos;affaires HT (FCFA)</Label>
                <Input id="ca" type="number" step="100000" min={0} value={ca}
                  onChange={(e) => setCa(Math.max(0, Number(e.target.value)))} className="font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="produits">Total produits (FCFA)</Label>
                  <Input id="produits" type="number" step="100000" min={0} value={produits}
                    onChange={(e) => setProduits(Math.max(0, Number(e.target.value)))} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="charges">Total charges (FCFA)</Label>
                  <Input id="charges" type="number" step="100000" min={0} value={charges}
                    onChange={(e) => setCharges(Math.max(0, Number(e.target.value)))} className="font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reintegrations">Réintégrations fiscales (charges non déductibles)</Label>
                  <Input id="reintegrations" type="number" step="10000" min={0} value={reintegrations}
                    onChange={(e) => setReintegrations(Math.max(0, Number(e.target.value)))} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="deductions">Déductions fiscales (produits non imposables)</Label>
                  <Input id="deductions" type="number" step="10000" min={0} value={deductions}
                    onChange={(e) => setDeductions(Math.max(0, Number(e.target.value)))} className="font-mono" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="impot-n1">Impôt exercice N-1 (base calcul acomptes)</Label>
                <Input id="impot-n1" type="number" step="10000" min={0} value={impotN1}
                  onChange={(e) => setImpotN1(Math.max(0, Number(e.target.value)))} className="font-mono" />
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 space-y-1">
                <p className="font-semibold flex items-center gap-1"><Info className="h-3.5 w-3.5" /> Règles CGI Togo appliquées</p>
                <p>• IS = Résultat fiscal × <strong>27%</strong> (toute fraction &lt; 1 000 FCFA négligée)</p>
                <p>• IMF = 1% du CA HT avec plancher de <strong>20 000 FCFA</strong> (art. 120)</p>
                <p>• Impôt dû = <strong>Max(IS, IMF)</strong> — le IMF s&apos;applique même en déficit</p>
                <p>• Résultat fiscal = Résultat comptable + Réintégrations − Déductions</p>
              </div>
            </CardContent>
          </Card>

          {/* Résultats */}
          <div className="space-y-4">
            {/* Résultat fiscal */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Passage au résultat fiscal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <div className="flex justify-between text-sm py-1.5 border-b">
                  <span className="text-muted-foreground">Résultat comptable (Produits − Charges)</span>
                  <span className={cn("font-mono font-medium", result.resultatComptable >= 0 ? "text-green-700" : "text-red-600")}>
                    {result.resultatComptable >= 0 ? "" : "−"}{formatAmount(Math.abs(result.resultatComptable))}
                  </span>
                </div>
                {reintegrations > 0 && (
                  <div className="flex justify-between text-sm py-1.5 border-b">
                    <span className="text-muted-foreground">+ Réintégrations fiscales</span>
                    <span className="font-mono text-red-600">+{formatAmount(reintegrations)}</span>
                  </div>
                )}
                {deductions > 0 && (
                  <div className="flex justify-between text-sm py-1.5 border-b">
                    <span className="text-muted-foreground">− Déductions fiscales</span>
                    <span className="font-mono text-green-700">−{formatAmount(deductions)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm py-2 font-semibold">
                  <span>= Résultat fiscal imposable</span>
                  <span className={cn("font-mono", result.resultatFiscal > 0 ? "text-foreground" : "text-amber-600")}>
                    {formatAmount(result.resultatFiscal)} FCFA
                    {result.resultatFiscal === 0 && " (Déficit — IMF s'applique)"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Comparaison IS vs IMF */}
            <div className="grid grid-cols-2 gap-4">
              <Card className={result.impotRetenu === "IS" ? "border-primary bg-primary/5" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardDescription className="text-xs font-semibold uppercase">IS au taux de 27%</CardDescription>
                    {result.impotRetenu === "IS" && <Badge variant="outline" className="border-green-500 text-green-700 text-xs">Retenu</Badge>}
                  </div>
                  <CardTitle className="text-xl font-mono text-primary">
                    {formatAmount(result.isTheorique)} FCFA
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Base : {formatAmount(result.resultatFiscal)} FCFA × 27%
                </CardContent>
              </Card>

              <Card className={result.impotRetenu === "MFP" ? "border-amber-400 bg-amber-50" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardDescription className="text-xs font-semibold uppercase">IMF (Min. Forfaitaire 1%)</CardDescription>
                    {result.impotRetenu === "MFP" && <Badge variant="outline" className="border-amber-500 text-amber-700 text-xs">Retenu</Badge>}
                  </div>
                  <CardTitle className="text-xl font-mono text-amber-700">
                    {formatAmount(result.mfpTheorique)} FCFA
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  1% × {formatAmount(ca)} (plancher 20 000 FCFA)
                </CardContent>
              </Card>
            </div>

            {/* Impôt définitif */}
            <Card className="border-2 border-primary">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase text-primary">
                  Impôt Dû Définitif — Max(IS, IMF)
                </CardDescription>
                <CardTitle className="text-2xl font-mono text-green-700">
                  {formatAmount(result.impotExigible)} FCFA
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Retenu : <strong>{result.impotRetenu === "IS" ? "IS 27%" : "IMF 1% du CA (plancher)"}</strong>
                {" — "}exigible à l&apos;OTR
              </CardContent>
            </Card>
          </div>

          {/* Tableau synthèse */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Synthèse du résultat fiscal et de l&apos;impôt</CardTitle>
              <CardDescription>
                Conforme au modèle de Liasse Fiscale OTR — CGI Togo art. 113, 120, 121
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rubrique</TableHead>
                    <TableHead className="text-right">Montant (FCFA)</TableHead>
                    <TableHead>Référence légale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell className="font-medium">Chiffre d&apos;affaires HT</TableCell><TableCell className="text-right font-mono">{formatAmount(ca)}</TableCell><TableCell className="text-xs text-muted-foreground">Base IMF art. 120</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Résultat comptable</TableCell><TableCell className={cn("text-right font-mono", result.resultatComptable < 0 ? "text-red-600" : "")}>{result.resultatComptable >= 0 ? formatAmount(result.resultatComptable) : `−${formatAmount(Math.abs(result.resultatComptable))}`}</TableCell><TableCell className="text-xs text-muted-foreground">Produits − Charges</TableCell></TableRow>
                  <TableRow className="bg-muted/20"><TableCell className="font-semibold">Résultat fiscal imposable</TableCell><TableCell className="text-right font-mono font-semibold">{formatAmount(result.resultatFiscal)}</TableCell><TableCell className="text-xs text-muted-foreground">Art. 113 CGI</TableCell></TableRow>
                  <TableRow><TableCell>IS théorique (27%)</TableCell><TableCell className="text-right font-mono">{formatAmount(result.isTheorique)}</TableCell><TableCell className="text-xs text-muted-foreground">Art. 113 — 27%</TableCell></TableRow>
                  <TableRow><TableCell>IMF théorique (1% du CA)</TableCell><TableCell className="text-right font-mono">{formatAmount(result.mfpTheorique)}</TableCell><TableCell className="text-xs text-muted-foreground">Art. 120 — 1% plancher 20 000</TableCell></TableRow>
                  <TableRow className="bg-primary/10 font-bold"><TableCell>Impôt dû définitif ({result.impotRetenu})</TableCell><TableCell className="text-right font-mono text-green-700">{formatAmount(result.impotExigible)}</TableCell><TableCell className="text-xs text-primary">Max(IS, IMF)</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Onglet Acomptes ─── */}
      {tab === "acomptes" && (
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">Régime des acomptes provisionnels — CGI Togo art. 114</p>
            <p>
              L&apos;IS est réglé par <strong>4 acomptes égaux</strong> de 25% chacun de l&apos;impôt de l&apos;exercice précédent (N-1),
              suivis d&apos;une régularisation lors du dépôt de la liasse fiscale (avant le 30 avril N+1).
            </p>
            <p className="mt-1">Saisir le montant de l&apos;impôt N-1 dans le simulateur pour calculer les acomptes.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Calendrier de paiement des acomptes (Exercice 2025)
              </CardTitle>
              <CardDescription>
                Base de calcul : Impôt N-1 = {formatAmount(impotN1)} FCFA → Acompte unitaire (25%) = {formatAmount(result.acompte1)} FCFA
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Date limite légale</TableHead>
                    <TableHead>Fraction</TableHead>
                    <TableHead className="text-right">Montant (FCFA)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { label: "1er Acompte IS", date: "31 Mars 2025", fraction: "25% de l'impôt N-1", montant: result.acompte1 },
                    { label: "2ème Acompte IS", date: "30 Juin 2025", fraction: "25% de l'impôt N-1", montant: result.acompte2 },
                    { label: "3ème Acompte IS", date: "30 Septembre 2025", fraction: "25% de l'impôt N-1", montant: result.acompte3 },
                    { label: "4ème Acompte IS", date: "31 Décembre 2025", fraction: "25% de l'impôt N-1", montant: result.acompte4 },
                  ].map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="font-semibold">{row.label}</TableCell>
                      <TableCell className="text-sm">{row.date}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.fraction}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatAmount(row.montant)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell colSpan={3}>Total acomptes versés</TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(result.acompte1 * 4)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-primary/10 font-bold">
                    <TableCell>Solde de liquidation (Liasse fiscale)</TableCell>
                    <TableCell className="text-sm">30 Avril 2026</TableCell>
                    <TableCell className="text-sm text-muted-foreground">IS N − Total acomptes</TableCell>
                    <TableCell className="text-right font-mono text-green-700">{formatAmount(soldeAprilN1)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

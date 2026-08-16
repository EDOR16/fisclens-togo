"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatAmount, formatFcfa, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Calculator, Download, Play, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "runs" | "simulation" | "annuelle";

const MOCK_RUNS = [
  { id: "1", periode: "2025-07", dateRun: "2025-07-28", nbEmployes: 12, masseSalarialeBrute: 4_800_000, cnssSalariale: 192_000, cnssPatronale: 840_000, irppTotal: 420_000, netAPayer: 4_188_000 },
  { id: "2", periode: "2025-06", dateRun: "2025-06-27", nbEmployes: 12, masseSalarialeBrute: 4_800_000, cnssSalariale: 192_000, cnssPatronale: 840_000, irppTotal: 420_000, netAPayer: 4_188_000 },
  { id: "3", periode: "2025-05", dateRun: "2025-05-28", nbEmployes: 11, masseSalarialeBrute: 4_450_000, cnssSalariale: 178_000, cnssPatronale: 778_750, irppTotal: 385_000, netAPayer: 3_887_000 },
];

export default function IrppPage() {
  const [tab, setTab] = useState<TabType>("runs");
  const [simuBrut, setSimuBrut] = useState(450_000);

  // Simulation IRPP rapide
  const cnssSal = Math.floor(simuBrut * 0.04);
  const brutApresCnss = simuBrut - cnssSal;
  const abattement28 = Math.min(Math.floor(brutApresCnss * 0.28), 10_000_000 / 12);
  const baseImposable = Math.floor((brutApresCnss - abattement28) / 1000) * 1000;
  // Barème progressif mensuel estimé
  const irppEstime = baseImposable > 75000 ? Math.floor((baseImposable - 75000) * 0.15 / 10) * 10 : 0;
  const netEstime = simuBrut - cnssSal - irppEstime;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> IRPP & Paie Togo
            </h2>
            <Badge variant="outline" className="border-primary/40 text-primary text-xs">
              CGI art. 26 & 74
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Calcul de l&apos;Impôt sur le Revenu des Personnes Physiques, CNSS (4% sal. / 17.5% pat.) et livre de paie
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" /> État récapitulatif
          </Button>
          <Button size="sm">
            <Play className="h-4 w-4" /> Nouveau run de paie
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b space-x-4">
        <button
          onClick={() => setTab("runs")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            tab === "runs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Historique des runs mensuels
        </button>
        <button
          onClick={() => setTab("simulation")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            tab === "simulation" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Simulateur de salaire brut / net
        </button>
        <button
          onClick={() => setTab("annuelle")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            tab === "annuelle" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Déclaration annuelle employeur (Av. 31 mars)
        </button>
      </div>

      {tab === "runs" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Runs de paie enregistrés</CardTitle>
            <CardDescription>Écritures de paie générées automatiquement dans le journal PAIE</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead>Date du run</TableHead>
                  <TableHead className="text-right">Effectif</TableHead>
                  <TableHead className="text-right">Masse Brute</TableHead>
                  <TableHead className="text-right">CNSS Salarié (4%)</TableHead>
                  <TableHead className="text-right">IRPP Retenu</TableHead>
                  <TableHead className="text-right font-semibold">Net à Payer</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_RUNS.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-semibold text-primary">{run.periode}</TableCell>
                    <TableCell className="text-sm">{formatDate(run.dateRun)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{run.nbEmployes}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatAmount(run.masseSalarialeBrute)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatAmount(run.cnssSalariale)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatAmount(run.irppTotal)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-green-700">{formatAmount(run.netAPayer)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-xs">
                        Bulletins PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === "simulation" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" /> Paramètres du salarié
              </CardTitle>
              <CardDescription>Simulation selon barème progressif CGI Togo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Salaire de base brut mensuel (FCFA)</label>
                <Input
                  type="number"
                  step="10000"
                  value={simuBrut}
                  onChange={(e) => setSimuBrut(Number(e.target.value))}
                  className="font-mono text-base"
                />
              </div>
              <div className="rounded-lg bg-muted/40 p-4 space-y-2 text-xs text-muted-foreground">
                <p>• Cotisation CNSS salarié : <strong>4%</strong> (sur salaire brut)</p>
                <p>• Abattement forfaitaire pour frais professionnels : <strong>28%</strong></p>
                <p>• Tranche 0 à 900 000 FCFA/an : <strong>0%</strong> (soit 75 000 FCFA/mois)</p>
                <p>• Tranche 900 001 à 4 000 000 FCFA/an : <strong>7%</strong></p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base text-primary">Décomposition fiscale et nette</CardTitle>
              <CardDescription>Montants calculés en entiers FCFA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm py-1 border-b">
                <span>Salaire Brut</span>
                <span className="font-mono font-semibold">{formatAmount(simuBrut)} FCFA</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b text-red-600">
                <span>- CNSS Salarié (4%)</span>
                <span className="font-mono font-medium">-{formatAmount(cnssSal)} FCFA</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b text-muted-foreground">
                <span>Base après CNSS</span>
                <span className="font-mono">{formatAmount(brutApresCnss)} FCFA</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b text-muted-foreground">
                <span>Abattement 28% (frais prof.)</span>
                <span className="font-mono">{formatAmount(abattement28)} FCFA</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b text-red-600">
                <span>- IRPP retenu à la source</span>
                <span className="font-mono font-medium">-{formatAmount(irppEstime)} FCFA</span>
              </div>
              <div className="flex justify-between text-base py-2 font-bold text-green-700 bg-green-100/60 px-3 rounded-md mt-2">
                <span>Net à payer au salarié</span>
                <span className="font-mono">{formatAmount(netEstime)} FCFA</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "annuelle" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Déclaration Annuelle des Salaires et Honoraires</CardTitle>
            <CardDescription>Export réglementaire pour l&apos;Office Togolais des Recettes (OTR) — Échéance 31 Mars</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/20 space-y-2">
              <p className="text-sm font-semibold">Exercice fiscal 2024</p>
              <p className="text-xs text-muted-foreground">
                Cumul annuel de la masse salariale : <strong>56 400 000 FCFA</strong> | IRPP total reversé : <strong>4 920 000 FCFA</strong>
              </p>
            </div>
            <Button>
              <Download className="h-4 w-4 mr-2" /> Télécharger l&apos;imprimé fiscal officiel (PDF OTR)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

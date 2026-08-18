"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatAmount, formatFcfa, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Calculator, Download, Play, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { exportPayrollPdf } from "@/lib/export/pdf-generator";

type TabType = "runs" | "simulation" | "annuelle";

const EMPTY_RUNS: Array<Record<string, string | number>> = [];

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

  const exportPayroll = async () => {
    try {
      const data = await api.get<any>("/fiscal/irpp");
      exportPayrollPdf(data.tenant.name, new Date().toISOString().slice(0, 7), data.employees);
      toast.success("État récapitulatif téléchargé.");
    } catch {
      toast.error("Impossible de générer l'état récapitulatif.");
    }
  };

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
          <Button variant="outline" size="sm" onClick={() => void exportPayroll()}>
            <Download className="h-4 w-4" /> État récapitulatif
          </Button>
          <Button size="sm" onClick={() => setTab("simulation")}>
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
            <CardDescription>Aucun run de paie n’a encore été généré dans cet environnement.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
              <p className="font-hand text-3xl">Aucun bulletin de paie n’est encore disponible.</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Les montants de paie, CNSS et IRPP apparaîtront ici après la première génération d’un run réel.
              </p>
            </div>
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
            <CardDescription>La déclaration annuelle sera générée à partir des données réelles dès qu’un premier exercice fiscal sera saisi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/20 space-y-2">
              <p className="text-sm font-semibold">Aucune donnée fiscale pour l’instant</p>
              <p className="text-xs text-muted-foreground">
                Les cumuls annuels de masse salariale et d’IRPP seront calculés automatiquement lorsqu’un exercice réel sera clôturé.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

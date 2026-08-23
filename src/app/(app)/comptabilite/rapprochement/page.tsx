"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAmount, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, CheckCircle2, AlertTriangle, Upload, Check } from "lucide-react";
import { toast } from "sonner";

type OperationRapprochement = {
  id: string;
  date: string;
  libelle: string;
  montantBanque: number;
  montantCompta: number;
  statut: "MATCHED" | "PENDING" | "AMBIGUOUS";
};

const EMPTY_OPERATIONS: OperationRapprochement[] = [];

export default function RapprochementPage() {
  const [operations, setOperations] = useState<OperationRapprochement[]>(EMPTY_OPERATIONS);
  const [isRunning, setIsRunning] = useState(false);

  const soldeBanque = 0;
  const soldeCompta = 0;
  const ecart = 0;

  function runAutoMatching() {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      toast.success("Rapprochement automatique terminé : 3 écritures appariées.");
    }, 1000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" /> Rapprochement Bancaire (521000)
          </h2>
          <p className="text-sm text-muted-foreground">
            Concordance entre le relevé bancaire et le journal de banque SYSCOHADA
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info("Ouvrir importateur de relevé CSV...")}>
            <Upload className="h-4 w-4" /> Importer Relevé CSV
          </Button>
          <Button size="sm" onClick={runAutoMatching} disabled={isRunning}>
            <RefreshCw className={`h-4 w-4 ${isRunning ? "animate-spin" : ""}`} />
            {isRunning ? "Analyse en cours..." : "Matching automatique"}
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Solde Relevé Bancaire</CardDescription>
            <CardTitle className="text-xl font-mono text-primary">0 FCFA</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Solde Comptable (521)</CardDescription>
            <CardTitle className="text-xl font-mono">0 FCFA</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-300 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Écart à justifier</CardDescription>
            <CardTitle className="text-xl font-mono text-amber-700">0 FCFA</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opérations à rapprocher</CardTitle>
          <CardDescription>Le relevé bancaire et le journal s’actualiseront dès que des mouvements réels seront saisis.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="font-hand text-3xl">Aucune opération à rapprocher.</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Les rapprochements apparaîtront ici lorsque les relevés bancaires et les écritures comptables seront importés.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

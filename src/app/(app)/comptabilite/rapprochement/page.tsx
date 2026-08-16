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

const INITIAL_OPERATIONS: OperationRapprochement[] = [
  { id: "1", date: "2025-08-04", libelle: "Virement client SOGET", montantBanque: 500_000, montantCompta: 500_000, statut: "MATCHED" },
  { id: "2", date: "2025-08-06", libelle: "Prélèvement loyer bureau Lomé", montantBanque: 450_000, montantCompta: 450_000, statut: "MATCHED" },
  { id: "3", date: "2025-08-11", libelle: "Virement client TOGO-TRANS", montantBanque: 3_400_000, montantCompta: 3_400_000, statut: "MATCHED" },
  { id: "4", date: "2025-08-13", libelle: "Frais de tenue de compte Ecobank", montantBanque: 12_500, montantCompta: 0, statut: "PENDING" },
  { id: "5", date: "2025-08-14", libelle: "Chèque émis #00892 Fournisseur", montantBanque: 0, montantCompta: 280_000, statut: "PENDING" },
  { id: "6", date: "2025-08-14", libelle: "Encaissement TPE 14/08", montantBanque: 150_000, montantCompta: 148_000, statut: "AMBIGUOUS" },
];

export default function RapprochementPage() {
  const [operations, setOperations] = useState<OperationRapprochement[]>(INITIAL_OPERATIONS);
  const [isRunning, setIsRunning] = useState(false);

  const soldeBanque = 6_400_000;
  const soldeCompta = 6_269_500;
  const ecart = soldeBanque - soldeCompta;

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
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4" /> Importer Relevé CSV
          </Button>
          <Button size="sm" onClick={runAutoMatching} disabled={isRunning}>
            <RefreshCw className={`h-4 w-4 ${isRunning ? "animate-spin" : ""}`} />
            {isRunning ? "Analyse en cours..." : "Matching automatique"}
          </Button>
        </div>
      </div>

      {/* Cartes de synthèse */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Solde Relevé Bancaire</CardDescription>
            <CardTitle className="text-xl font-mono text-primary">{formatAmount(soldeBanque)} FCFA</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Solde Comptable (521)</CardDescription>
            <CardTitle className="text-xl font-mono">{formatAmount(soldeCompta)} FCFA</CardTitle>
          </CardHeader>
        </Card>
        <Card className={ecart === 0 ? "border-green-300 bg-green-50/50" : "border-amber-300 bg-amber-50/50"}>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Écart à justifier</CardDescription>
            <CardTitle className="text-xl font-mono text-amber-700">{formatAmount(Math.abs(ecart))} FCFA</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tableau des opérations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opérations à rapprocher</CardTitle>
          <CardDescription>Période : Août 2025</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead className="text-right">Montant Relevé</TableHead>
                <TableHead className="text-right">Montant Comptabilité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations.map((op) => (
                <TableRow key={op.id}>
                  <TableCell className="text-sm">{formatDate(op.date)}</TableCell>
                  <TableCell className="text-sm font-medium">{op.libelle}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {op.montantBanque > 0 ? formatAmount(op.montantBanque) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {op.montantCompta > 0 ? formatAmount(op.montantCompta) : "—"}
                  </TableCell>
                  <TableCell>
                    {op.statut === "MATCHED" && <Badge variant="success">Rapproché</Badge>}
                    {op.statut === "PENDING" && <Badge variant="warning">En suspens</Badge>}
                    {op.statut === "AMBIGUOUS" && <Badge variant="destructive">Écart montant</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    {op.statut !== "MATCHED" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-primary"
                        onClick={() => {
                          setOperations((ops) =>
                            ops.map((o) => (o.id === op.id ? { ...o, statut: "MATCHED" } : o))
                          );
                          toast.success("Opération lettrée avec succès");
                        }}
                      >
                        <Check className="h-3 w-3 mr-1" /> Lettrer
                      </Button>
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

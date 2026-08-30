"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { Loader2, RefreshCw, Search, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";

type BalanceLine = {
  code: string;
  libelle: string;
  classe: number;
  debitMouvements: number;
  creditMouvements: number;
  soldeDebiteur: number;
  soldeCrediteur: number;
};

type BalanceApiResponse = {
  lines: BalanceLine[];
  totals: {
    debitMouvements: number;
    creditMouvements: number;
    soldeDebiteur: number;
    soldeCrediteur: number;
  };
  isBalanced: boolean;
};

const CLASS_LABELS: Record<number, string> = {
  1: "Classe 1 — Capitaux",
  2: "Classe 2 — Immobilisations",
  3: "Classe 3 — Stocks",
  4: "Classe 4 — Tiers",
  5: "Classe 5 — Trésorerie",
  6: "Classe 6 — Charges",
  7: "Classe 7 — Produits",
  8: "Classe 8 — Comptes spéciaux",
};

export default function BalancePage() {
  const [data, setData] = useState<BalanceApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<number | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<BalanceApiResponse>("/accounting/balance");
      setData(res);
    } catch (err: any) {
      toast.error("Impossible de charger la balance : " + (err.message || "Erreur réseau"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const lines = data?.lines || [];
  const filteredLines = lines.filter((l) => {
    const matchClass = selectedClass === "ALL" || l.classe === selectedClass;
    const matchSearch =
      !search ||
      l.code.toLowerCase().includes(search.toLowerCase()) ||
      l.libelle.toLowerCase().includes(search.toLowerCase());
    return matchClass && matchSearch;
  });

  const totals = data?.totals || {
    debitMouvements: 0,
    creditMouvements: 0,
    soldeDebiteur: 0,
    soldeCrediteur: 0,
  };

  const isBalanced = data?.isBalanced ?? true;

  // Calcul des sous-totaux pour les lignes filtrées si filtrage actif
  const isFiltered = selectedClass !== "ALL" || search.trim() !== "";
  const displayTotals = isFiltered
    ? {
        debitMouvements: filteredLines.reduce((s, l) => s + l.debitMouvements, 0),
        creditMouvements: filteredLines.reduce((s, l) => s + l.creditMouvements, 0),
        soldeDebiteur: filteredLines.reduce((s, l) => s + l.soldeDebiteur, 0),
        soldeCrediteur: filteredLines.reduce((s, l) => s + l.soldeCrediteur, 0),
      }
    : totals;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Balance générale des comptes
          </h2>
          <p className="text-sm text-muted-foreground">
            SYSCOHADA Révisé — Calcul en temps réel des mouvements et soldes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchBalance} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
            Actualiser
          </Button>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1",
              isBalanced ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            )}
          >
            {isBalanced ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" /> Équilibrée
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5" /> Déséquilibrée
              </>
            )}
          </span>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro de compte ou libellé..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              onClick={() => setSelectedClass("ALL")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                selectedClass === "ALL"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted"
              )}
            >
              Toutes les classes ({lines.length})
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((c) => {
              const count = lines.filter((l) => l.classe === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setSelectedClass(c)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                    selectedClass === c
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  Cl. {c} {count > 0 ? `(${count})` : ""}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tableau de la Balance */}
      <Card>
        <CardContent className="p-0">
          {loading && !data ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Calcul de la balance en cours...</span>
            </div>
          ) : lines.length === 0 ? (
            <div className="p-8 text-center">
              <div className="rounded-md border border-dashed border-border bg-muted/20 p-8">
                <p className="font-hand text-3xl text-foreground">Votre balance est vide.</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Les soldes seront recalculés automatiquement dès qu’une écriture comptable réelle sera ajoutée.
                </p>
                <div className="mt-4">
                  <a href="/comptabilite/saisie">
                    <Button size="sm">Passer une écriture comptable</Button>
                  </a>
                </div>
              </div>
            </div>
          ) : filteredLines.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Aucun compte ne correspond à votre filtre.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-28 font-mono">N° Compte</TableHead>
                    <TableHead>Intitulé du compte</TableHead>
                    <TableHead className="text-right font-mono">Mvt Débit</TableHead>
                    <TableHead className="text-right font-mono">Mvt Crédit</TableHead>
                    <TableHead className="text-right font-mono text-primary font-semibold">Solde Débiteur</TableHead>
                    <TableHead className="text-right font-mono text-primary font-semibold">Solde Créditeur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLines.map((line) => (
                    <TableRow key={line.code} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-bold text-primary">
                        {line.code}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {line.libelle}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-mono text-xs">
                        {line.debitMouvements > 0 ? formatAmount(line.debitMouvements) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-mono text-xs">
                        {line.creditMouvements > 0 ? formatAmount(line.creditMouvements) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                        {line.soldeDebiteur > 0 ? formatAmount(line.soldeDebiteur) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-mono text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/5">
                        {line.soldeCrediteur > 0 ? formatAmount(line.soldeCrediteur) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="font-bold text-sm bg-muted/80">
                    <TableCell colSpan={2}>
                      {isFiltered ? "SOUS-TOTAL FILTRÉ" : "TOTAL GÉNÉRAL"} ({filteredLines.length} comptes)
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-mono">
                      {formatAmount(displayTotals.debitMouvements)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-mono">
                      {formatAmount(displayTotals.creditMouvements)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-mono text-emerald-700 dark:text-emerald-300">
                      {formatAmount(displayTotals.soldeDebiteur)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-mono text-amber-700 dark:text-amber-300">
                      {formatAmount(displayTotals.soldeCrediteur)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

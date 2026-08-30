"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatAmount, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Search, Download, BookOpen, Loader2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type GrandLivreLine = {
  id: string;
  date: string;
  piece: string;
  journal: string;
  libelle: string;
  debit: number;
  credit: number;
  balance: number;
};

type GrandLivreApiResponse = {
  accountCode: string;
  accountName: string;
  availableAccounts: string[];
  lines: GrandLivreLine[];
  totals: {
    totalDebit: number;
    totalCredit: number;
    finalBalance: number;
  };
};

export default function GrandLivrePage() {
  const [selectedAccount, setSelectedAccount] = useState<string>("411000");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [data, setData] = useState<GrandLivreApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchGrandLivre = useCallback(async (account?: string) => {
    setLoading(true);
    try {
      const target = account || selectedAccount;
      const endpoint = target ? `/accounting/grand-livre?accountCode=${target}` : "/accounting/grand-livre";
      const res = await api.get<GrandLivreApiResponse>(endpoint);
      setData(res);
      if (res.accountCode && res.accountCode !== selectedAccount) {
        setSelectedAccount(res.accountCode);
      }
    } catch (err: any) {
      toast.error("Impossible de charger le grand livre : " + (err.message || "Erreur réseau"));
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    fetchGrandLivre();
  }, [fetchGrandLivre]);

  const handleSelectAccount = (code: string) => {
    setSelectedAccount(code);
    fetchGrandLivre(code);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      handleSelectAccount(searchTerm.trim());
    }
  };

  const availableAccounts = data?.availableAccounts || [];
  const lines = data?.lines || [];
  const totals = data?.totals || { totalDebit: 0, totalCredit: 0, finalBalance: 0 };
  const soldeFinal = totals.finalBalance;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Grand livre général
          </h2>
          <p className="text-sm text-muted-foreground">
            Détail chronologique des mouvements et solde progressif par compte SYSCOHADA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchGrandLivre()} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info("Génération du grand livre PDF...")}>
            <Download className="h-4 w-4 mr-1" /> Exporter PDF
          </Button>
        </div>
      </div>

      {/* Sélecteur / Recherche de compte */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1.5 flex-1">
              <label htmlFor="accountSearch" className="text-sm font-medium">
                Compte SYSCOHADA (numéro de compte)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="accountSearch"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ex: 601, 401, 411000, 521000..."
                  className="pl-9 font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="default">
                Consulter
              </Button>
            </div>
          </form>

          {/* Comptes avec mouvements détectés */}
          {availableAccounts.length > 0 && (
            <div className="pt-2 border-t">
              <span className="text-xs text-muted-foreground font-medium mr-2">Comptes mouvementés :</span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {availableAccounts.map((acc) => (
                  <button
                    key={acc}
                    type="button"
                    onClick={() => handleSelectAccount(acc)}
                    className={cn(
                      "rounded px-2.5 py-1 text-xs font-mono font-medium border transition-colors",
                      selectedAccount === acc
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted hover:bg-accent text-foreground"
                    )}
                  >
                    Compte {acc}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Détail du compte */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="font-mono text-base text-primary">
                {data?.accountCode || selectedAccount} — {data?.accountName || "Compte"}
              </CardTitle>
              <CardDescription>
                Historique des écritures réelles et solde progressif
              </CardDescription>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Solde actuel : </span>
              <span className="font-mono font-bold text-sm">
                {formatAmount(Math.abs(soldeFinal))} FCFA {soldeFinal >= 0 ? "(Débiteur)" : "(Créditeur)"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && !data ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Chargement du compte...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-24">Date</TableHead>
                    <TableHead className="w-32 font-mono">Pièce</TableHead>
                    <TableHead className="w-24">Journal</TableHead>
                    <TableHead>Libellé de l&apos;opération</TableHead>
                    <TableHead className="text-right font-mono w-32">Débit</TableHead>
                    <TableHead className="text-right font-mono w-32">Crédit</TableHead>
                    <TableHead className="text-right font-mono w-36 bg-muted/20">Solde progressif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        Aucun mouvement enregistré sur le compte {selectedAccount}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    lines.map((line) => (
                      <TableRow key={line.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs">{formatDate(line.date)}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground font-semibold">{line.piece}</TableCell>
                        <TableCell className="font-mono text-xs">{line.journal}</TableCell>
                        <TableCell className="text-sm">{line.libelle}</TableCell>
                        <TableCell className="text-right tabular-nums font-mono text-xs">
                          {line.debit > 0 ? (
                            <span className="text-red-700 dark:text-red-400 font-semibold">{formatAmount(line.debit)}</span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-mono text-xs">
                          {line.credit > 0 ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{formatAmount(line.credit)}</span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-mono text-xs font-semibold bg-muted/10">
                          {formatAmount(Math.abs(line.balance))} {line.balance >= 0 ? "D" : "C"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow className="font-semibold bg-muted/80">
                    <TableCell colSpan={4}>TOTAL DU COMPTE</TableCell>
                    <TableCell className="text-right tabular-nums font-mono">
                      {formatAmount(totals.totalDebit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-mono">
                      {formatAmount(totals.totalCredit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-mono bg-muted/20">
                      {formatAmount(Math.abs(soldeFinal))} {soldeFinal >= 0 ? "D" : "C"}
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

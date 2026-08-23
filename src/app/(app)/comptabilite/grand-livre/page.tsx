"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatAmount, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Search, Download, BookOpen } from "lucide-react";

type GrandLivreLine = {
  id: string;
  date: string;
  piece: string;
  journal: string;
  libelle: string;
  debit: number;
  credit: number;
};

const EMPTY_OPERATIONS: Record<string, { libelle: string; lines: GrandLivreLine[] }> = {};

export default function GrandLivrePage() {
  const [selectedAccount, setSelectedAccount] = useState("411000");
  const [searchTerm, setSearchTerm] = useState("411000");

  const currentAccountData = EMPTY_OPERATIONS[selectedAccount] || {
    libelle: "Compte sans mouvements récents",
    lines: [],
  };

  let cumulativeBalance = 0;
  const computedLines = currentAccountData.lines.map((line) => {
    cumulativeBalance += line.debit - line.credit;
    return {
      ...line,
      balance: cumulativeBalance,
    };
  });

  const totalDebit = currentAccountData.lines.reduce((acc, l) => acc + l.debit, 0);
  const totalCredit = currentAccountData.lines.reduce((acc, l) => acc + l.credit, 0);
  const soldeFinal = totalDebit - totalCredit;

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
        <Button variant="outline" size="sm" onClick={() => toast.info("Export PDF en cours...") }>
          <Download className="h-4 w-4" /> Exporter PDF
        </Button>
      </div>

      {/* Sélecteur / Recherche de compte */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-1.5 flex-1">
              <label htmlFor="accountSearch" className="text-sm font-medium">
                Compte SYSCOHADA (numéro ou recherche)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="accountSearch"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ex: 411000 ou 521000..."
                  className="pl-9 font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedAccount(searchTerm);
                }}
              >
                Filtrer
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedAccount("411000");
                  setSearchTerm("411000");
                }}
              >
                411000 (Clients)
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedAccount("521000");
                  setSearchTerm("521000");
                }}
              >
                521000 (Banque)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détail du compte */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="font-mono text-base text-primary">
                {selectedAccount} — {currentAccountData.libelle}
              </CardTitle>
              <CardDescription>
                Période : Exercice 2025 (Du 01/01/2025 au 31/12/2025)
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Pièce</TableHead>
                <TableHead>Journal</TableHead>
                <TableHead>Libellé de l&apos;opération</TableHead>
                <TableHead className="text-right">Débit</TableHead>
                <TableHead className="text-right">Crédit</TableHead>
                <TableHead className="text-right bg-muted/20">Solde progressif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {computedLines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun mouvement trouvé pour ce compte.
                  </TableCell>
                </TableRow>
              ) : (
                computedLines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-sm">{formatDate(line.date)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{line.piece}</TableCell>
                    <TableCell className="font-mono text-xs">{line.journal}</TableCell>
                    <TableCell className="text-sm">{line.libelle}</TableCell>
                    <TableCell className="text-right tabular-nums font-mono text-sm">
                      {line.debit > 0 ? formatAmount(line.debit) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-mono text-sm">
                      {line.credit > 0 ? formatAmount(line.credit) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-mono text-sm font-medium bg-muted/10">
                      {formatAmount(Math.abs(line.balance))} {line.balance >= 0 ? "D" : "C"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="font-semibold">
                <TableCell colSpan={4}>TOTAL DU COMPTE</TableCell>
                <TableCell className="text-right tabular-nums font-mono">
                  {formatAmount(totalDebit)}
                </TableCell>
                <TableCell className="text-right tabular-nums font-mono">
                  {formatAmount(totalCredit)}
                </TableCell>
                <TableCell className="text-right tabular-nums font-mono bg-muted/20">
                  {formatAmount(Math.abs(soldeFinal))} {soldeFinal >= 0 ? "D" : "C"}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

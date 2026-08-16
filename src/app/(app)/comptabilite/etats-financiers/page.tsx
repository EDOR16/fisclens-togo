"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "bilan" | "compte-resultat" | "tafire" | "annexe";

export default function EtatsFinanciersPage() {
  const [activeTab, setActiveTab] = useState<TabType>("bilan");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> États Financiers SYSCOHADA (Système Normal)
          </h2>
          <p className="text-sm text-muted-foreground">
            Bilan, Compte de Résultat, TAFIRE et Notes Annexes conformes à l&apos;Acte uniforme OHADA
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4" /> Export Excel
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4" /> Télécharger Liassse PDF
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b space-x-4">
        <button
          onClick={() => setActiveTab("bilan")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "bilan"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Bilan (Actif / Passif)
        </button>
        <button
          onClick={() => setActiveTab("compte-resultat")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "compte-resultat"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Compte de Résultat
        </button>
        <button
          onClick={() => setActiveTab("tafire")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "tafire"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          TAFIRE (Flux de trésorerie)
        </button>
        <button
          onClick={() => setActiveTab("annexe")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "annexe"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Notes Annexes
        </button>
      </div>

      {/* BILAN */}
      {activeTab === "bilan" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* ACTIF */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-primary">BILAN ACTIF</CardTitle>
              <CardDescription>Exercice clos au 31/12/2025 (en FCFA)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rubriques</TableHead>
                    <TableHead className="text-right">Brut</TableHead>
                    <TableHead className="text-right">Amort./Prov.</TableHead>
                    <TableHead className="text-right">Net N</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell colSpan={4}>ACTIF IMMOBILISÉ</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Immobilisations incorporelles</TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(2_500_000)}</TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(500_000)}</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatAmount(2_000_000)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Immobilisations corporelles</TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(18_000_000)}</TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(4_200_000)}</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatAmount(13_800_000)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Immobilisations financières</TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(1_200_000)}</TableCell>
                    <TableCell className="text-right font-mono">0</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatAmount(1_200_000)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell colSpan={4}>ACTIF CIRCULANT</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Stocks et en-cours</TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(8_400_000)}</TableCell>
                    <TableCell className="text-right font-mono">0</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatAmount(8_400_000)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Créances clients et comptes rattachés</TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(12_450_000)}</TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(250_000)}</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatAmount(12_200_000)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell colSpan={4}>TRÉSORERIE ACTIF</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Banques, chèques postaux et caisse</TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(6_400_000)}</TableCell>
                    <TableCell className="text-right font-mono">0</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatAmount(6_400_000)}</TableCell>
                  </TableRow>
                  <TableRow className="font-bold border-t-2">
                    <TableCell>TOTAL GÉNÉRAL ACTIF</TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(48_950_000)}</TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(4_950_000)}</TableCell>
                    <TableCell className="text-right font-mono text-primary text-base">{formatAmount(44_000_000)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* PASSIF */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-primary">BILAN PASSIF</CardTitle>
              <CardDescription>Exercice clos au 31/12/2025 (en FCFA)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rubriques</TableHead>
                    <TableHead className="text-right">Exercice N</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell colSpan={2}>CAPITAUX PROPRES ET RESSOURCES ASSIMILÉES</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Capital social</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatAmount(20_000_000)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Réserves légales et statutaires</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatAmount(3_200_000)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Report à nouveau</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatAmount(1_800_000)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Résultat net de l&apos;exercice (Bénéfice)</TableCell>
                    <TableCell className="text-right font-mono font-medium text-green-600">{formatAmount(5_400_000)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell colSpan={2}>DETTES FINANCIÈRES ET RESSOURCES ASSIMILÉES</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Emprunts bancaires long terme</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatAmount(4_000_000)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell colSpan={2}>PASSIF CIRCULANT</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Fournisseurs d&apos;exploitation</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatAmount(6_100_000)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Dettes fiscales et sociales (TVA, CNSS, IRPP)</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatAmount(3_500_000)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell colSpan={2}>TRÉSORERIE PASSIF</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Banques, crédits de trésorerie</TableCell>
                    <TableCell className="text-right font-mono font-medium">0</TableCell>
                  </TableRow>
                  <TableRow className="font-bold border-t-2">
                    <TableCell>TOTAL GÉNÉRAL PASSIF</TableCell>
                    <TableCell className="text-right font-mono text-primary text-base">{formatAmount(44_000_000)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* COMPTE DE RÉSULTAT */}
      {activeTab === "compte-resultat" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-primary">COMPTE DE RÉSULTAT SYSCOHADA</CardTitle>
            <CardDescription>Période du 01/01/2025 au 31/12/2025</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libellé du poste</TableHead>
                  <TableHead className="text-right">Montant N (FCFA)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">+ Ventes de marchandises</TableCell>
                  <TableCell className="text-right font-mono">{formatAmount(64_500_000)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">- Achats de marchandises</TableCell>
                  <TableCell className="text-right font-mono text-red-500">({formatAmount(38_200_000)})</TableCell>
                </TableRow>
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell>= MARGE COMMERCIALE</TableCell>
                  <TableCell className="text-right font-mono">{formatAmount(26_300_000)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>+ Services vendus et production</TableCell>
                  <TableCell className="text-right font-mono">{formatAmount(8_400_000)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>- Transports, services extérieurs et autres charges</TableCell>
                  <TableCell className="text-right font-mono text-red-500">({formatAmount(9_200_000)})</TableCell>
                </TableRow>
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell>= VALEUR AJOUTÉE</TableCell>
                  <TableCell className="text-right font-mono">{formatAmount(25_500_000)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>- Charges de personnel (Salaires + CNSS)</TableCell>
                  <TableCell className="text-right font-mono text-red-500">({formatAmount(14_800_000)})</TableCell>
                </TableRow>
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell>= EXCÉDENT BRUT D&apos;EXPLOITATION (EBE)</TableCell>
                  <TableCell className="text-right font-mono">{formatAmount(10_700_000)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>- Dotations aux amortissements et provisions</TableCell>
                  <TableCell className="text-right font-mono text-red-500">({formatAmount(3_200_000)})</TableCell>
                </TableRow>
                <TableRow className="bg-muted/40 font-bold">
                  <TableCell>= RÉSULTAT D&apos;EXPLOITATION</TableCell>
                  <TableCell className="text-right font-mono">{formatAmount(7_500_000)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>- Charges financières nettes</TableCell>
                  <TableCell className="text-right font-mono text-red-500">({formatAmount(350_000)})</TableCell>
                </TableRow>
                <TableRow className="bg-muted/40 font-bold">
                  <TableCell>= RÉSULTAT FINANCIER & COURANT</TableCell>
                  <TableCell className="text-right font-mono">{formatAmount(7_150_000)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>- Impôt sur les sociétés (IS 27%)</TableCell>
                  <TableCell className="text-right font-mono text-red-500">({formatAmount(1_750_000)})</TableCell>
                </TableRow>
                <TableRow className="bg-primary/10 font-bold text-base">
                  <TableCell>= RÉSULTAT NET (BÉNÉFICE)</TableCell>
                  <TableCell className="text-right font-mono text-green-700">{formatAmount(5_400_000)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* TAFIRE & ANNEXE STUBS */}
      {activeTab === "tafire" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-primary">Tableau Financier des Ressources et Emplois (TAFIRE)</CardTitle>
            <CardDescription>Analyse de la variation de la trésorerie nette</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 border rounded-lg bg-muted/20">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Capacité d&apos;Autofinancement (CAFO)</p>
                <p className="text-xl font-bold font-mono mt-1 text-primary">{formatAmount(8_600_000)} FCFA</p>
              </div>
              <div className="p-4 border rounded-lg bg-muted/20">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Variation du BFR</p>
                <p className="text-xl font-bold font-mono mt-1 text-amber-600">({formatAmount(2_200_000)}) FCFA</p>
              </div>
              <div className="p-4 border rounded-lg bg-muted/20">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Flux Net de Trésorerie</p>
                <p className="text-xl font-bold font-mono mt-1 text-green-600">+{formatAmount(6_400_000)} FCFA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "annexe" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-primary">Notes Annexes Obligatoires</CardTitle>
            <CardDescription>Règles et méthodes comptables, tableau des immobilisations, amortissements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>1. Les états financiers sont établis conformément au Système Comptable OHADA Révisé.</p>
            <p>2. Les immobilisations corporelles sont évaluées à leur coût d&apos;acquisition et amorties en mode linéaire.</p>
            <p>3. Les créances douteuses font l&apos;objet de dépréciations individualisées.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

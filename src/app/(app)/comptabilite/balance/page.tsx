import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Balance générale" };

// ---------------------------------------------------------------------------
// Types & mock
// ---------------------------------------------------------------------------

type BalanceLine = {
  code:    string;
  libelle: string;
  classe:  number;
  debitMouvements:  number;
  creditMouvements: number;
  soldeDebiteur:    number;
  soldeCrediteur:   number;
};

const MOCK_BALANCE: BalanceLine[] = [
  { code: "101000", libelle: "Capital social",          classe: 1, debitMouvements: 0,         creditMouvements: 50_000_000, soldeDebiteur: 0,         soldeCrediteur: 50_000_000 },
  { code: "411000", libelle: "Clients",                 classe: 4, debitMouvements: 12_450_000, creditMouvements: 8_200_000,  soldeDebiteur: 4_250_000, soldeCrediteur: 0 },
  { code: "401000", libelle: "Fournisseurs",            classe: 4, debitMouvements: 6_800_000,  creditMouvements: 9_300_000,  soldeDebiteur: 0,         soldeCrediteur: 2_500_000 },
  { code: "521000", libelle: "Banque",                  classe: 5, debitMouvements: 22_300_000, creditMouvements: 18_100_000, soldeDebiteur: 4_200_000, soldeCrediteur: 0 },
  { code: "601000", libelle: "Achats de marchandises",  classe: 6, debitMouvements: 8_120_000,  creditMouvements: 0,          soldeDebiteur: 8_120_000, soldeCrediteur: 0 },
  { code: "701000", libelle: "Ventes de marchandises",  classe: 7, debitMouvements: 0,          creditMouvements: 12_450_000, soldeDebiteur: 0,         soldeCrediteur: 12_450_000 },
];

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

function sumField(lines: BalanceLine[], field: keyof BalanceLine): number {
  return lines.reduce((s, l) => s + (l[field] as number), 0);
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

export default function BalancePage() {
  const totalDebitMvt  = sumField(MOCK_BALANCE, "debitMouvements");
  const totalCreditMvt = sumField(MOCK_BALANCE, "creditMouvements");
  const totalSoldeDbt  = sumField(MOCK_BALANCE, "soldeDebiteur");
  const totalSoldeCdt  = sumField(MOCK_BALANCE, "soldeCrediteur");

  // Contrôle d'équilibre
  const isBalanced = totalDebitMvt === totalCreditMvt && totalSoldeDbt === totalSoldeCdt;

  // Grouper par classe
  const classes = [...new Set(MOCK_BALANCE.map((l) => l.classe))].sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Balance générale</h2>
          <p className="text-sm text-muted-foreground">Exercice 2025</p>
        </div>
        <span className={cn(
          "rounded-full px-3 py-1 text-xs font-semibold",
          isBalanced ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        )}>
          {isBalanced ? "✓ Équilibrée" : "✗ Déséquilibrée"}
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compte</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead className="text-right">Débit (mvt)</TableHead>
                <TableHead className="text-right">Crédit (mvt)</TableHead>
                <TableHead className="text-right bg-muted/30">Solde Dbt</TableHead>
                <TableHead className="text-right bg-muted/30">Solde Cdt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((classe) => {
                const lines = MOCK_BALANCE.filter((l) => l.classe === classe);
                return (
                  <>
                    {/* En-tête de classe */}
                    <TableRow key={`class-${classe}`} className="bg-muted/40">
                      <TableCell colSpan={6} className="py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {CLASS_LABELS[classe]}
                      </TableCell>
                    </TableRow>
                    {lines.map((line) => (
                      <TableRow key={line.code}>
                        <TableCell className="font-mono text-sm">{line.code}</TableCell>
                        <TableCell className="text-sm">{line.libelle}</TableCell>
                        <TableCell className="text-right tabular-nums font-mono text-sm">
                          {formatAmount(line.debitMouvements)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-mono text-sm">
                          {formatAmount(line.creditMouvements)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-mono text-sm bg-muted/10">
                          {line.soldeDebiteur > 0 ? formatAmount(line.soldeDebiteur) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-mono text-sm bg-muted/10">
                          {line.soldeCrediteur > 0 ? formatAmount(line.soldeCrediteur) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="font-bold">
                <TableCell colSpan={2}>TOTAL GÉNÉRAL</TableCell>
                <TableCell className="text-right tabular-nums font-mono">{formatAmount(totalDebitMvt)}</TableCell>
                <TableCell className="text-right tabular-nums font-mono">{formatAmount(totalCreditMvt)}</TableCell>
                <TableCell className="text-right tabular-nums font-mono bg-muted/10">{formatAmount(totalSoldeDbt)}</TableCell>
                <TableCell className="text-right tabular-nums font-mono bg-muted/10">{formatAmount(totalSoldeCdt)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

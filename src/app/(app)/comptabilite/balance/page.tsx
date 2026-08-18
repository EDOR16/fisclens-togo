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

const EMPTY_BALANCE: BalanceLine[] = [];

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
  const totalDebitMvt  = sumField(EMPTY_BALANCE, "debitMouvements");
  const totalCreditMvt = sumField(EMPTY_BALANCE, "creditMouvements");
  const totalSoldeDbt  = sumField(EMPTY_BALANCE, "soldeDebiteur");
  const totalSoldeCdt  = sumField(EMPTY_BALANCE, "soldeCrediteur");
  const isBalanced = true;
  const classes: number[] = [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Balance générale</h2>
          <p className="text-sm text-muted-foreground">Aucune donnée fictive — la balance se remplira après vos saisies réelles.</p>
        </div>
        <span className={cn(
          "rounded-full px-3 py-1 text-xs font-semibold",
          isBalanced ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        )}>
          {isBalanced ? "✓ Équilibrée" : "✗ Déséquilibrée"}
        </span>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="font-hand text-3xl text-foreground">Votre balance est vide.</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Les soldes seront recalculés automatiquement dès qu’une écriture comptable réelle sera ajoutée.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

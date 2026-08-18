import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAmount, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";

export const metadata: Metadata = { title: "Journaux comptables" };

const JOURNAUX = ["ACHATS", "VENTES", "BANQUE", "CAISSE", "OD", "PAIE"] as const;
type Journal = typeof JOURNAUX[number];

const JOURNAL_LABELS: Record<Journal, string> = {
  ACHATS: "Achats", VENTES: "Ventes", BANQUE: "Banque",
  CAISSE: "Caisse", OD: "Opérations diverses", PAIE: "Paie",
};

const EMPTY_ECRITURES: Array<{ id: string; date: string; piece: string; libelle: string; journal: Journal; debit: number; credit: number }> = [];

export default function JournauxPage({
  searchParams,
}: {
  searchParams: { journal?: string; periode?: string };
}) {
  const activeJournal = searchParams.journal as Journal | undefined;
  const filtered = activeJournal
    ? EMPTY_ECRITURES.filter((e) => e.journal === activeJournal)
    : EMPTY_ECRITURES;

  const totalDebit = 0;
  const totalCredit = 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Journaux comptables</h2>
        <p className="text-sm text-muted-foreground">Aucune écriture fictive — le journal se remplit uniquement avec vos pièces réelles</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href="/comptabilite/journaux" className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${!activeJournal ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}>
          Tous
        </a>
        {JOURNAUX.map((j) => (
          <a
            key={j}
            href={`/comptabilite/journaux?journal=${j}`}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${activeJournal === j ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}
          >
            {JOURNAL_LABELS[j]}
          </a>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            0 écriture
            {activeJournal ? ` — Journal ${JOURNAL_LABELS[activeJournal]}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="font-hand text-3xl">Votre journal est vide.</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Les écritures que vous saisirez apparaîtront ici, sans any mock ni donnée inventée.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

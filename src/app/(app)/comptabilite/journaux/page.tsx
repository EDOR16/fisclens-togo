import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAmount, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";

export const metadata: Metadata = { title: "Journaux comptables" };

// Données mock — seront remplacées par appel service/
const JOURNAUX = ["ACHATS", "VENTES", "BANQUE", "CAISSE", "OD", "PAIE"] as const;
type Journal = typeof JOURNAUX[number];

const JOURNAL_LABELS: Record<Journal, string> = {
  ACHATS: "Achats", VENTES: "Ventes", BANQUE: "Banque",
  CAISSE: "Caisse", OD: "Opérations diverses", PAIE: "Paie",
};

const MOCK_ECRITURES = [
  { id: "1", date: "2025-08-14", piece: "FAC-001", libelle: "Achat matériel", journal: "ACHATS" as Journal, debit: 450_000, credit: 0 },
  { id: "2", date: "2025-08-13", piece: "ENC-042", libelle: "Encaissement client", journal: "BANQUE" as Journal, debit: 0, credit: 2_300_000 },
  { id: "3", date: "2025-08-12", piece: "PAI-008", libelle: "Paie août", journal: "PAIE" as Journal, debit: 3_200_000, credit: 0 },
];

export default function JournauxPage({
  searchParams,
}: {
  searchParams: { journal?: string; periode?: string };
}) {
  const activeJournal = searchParams.journal as Journal | undefined;
  const filtered = activeJournal
    ? MOCK_ECRITURES.filter((e) => e.journal === activeJournal)
    : MOCK_ECRITURES;

  const totalDebit  = filtered.reduce((s, e) => s + e.debit,  0);
  const totalCredit = filtered.reduce((s, e) => s + e.credit, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Journaux comptables</h2>
        <p className="text-sm text-muted-foreground">Filtrer par journal et période</p>
      </div>

      {/* Filtres journaux */}
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
            {filtered.length} écriture{filtered.length > 1 ? "s" : ""}
            {activeJournal ? ` — Journal ${JOURNAL_LABELS[activeJournal]}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Pièce</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Journal</TableHead>
                <TableHead className="text-right">Débit</TableHead>
                <TableHead className="text-right">Crédit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm">{formatDate(e.date)}</TableCell>
                  <TableCell className="font-mono text-xs">{e.piece}</TableCell>
                  <TableCell className="text-sm">{e.libelle}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{JOURNAL_LABELS[e.journal]}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-mono text-sm">
                    {e.debit > 0 ? formatAmount(e.debit) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-mono text-sm">
                    {e.credit > 0 ? formatAmount(e.credit) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-semibold">Total</TableCell>
                <TableCell className="text-right tabular-nums font-mono font-semibold">
                  {formatAmount(totalDebit)}
                </TableCell>
                <TableCell className="text-right tabular-nums font-mono font-semibold">
                  {formatAmount(totalCredit)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatAmount, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { api } from "@/lib/api-client";
import { Loader2, RefreshCw, Search, BookOpen, PlusCircle, Paperclip, ExternalLink, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const JOURNAUX = ["ACHATS", "VENTES", "BANQUE", "CAISSE", "OD", "PAIE"] as const;
type Journal = typeof JOURNAUX[number];

const JOURNAL_LABELS: Record<Journal, string> = {
  ACHATS: "Achats",
  VENTES: "Ventes",
  BANQUE: "Banque",
  CAISSE: "Caisse",
  OD: "Opérations diverses",
  PAIE: "Paie",
};

const JOURNAL_BADGE_STYLES: Record<Journal, string> = {
  ACHATS: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  VENTES: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  BANQUE: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  CAISSE: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  OD: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  PAIE: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300",
};

type JournalRow = {
  id: string;
  ecritureId: string;
  date: string;
  piece: string;
  journal: Journal;
  accountCode: string;
  libelle: string;
  debit: number;
  credit: number;
  documentUrl?: string | null;
  documentName?: string | null;
};

type EcritureItem = {
  id: string;
  journal: Journal;
  date: string;
  piece: string;
  libelle: string;
  status: string;
  documentUrl?: string | null;
  documentName?: string | null;
  lines: Array<{
    id: string;
    accountCode: string;
    libelle: string;
    debit: number;
    credit: number;
  }>;
};

type JournauxApiResponse = {
  journal: string;
  periode: string;
  ecritures: EcritureItem[];
  rows: JournalRow[];
  totals: {
    totalDebit: number;
    totalCredit: number;
  };
};

function JournauxContent() {
  const searchParams = useSearchParams();
  const initialJournal = (searchParams.get("journal") as Journal) || null;

  const [activeJournal, setActiveJournal] = useState<Journal | null>(initialJournal);
  const [data, setData] = useState<JournauxApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal d'aperçu de pièce jointe
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; piece: string } | null>(null);

  const fetchJournaux = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeJournal
        ? `/accounting/journaux?journal=${activeJournal}`
        : "/accounting/journaux";
      const res = await api.get<JournauxApiResponse>(endpoint);
      setData(res);
    } catch (err: any) {
      toast.error("Impossible de charger les journaux : " + (err.message || "Erreur réseau"));
    } finally {
      setLoading(false);
    }
  }, [activeJournal]);

  useEffect(() => {
    fetchJournaux();
  }, [fetchJournaux]);

  const rows = data?.rows || [];
  const filteredRows = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.piece.toLowerCase().includes(q) ||
      r.accountCode.toLowerCase().includes(q) ||
      r.libelle.toLowerCase().includes(q) ||
      r.date.includes(q)
    );
  });

  const totalDebit = filteredRows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = filteredRows.reduce((s, r) => s + r.credit, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Journaux comptables
          </h2>
          <p className="text-sm text-muted-foreground">
            Consultation chronologique des écritures réelles et des pièces justificatives attachées (GED)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchJournaux} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
            Actualiser
          </Button>
          <a href="/comptabilite/saisie">
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-1" />
              Nouvelle écriture
            </Button>
          </a>
        </div>
      </div>

      {/* Onglets de Journaux */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveJournal(null)}
          className={cn(
            "rounded-full px-3.5 py-1 text-xs font-medium border transition-colors",
            activeJournal === null
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-muted"
          )}
        >
          Tous les journaux
        </button>
        {JOURNAUX.map((j) => (
          <button
            key={j}
            onClick={() => setActiveJournal(j)}
            className={cn(
              "rounded-full px-3.5 py-1 text-xs font-medium border transition-colors",
              activeJournal === j
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted"
            )}
          >
            {JOURNAL_LABELS[j]}
          </button>
        ))}
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrer par N° de pièce, compte, libellé ou date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tableau des écritures du journal */}
      <Card>
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {filteredRows.length} ligne(s) d&apos;écriture
            {activeJournal ? ` — Journal ${JOURNAL_LABELS[activeJournal]}` : " (Tous journaux)"}
          </CardTitle>
          <span className="text-xs font-mono text-muted-foreground">
            Total Débit : {formatAmount(totalDebit)} | Total Crédit : {formatAmount(totalCredit)}
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {loading && !data ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Chargement du journal...</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center">
              <div className="rounded-md border border-dashed border-border bg-muted/20 p-8">
                <p className="font-hand text-3xl">Votre journal est vide.</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Les écritures que vous saisirez apparaîtront ici automatiquement avec leurs pièces jointes.
                </p>
                <div className="mt-4">
                  <a href="/comptabilite/saisie">
                    <Button size="sm">Saisir une première écriture</Button>
                  </a>
                </div>
              </div>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Aucune écriture ne correspond à votre recherche.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-24">Date</TableHead>
                    <TableHead className="w-24">Journal</TableHead>
                    <TableHead className="w-32 font-mono">N° Pièce</TableHead>
                    <TableHead className="w-24 font-mono">Compte</TableHead>
                    <TableHead>Libellé de l&apos;opération</TableHead>
                    <TableHead className="w-24 text-center">Justificatif</TableHead>
                    <TableHead className="text-right font-mono w-32">Débit (FCFA)</TableHead>
                    <TableHead className="text-right font-mono w-32">Crédit (FCFA)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs">{formatDate(r.date)}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-block rounded px-2 py-0.5 text-[10px] font-bold font-mono tracking-wider",
                            JOURNAL_BADGE_STYLES[r.journal] || "bg-muted text-foreground"
                          )}
                        >
                          {r.journal}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                        {r.piece}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-primary">
                        {r.accountCode}
                      </TableCell>
                      <TableCell className="text-sm">{r.libelle}</TableCell>
                      <TableCell className="text-center">
                        {r.documentUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setPreviewDoc({
                                url: r.documentUrl!,
                                name: r.documentName || `Piece_${r.piece}`,
                                piece: r.piece,
                              })
                            }
                            className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1"
                            title={`Voir la pièce jointe : ${r.documentName || r.piece}`}
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            <span>Facture</span>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-mono text-xs font-semibold">
                        {r.debit > 0 ? (
                          <span className="text-red-700 dark:text-red-400">{formatAmount(r.debit)}</span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-mono text-xs font-semibold">
                        {r.credit > 0 ? (
                          <span className="text-emerald-700 dark:text-emerald-400">{formatAmount(r.credit)}</span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="font-bold text-sm bg-muted/80">
                    <TableCell colSpan={6}>TOTAL ({filteredRows.length} lignes)</TableCell>
                    <TableCell className="text-right tabular-nums font-mono text-red-700 dark:text-red-400">
                      {formatAmount(totalDebit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-mono text-emerald-700 dark:text-emerald-400">
                      {formatAmount(totalCredit)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal d'Aperçu de la Pièce Justificative */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-lg border border-border max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-bold">Pièce justificative : {previewDoc.piece}</h3>
                  <p className="text-xs text-muted-foreground">{previewDoc.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  download={previewDoc.name}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex"
                >
                  <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ouvrir / Télécharger
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewDoc(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-muted/20 min-h-[300px]">
              {previewDoc.url.startsWith("data:image/") ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  className="max-h-[60vh] max-w-full rounded border object-contain"
                />
              ) : previewDoc.url.startsWith("data:application/pdf") ? (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.name}
                  className="w-full h-[60vh] rounded border"
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <FileText className="h-12 w-12 mx-auto text-primary" />
                  <p className="text-sm font-medium">{previewDoc.name}</p>
                  <a href={previewDoc.url} download={previewDoc.name}>
                    <Button size="sm">Télécharger la pièce</Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JournauxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement des journaux...</span>
        </div>
      }
    >
      <JournauxContent />
    </Suspense>
  );
}


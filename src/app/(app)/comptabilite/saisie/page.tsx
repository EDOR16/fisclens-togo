"use client";

import { useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  PenTool,
  Upload,
  Download,
  ArrowRight,
  Sparkles,
  Paperclip,
  X,
  FileCheck,
} from "lucide-react";
import * as XLSX from "xlsx";

import { api, ApiException } from "@/lib/api-client";
import { formatAmount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types & Schémas
// ---------------------------------------------------------------------------

const LineSchema = z.object({
  accountCode: z.string().regex(/^\d{3,8}$/, "Code compte SYSCOHADA (3-8 chiffres)"),
  libelle: z.string().min(1, "Libellé requis"),
  debit: z.coerce.number().int().nonnegative("Entier ≥ 0"),
  credit: z.coerce.number().int().nonnegative("Entier ≥ 0"),
});

const EntryFormSchema = z.object({
  journal: z.enum(["ACHATS", "VENTES", "BANQUE", "CAISSE", "OD", "PAIE"]),
  date: z.string().min(1, "Date requise"),
  piece: z.string().min(1, "N° de pièce requis"),
  lines: z.array(LineSchema).min(2, "Minimum 2 lignes"),
});

type EntryFormValues = z.infer<typeof EntryFormSchema>;

type ParsedEntry = {
  id: string;
  journal: "ACHATS" | "VENTES" | "BANQUE" | "CAISSE" | "OD" | "PAIE";
  date: string;
  piece: string;
  libelle?: string;
  lines: Array<{
    accountCode: string;
    libelle: string;
    debit: number;
    credit: number;
  }>;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
};

const JOURNALS = [
  { value: "ACHATS", label: "Achats" },
  { value: "VENTES", label: "Ventes" },
  { value: "BANQUE", label: "Banque" },
  { value: "CAISSE", label: "Caisse" },
  { value: "OD", label: "Opérations diverses" },
  { value: "PAIE", label: "Paie" },
] as const;

// ---------------------------------------------------------------------------
// Contrôle d'équilibre
// ---------------------------------------------------------------------------

function BalanceControl({ lines }: { lines: EntryFormValues["lines"] }) {
  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const balanced = totalDebit > 0 && totalDebit === totalCredit;
  const diff = Math.abs(totalDebit - totalCredit);

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md px-4 py-3 text-sm font-medium",
        balanced ? "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300" : "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300"
      )}
    >
      <div className="flex items-center gap-2">
        {balanced ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <span>
          {balanced ? "Écriture équilibrée ✓" : `Écart : ${formatAmount(diff)} FCFA`}
        </span>
      </div>
      <div className="flex gap-4 tabular-nums font-mono text-xs">
        <span>Débit : {formatAmount(totalDebit)}</span>
        <span>Crédit : {formatAmount(totalCredit)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Principale
// ---------------------------------------------------------------------------

export default function SaisiePage() {
  const [activeTab, setActiveTab] = useState<"MANUAL" | "EXCEL" | "PDF">("MANUAL");

  // Pièce jointe (Facture PDF / Image)
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    url: string;
    size: number;
    type: string;
  } | null>(null);

  const docInputRef = useRef<HTMLInputElement>(null);

  const handleDocAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le fichier dépasse la taille maximale autorisée (5 Mo)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setAttachedFile({
        name: file.name,
        url: dataUrl,
        size: file.size,
        type: file.type,
      });
      toast.success(`Facture jointe : ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if (docInputRef.current) docInputRef.current.value = "";
  };

  // --- Saisie Manuelle ---
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(EntryFormSchema),
    defaultValues: {
      journal: "ACHATS",
      date: new Date().toISOString().slice(0, 10),
      piece: "",
      lines: [
        { accountCode: "", libelle: "", debit: 0, credit: 0 },
        { accountCode: "", libelle: "", debit: 0, credit: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = watch("lines");

  async function onManualSubmit(data: EntryFormValues) {
    try {
      await api.post(
        "/accounting/ecritures",
        {
          ...data,
          documentUrl: attachedFile?.url || undefined,
          documentName: attachedFile?.name || undefined,
        },
        {
          queueOffline: true,
          idempotencyKey: `entry-${data.piece}-${Date.now()}`,
        }
      );
      toast.success("Écriture et pièce justificative enregistrées avec succès !");
      reset({
        journal: data.journal,
        date: data.date,
        piece: "",
        lines: [
          { accountCode: "", libelle: "", debit: 0, credit: 0 },
          { accountCode: "", libelle: "", debit: 0, credit: 0 },
        ],
      });
      setAttachedFile(null);
    } catch (err: any) {
      if (err instanceof ApiException) {
        if (err.status === 409) toast.error("Pièce en doublon — vérifiez le numéro");
        else if (err.status === 423) toast.error("Exercice verrouillé — saisie impossible");
        else toast.error(err.message || err.code || "Erreur de validation");
      } else {
        toast.error(err.message || "Erreur lors de l'enregistrement");
      }
    }
  }

  // --- Import Excel / CSV ---
  const [excelEntries, setExcelEntries] = useState<ParsedEntry[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadExcelTemplate = () => {
    const templateData = [
      {
        Journal: "ACHATS",
        Date: "2026-08-30",
        Piece: "FAC-001",
        Compte: "601100",
        Libelle: "Achat de marchandises",
        Debit: 500000,
        Credit: 0,
      },
      {
        Journal: "ACHATS",
        Date: "2026-08-30",
        Piece: "FAC-001",
        Compte: "445200",
        Libelle: "TVA déductible sur achats (18%)",
        Debit: 90000,
        Credit: 0,
      },
      {
        Journal: "ACHATS",
        Date: "2026-08-30",
        Piece: "FAC-001",
        Compte: "401100",
        Libelle: "Fournisseur ETS TOGO",
        Debit: 0,
        Credit: 590000,
      },
      {
        Journal: "VENTES",
        Date: "2026-08-30",
        Piece: "FAC-V01",
        Compte: "411100",
        Libelle: "Client Société Lomé",
        Debit: 1180000,
        Credit: 0,
      },
      {
        Journal: "VENTES",
        Date: "2026-08-30",
        Piece: "FAC-V01",
        Compte: "701100",
        Libelle: "Vente de marchandises",
        Debit: 0,
        Credit: 1000000,
      },
      {
        Journal: "VENTES",
        Date: "2026-08-30",
        Piece: "FAC-V01",
        Compte: "443100",
        Libelle: "TVA facturée sur ventes (18%)",
        Debit: 0,
        Credit: 180000,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ecritures");
    XLSX.writeFile(wb, "modele_import_ecritures_syscohada.xlsx");
    toast.success("Modèle Excel téléchargé !");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rows.length === 0) {
          toast.error("Le fichier sélectionné est vide");
          return;
        }

        const grouped = new Map<string, ParsedEntry>();

        rows.forEach((r, idx) => {
          const rawJournal = String(r.Journal || r.journal || "ACHATS").toUpperCase().trim();
          const validJournal = (["ACHATS", "VENTES", "BANQUE", "CAISSE", "OD", "PAIE"].includes(rawJournal)
            ? rawJournal
            : "OD") as ParsedEntry["journal"];

          let rawDate = String(r.Date || r.date || new Date().toISOString().slice(0, 10)).trim();
          if (!isNaN(Number(rawDate)) && Number(rawDate) > 30000) {
            const excelDate = new Date(Math.round((Number(rawDate) - 25569) * 86400 * 1000));
            rawDate = excelDate.toISOString().slice(0, 10);
          }

          const piece = String(r.Piece || r.piece || `IMP-${idx + 1}`).trim();
          const accountCode = String(r.Compte || r.compte || r.accountCode || "").trim();
          const libelle = String(r.Libelle || r.libelle || `Écriture ${piece}`).trim();
          const debit = Math.round(Number(r.Debit || r.debit || 0));
          const credit = Math.round(Number(r.Credit || r.credit || 0));

          if (!accountCode) return;

          const key = `${validJournal}__${rawDate}__${piece}`;

          if (!grouped.has(key)) {
            grouped.set(key, {
              id: key,
              journal: validJournal,
              date: rawDate,
              piece,
              libelle,
              lines: [],
              totalDebit: 0,
              totalCredit: 0,
              isBalanced: false,
            });
          }

          const entry = grouped.get(key)!;
          entry.lines.push({
            accountCode,
            libelle,
            debit,
            credit,
          });
          entry.totalDebit += debit;
          entry.totalCredit += credit;
          entry.isBalanced = entry.totalDebit > 0 && entry.totalDebit === entry.totalCredit;
        });

        const parsedList = Array.from(grouped.values());
        setExcelEntries(parsedList);
        toast.success(`${parsedList.length} écriture(s) détectée(s) dans le fichier !`);
      } catch (err: any) {
        toast.error("Erreur lors de la lecture du fichier : " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBatchSubmit = async () => {
    if (excelEntries.length === 0) return;

    const unbalanced = excelEntries.filter((e) => !e.isBalanced);
    if (unbalanced.length > 0) {
      toast.error(
        `${unbalanced.length} écriture(s) sont déséquilibrées. Veuillez corriger le fichier avant import.`
      );
      return;
    }

    setIsImporting(true);
    try {
      const res: any = await api.post("/accounting/ecritures/batch", {
        entries: excelEntries.map((e) => ({
          journal: e.journal,
          date: e.date,
          piece: e.piece,
          libelle: e.libelle,
          lines: e.lines,
        })),
      });

      toast.success(`${res.count || excelEntries.length} écritures importées avec succès !`);
      setExcelEntries([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'import des écritures");
    } finally {
      setIsImporting(false);
    }
  };

  // --- Assistant / Extraction Facture PDF ---
  const [pdfDocType, setPdfDocType] = useState<"ACHAT" | "VENTE">("ACHAT");
  const [pdfPiece, setPdfPiece] = useState("FAC-PDF-001");
  const [pdfDate, setPdfDate] = useState(new Date().toISOString().slice(0, 10));
  const [pdfTiers, setPdfTiers] = useState("Fournisseur / Client X");
  const [pdfMontantHT, setPdfMontantHT] = useState<number>(100000);
  const [pdfApplyTva, setPdfApplyTva] = useState(true);

  const tvaRate = 0.18;
  const pdfTvaAmount = pdfApplyTva ? Math.round(pdfMontantHT * tvaRate) : 0;
  const pdfMontantTTC = pdfMontantHT + pdfTvaAmount;

  const handlePdfInject = () => {
    if (pdfDocType === "ACHAT") {
      setValue("journal", "ACHATS");
      setValue("date", pdfDate);
      setValue("piece", pdfPiece);
      setValue("lines", [
        { accountCode: "601100", libelle: `Achat marchandises - ${pdfTiers}`, debit: pdfMontantHT, credit: 0 },
        ...(pdfApplyTva
          ? [{ accountCode: "445200", libelle: "TVA déductible sur achats (18%)", debit: pdfTvaAmount, credit: 0 }]
          : []),
        { accountCode: "401100", libelle: `Fournisseur - ${pdfTiers}`, debit: 0, credit: pdfMontantTTC },
      ]);
    } else {
      setValue("journal", "VENTES");
      setValue("date", pdfDate);
      setValue("piece", pdfPiece);
      setValue("lines", [
        { accountCode: "411100", libelle: `Client - ${pdfTiers}`, debit: pdfMontantTTC, credit: 0 },
        { accountCode: "701100", libelle: `Ventes marchandises - ${pdfTiers}`, debit: 0, credit: pdfMontantHT },
        ...(pdfApplyTva
          ? [{ accountCode: "443100", libelle: "TVA facturée sur ventes (18%)", debit: 0, credit: pdfTvaAmount }]
          : []),
      ]);
    }
    setActiveTab("MANUAL");
    toast.success("Écriture pré-remplie dans le formulaire de saisie !");
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
          <PenTool className="h-5 w-5" /> Saisie & Import d&apos;Écritures Comptables
        </h2>
        <p className="text-sm text-muted-foreground">
          Enregistrement conforme SYSCOHADA avec conservation numérique des pièces justificatives (GED)
        </p>
      </div>

      {/* Onglets de modes de saisie */}
      <div className="flex border-b space-x-3">
        <button
          onClick={() => setActiveTab("MANUAL")}
          className={cn(
            "flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors",
            activeTab === "MANUAL"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <PenTool className="h-4 w-4" />
          Saisie Manuelle & Pièce jointe
        </button>
        <button
          onClick={() => setActiveTab("EXCEL")}
          className={cn(
            "flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors",
            activeTab === "EXCEL"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Import Fichier Excel / CSV
        </button>
        <button
          onClick={() => setActiveTab("PDF")}
          className={cn(
            "flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors",
            activeTab === "PDF"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="h-4 w-4" />
          Assistant Facture PDF
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODE 1 : SAISIE MANUELLE + PIÈCE JOINTE                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === "MANUAL" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nouvelle écriture comptable</CardTitle>
            <CardDescription>
              Saisie multi-lignes avec contrôle d&apos;équilibre et preuve documentaire attachée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onManualSubmit)} className="space-y-5">
              {/* En-tête écriture */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Journal</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...register("journal")}
                  >
                    {JOURNALS.map((j) => (
                      <option key={j.value} value={j.value}>
                        {j.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" {...register("date")} />
                  {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">N° de pièce</label>
                  <Input placeholder="FAC-2025-001" {...register("piece")} />
                  {errors.piece && <p className="text-xs text-destructive">{errors.piece.message}</p>}
                </div>
              </div>

              {/* Lignes d'écriture */}
              <div className="space-y-2">
                <div className="grid grid-cols-[120px_1fr_130px_130px_36px] gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                  <span>Compte</span>
                  <span>Libellé</span>
                  <span className="text-right">Débit (FCFA)</span>
                  <span className="text-right">Crédit (FCFA)</span>
                  <span />
                </div>

                {fields.map((field, i) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-[120px_1fr_130px_130px_36px] gap-2 items-start"
                  >
                    <div>
                      <Input
                        placeholder="Ex: 601100"
                        className="font-mono text-sm"
                        {...register(`lines.${i}.accountCode`)}
                      />
                      {errors.lines?.[i]?.accountCode && (
                        <p className="text-xs text-destructive mt-0.5">
                          {errors.lines[i]?.accountCode?.message}
                        </p>
                      )}
                    </div>

                    <Input
                      placeholder="Libellé de l'opération"
                      {...register(`lines.${i}.libelle`)}
                    />

                    <div>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="0"
                        className="text-right tabular-nums font-mono"
                        {...register(`lines.${i}.debit`)}
                      />
                    </div>

                    <div>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="0"
                        className="text-right tabular-nums font-mono"
                        {...register(`lines.${i}.credit`)}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => fields.length > 2 && remove(i)}
                      disabled={fields.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() => append({ accountCode: "", libelle: "", debit: 0, credit: 0 })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une ligne
                </Button>
              </div>

              {/* Contrôle d'équilibre */}
              <BalanceControl lines={lines} />

              {/* Champ d'upload de la pièce justificative (GED) */}
              <div className="rounded-md border border-dashed border-border p-4 bg-muted/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      Pièce justificative (Facture PDF, Reçu ou Scan)
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">Optionnel · Max 5 Mo</span>
                </div>

                {attachedFile ? (
                  <div className="flex items-center justify-between bg-card p-3 rounded-md border border-border">
                    <div className="flex items-center gap-3">
                      <FileCheck className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-xs font-semibold text-foreground truncate max-w-[280px] sm:max-w-md">
                          {attachedFile.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {(attachedFile.size / 1024).toFixed(1)} Ko · Prêt pour archivage
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeAttachment}
                      className="text-muted-foreground hover:text-destructive h-8 px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={docInputRef}
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={handleDocAttachment}
                      className="hidden"
                      id="docUploadInput"
                    />
                    <label htmlFor="docUploadInput" className="cursor-pointer inline-block">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-1.5" />
                          Joindre une facture ou un justificatif (PDF / Image)
                        </span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting} className="min-w-[170px]">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enregistrement…
                    </>
                  ) : (
                    "Enregistrer l'écriture"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                    removeAttachment();
                  }}
                >
                  Réinitialiser
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODE 2 : IMPORT EXCEL / CSV                                 */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === "EXCEL" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Importer un classeur Excel ou CSV</CardTitle>
                <CardDescription>
                  Importez plusieurs écritures et pièces en une seule opération.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={downloadExcelTemplate}>
                <Download className="h-4 w-4 mr-1" />
                Télécharger le modèle Excel (.xlsx)
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/10 transition-colors">
                <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Sélectionnez votre fichier Excel (.xlsx, .xls, .csv)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Colonnes attendues : <code>Journal</code>, <code>Date</code>, <code>Piece</code>, <code>Compte</code>, <code>Libelle</code>, <code>Debit</code>, <code>Credit</code>
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excelUploadInput"
                />
                <label htmlFor="excelUploadInput" className="mt-4 inline-block">
                  <Button type="button" variant="secondary" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-1.5" />
                      Parcourir les fichiers
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Prévisualisation des écritures Excel */}
          {excelEntries.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                <div>
                  <CardTitle className="text-base">
                    Prévisualisation des écritures ({excelEntries.length})
                  </CardTitle>
                  <CardDescription>
                    Vérifiez la conformité et l&apos;équilibre avant enregistrement en base.
                  </CardDescription>
                </div>
                <Button
                  onClick={handleBatchSubmit}
                  disabled={isImporting || excelEntries.some((e) => !e.isBalanced)}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importation...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1.5" /> Enregistrer les {excelEntries.length} écritures
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                {excelEntries.map((entry, idx) => (
                  <div key={entry.id || idx} className="p-4 border-b last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {entry.journal}
                        </Badge>
                        <span className="font-mono text-xs font-bold text-primary">
                          Pièce : {entry.piece}
                        </span>
                        <span className="text-xs text-muted-foreground">({entry.date})</span>
                      </div>
                      <span
                        className={cn(
                          "text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1",
                          entry.isBalanced
                            ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        )}
                      >
                        {entry.isBalanced ? "✓ Équilibrée" : "✗ Déséquilibrée"}
                      </span>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-24 font-mono text-xs">Compte</TableHead>
                          <TableHead className="text-xs">Libellé</TableHead>
                          <TableHead className="text-right font-mono text-xs w-28">Débit</TableHead>
                          <TableHead className="text-right font-mono text-xs w-28">Crédit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entry.lines.map((l, lIdx) => (
                          <TableRow key={lIdx}>
                            <TableCell className="font-mono text-xs font-semibold">{l.accountCode}</TableCell>
                            <TableCell className="text-xs">{l.libelle}</TableCell>
                            <TableCell className="text-right font-mono text-xs tabular-nums">
                              {l.debit > 0 ? formatAmount(l.debit) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs tabular-nums">
                              {l.credit > 0 ? formatAmount(l.credit) : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow className="font-bold text-xs bg-muted/50">
                          <TableCell colSpan={2}>Total de la pièce</TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatAmount(entry.totalDebit)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatAmount(entry.totalCredit)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODE 3 : ASSISTANT FACTURE / PIÈCE PDF                      */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === "PDF" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Assistant d&apos;imputation automatique (Facture / Pièce PDF)
            </CardTitle>
            <CardDescription>
              Générez automatiquement les écritures SYSCOHADA conformes (TVA 18%, Fournisseur/Client) à partir des montants de votre facture.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Type d&apos;opération</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={pdfDocType}
                  onChange={(e) => setPdfDocType(e.target.value as any)}
                >
                  <option value="ACHAT">Facture d&apos;Achat (Journal ACHATS)</option>
                  <option value="VENTE">Facture de Vente (Journal VENTES)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">N° de Facture / Pièce</label>
                <Input value={pdfPiece} onChange={(e) => setPdfPiece(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tiers (Fournisseur ou Client)</label>
                <Input value={pdfTiers} onChange={(e) => setPdfTiers(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Date de la facture</label>
                <Input type="date" value={pdfDate} onChange={(e) => setPdfDate(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Montant Hors Taxe (HT en FCFA)</label>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={pdfMontantHT}
                  onChange={(e) => setPdfMontantHT(Number(e.target.value) || 0)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="applyTva"
                  checked={pdfApplyTva}
                  onChange={(e) => setPdfApplyTva(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary"
                />
                <label htmlFor="applyTva" className="text-sm font-medium cursor-pointer">
                  Appliquer la TVA Togo (18%)
                </label>
              </div>
            </div>

            {/* Aperçu du schéma d'écriture généré */}
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Schéma d&apos;imputation SYSCOHADA calculé :
              </span>
              <div className="space-y-1.5 font-mono text-xs">
                {pdfDocType === "ACHAT" ? (
                  <>
                    <div className="flex justify-between py-1 border-b">
                      <span>601100 — Achats marchandises ({pdfTiers})</span>
                      <span className="text-red-600 font-semibold">Débit : {formatAmount(pdfMontantHT)} FCFA</span>
                    </div>
                    {pdfApplyTva && (
                      <div className="flex justify-between py-1 border-b">
                        <span>445200 — État, TVA déductible s/achats (18%)</span>
                        <span className="text-red-600 font-semibold">Débit : {formatAmount(pdfTvaAmount)} FCFA</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 font-bold">
                      <span>401100 — Fournisseur ({pdfTiers})</span>
                      <span className="text-emerald-600">Crédit : {formatAmount(pdfMontantTTC)} FCFA</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between py-1 border-b font-bold">
                      <span>411100 — Client ({pdfTiers})</span>
                      <span className="text-red-600">Débit : {formatAmount(pdfMontantTTC)} FCFA</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span>701100 — Ventes de marchandises</span>
                      <span className="text-emerald-600 font-semibold">Crédit : {formatAmount(pdfMontantHT)} FCFA</span>
                    </div>
                    {pdfApplyTva && (
                      <div className="flex justify-between py-1">
                        <span>443100 — État, TVA facturée s/ventes (18%)</span>
                        <span className="text-emerald-600 font-semibold">Crédit : {formatAmount(pdfTvaAmount)} FCFA</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <Button onClick={handlePdfInject} className="w-full sm:w-auto">
              <ArrowRight className="h-4 w-4 mr-1.5" />
              Transférer vers le formulaire de saisie pour validation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

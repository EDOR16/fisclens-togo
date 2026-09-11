"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import { OcrInvoiceScanner } from "@/components/accounting/ocr-invoice-scanner";
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

function SaisieContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"MANUAL" | "EXCEL" | "OCR">("OCR");

  useEffect(() => {
    if (tabParam === "manual") setActiveTab("MANUAL");
    else if (tabParam === "excel") setActiveTab("EXCEL");
    else if (tabParam === "ocr") setActiveTab("OCR");
  }, [tabParam]);

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

  const downloadFullMonthTestFile = async () => {
    try {
      const {
        TEST_ECRITURES_1MOIS,
        TEST_VENTES_BI_1MOIS,
        TEST_ACHATS_BI_1MOIS,
        TEST_PRODUITS_1MOIS,
        TEST_CLIENTS_1MOIS,
        FICHE_SOCIETE,
      } = await import("@/lib/fiscal/test-dataset");

      const wb = XLSX.utils.book_new();

      // Onglet 1 : Ecritures Comptables (Lu par défaut par le module d'import FiscLens)
      const wsEcritures = XLSX.utils.json_to_sheet(TEST_ECRITURES_1MOIS);
      XLSX.utils.book_append_sheet(wb, wsEcritures, "Ecritures_Comptables");

      // Onglet 2 : Ventes détaillées (Workspace BI)
      const wsVentes = XLSX.utils.json_to_sheet(TEST_VENTES_BI_1MOIS);
      XLSX.utils.book_append_sheet(wb, wsVentes, "Ventes");

      // Onglet 3 : Achats détaillés (Workspace BI)
      const wsAchats = XLSX.utils.json_to_sheet(TEST_ACHATS_BI_1MOIS);
      XLSX.utils.book_append_sheet(wb, wsAchats, "Achats");

      // Onglet 4 : Catalogue Produits (Workspace BI)
      const wsProduits = XLSX.utils.json_to_sheet(TEST_PRODUITS_1MOIS);
      XLSX.utils.book_append_sheet(wb, wsProduits, "Catalogue_Produits");

      // Onglet 5 : Répertoire Clients (5 Régions Togo)
      const wsClients = XLSX.utils.json_to_sheet(TEST_CLIENTS_1MOIS);
      XLSX.utils.book_append_sheet(wb, wsClients, "Repertoire_Clients");

      // Onglet 6 : Fiche Société & Données Fiscales
      const wsFiche = XLSX.utils.json_to_sheet(FICHE_SOCIETE);
      XLSX.utils.book_append_sheet(wb, wsFiche, "Fiche_Entreprise_Togo");

      XLSX.writeFile(wb, "FiscLens_Test_AFRIQ_TECH_1Mois.xlsx");
      toast.success("Jeu d'essai complet 1 Mois (AFRIQ-TECH DISTRIB SARL) téléchargé en .xlsx !");
    } catch (err: any) {
      toast.error("Erreur lors de la génération du fichier Excel : " + err.message);
    }
  };

  const downloadExcelTemplate = () => {
    const templateData = [
      {
        Journal: "ACHATS",
        Date: "2026-08-02",
        Piece: "FAC-ACH-2026-0802",
        Compte: "601100",
        Libelle: "Achat stock matériel info HP & Dell",
        Debit: 3525000,
        Credit: 0,
      },
      {
        Journal: "ACHATS",
        Date: "2026-08-02",
        Piece: "FAC-ACH-2026-0802",
        Compte: "445200",
        Libelle: "État Togo - TVA déductible s/achats 18%",
        Debit: 634500,
        Credit: 0,
      },
      {
        Journal: "ACHATS",
        Date: "2026-08-02",
        Piece: "FAC-ACH-2026-0802",
        Compte: "401100",
        Libelle: "Fournisseur Comptoir Général Info Lomé",
        Debit: 0,
        Credit: 4159500,
      },
      {
        Journal: "VENTES",
        Date: "2026-08-04",
        Piece: "FAC-VTE-2026-0801",
        Compte: "411100",
        Libelle: "Client SOGEA SATOM Togo SA (Maritime)",
        Debit: 3304000,
        Credit: 0,
      },
      {
        Journal: "VENTES",
        Date: "2026-08-04",
        Piece: "FAC-VTE-2026-0801",
        Compte: "701100",
        Libelle: "Vente portables HP & Dell HT",
        Debit: 0,
        Credit: 2800000,
      },
      {
        Journal: "VENTES",
        Date: "2026-08-04",
        Piece: "FAC-VTE-2026-0801",
        Compte: "443100",
        Libelle: "État Togo - TVA facturée s/ventes 18%",
        Debit: 0,
        Credit: 504000,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ecritures");
    XLSX.writeFile(wb, "modele_import_ecritures_syscohada.xlsx");
    toast.success("Modèle Excel vierge téléchargé !");
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

      if (res.failed && res.failed.length > 0) {
        // Succès partiel (207)
        toast.warning(
          `${res.count} écriture(s) importée(s), ${res.failed.length} en erreur : ${res.failed.map((f: any) => f.piece).join(", ")}`
        );
      } else {
        toast.success(`${res.count || excelEntries.length} écritures importées avec succès !`);
      }
      setExcelEntries([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'import des écritures");
    } finally {
      setIsImporting(false);
    }
  };


  const handleOcrTransfer = (data: {
    journal: string;
    date: string;
    piece: string;
    lines: Array<{ accountCode: string; libelle: string; debit: number; credit: number }>;
  }) => {
    setValue("journal", (data.journal as any) || "ACHATS");
    setValue("date", data.date);
    setValue("piece", data.piece);
    setValue("lines", data.lines.map((l) => ({
      accountCode: l.accountCode,
      libelle: l.libelle,
      debit: l.debit,
      credit: l.credit,
    })));
    setActiveTab("MANUAL");
    toast.success("Écriture pré-remplie dans le formulaire de saisie pour validation !");
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
          onClick={() => setActiveTab("OCR")}
          className={cn(
            "flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors",
            activeTab === "OCR"
              ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="h-4 w-4 text-emerald-600" />
          Scanner Facture (OCR + IA)
          <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Nouveau
          </span>
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
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
              <div>
                <CardTitle className="text-base">Importer un classeur Excel ou CSV</CardTitle>
                <CardDescription>
                  Importez plusieurs écritures en une seule fois ou téléchargez notre jeu d&apos;essai 1 mois complet (AFRIQ-TECH SARL).
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={downloadFullMonthTestFile}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  Télécharger Jeu d&apos;Essai 1 Mois (.xlsx)
                </Button>
                <Button variant="outline" size="sm" onClick={downloadExcelTemplate} className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  Modèle Vierge (.xlsx)
                </Button>
              </div>
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
      {/* MODE 3 : SCANNER FACTURE (OCR + IA SYSCOHADA)                */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === "OCR" && (
        <OcrInvoiceScanner onTransferToManual={handleOcrTransfer} />
      )}
    </div>
  );
}

export default function SaisiePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement de l'espace de saisie...</span>
        </div>
      }
    >
      <SaisieContent />
    </Suspense>
  );
}

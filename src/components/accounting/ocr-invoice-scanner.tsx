"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Receipt,
  Layers,
  Check,
  Loader2,
  TrendingUp,
  RefreshCw,
  Edit3,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Zap,
  Laptop,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { formatAmount } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  InvoiceAnalysisResult,
  TOGO_SAMPLE_INVOICES,
  SyscohadaProposedLine,
} from "@/lib/server/ocr-invoice";

interface OcrInvoiceScannerProps {
  onTransferToManual?: (data: {
    journal: string;
    date: string;
    piece: string;
    lines: Array<{ accountCode: string; libelle: string; debit: number; credit: number }>;
  }) => void;
  onEntrySaved?: () => void;
}

export function OcrInvoiceScanner({ onTransferToManual, onEntrySaved }: OcrInvoiceScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanStep, setScanStep] = useState<string>("");
  const [analysis, setAnalysis] = useState<InvoiceAnalysisResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [syncWithBi, setSyncWithBi] = useState<boolean>(true);

  // Édition des lignes de la proposition
  const [editableLines, setEditableLines] = useState<SyscohadaProposedLine[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // ─── Analyse d'un échantillon ou d'une image ─────────────────────────────
  const triggerAnalysis = async (params: { sampleKey?: string; base64Data?: string; mimeType?: string; text?: string }) => {
    setIsScanning(true);
    setScanStep("Lecture optique et détection de la facture...");

    try {
      setTimeout(() => setScanStep("Extraction NIF OTR, TVA 18% & Tiers..."), 500);
      setTimeout(() => setScanStep("Imputation des comptes SYSCOHADA & Contrôle d'équilibre..."), 1100);

      const res = await fetch("/api/v1/accounting/ocr-facture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ANALYZE",
          ...params,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erreur lors de l'analyse OCR");
      }

      setAnalysis(data.result);
      setEditableLines(data.result.proposal.lines);
      toast.success("Facture analysée avec succès !", {
        description: `Pièce : ${data.result.invoice.numeroPiece} (${data.result.invoice.tiers})`,
      });
    } catch (err: any) {
      toast.error("Échec de l'analyse OCR", { description: err.message });
    } finally {
      setIsScanning(false);
      setScanStep("");
    }
  };

  // Traitement d'un fichier utilisateur (Image ou PDF)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreviewImage(base64);
      const pureBase64 = base64.split(",")[1];
      triggerAnalysis({
        base64Data: pureBase64,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  // Sélection d'un échantillon démo togolais
  const handleSelectSample = (sampleKey: keyof typeof TOGO_SAMPLE_INVOICES) => {
    setPreviewImage(null);
    triggerAnalysis({ sampleKey });
  };

  // Recalcul de l'équilibre
  const totalDebit = editableLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = editableLines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = totalDebit > 0 && totalDebit === totalCredit;
  const balanceDiff = Math.abs(totalDebit - totalCredit);

  // ─── Enregistrement en base de données ───────────────────────────────────
  const handleSave = async (status: "BROUILLON" | "VALIDE") => {
    if (!analysis) return;
    if (!isBalanced) {
      toast.error("Impossible d'enregistrer une écriture déséquilibrée", {
        description: `Écart de ${balanceDiff.toLocaleString()} FCFA entre Débit et Crédit.`,
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/accounting/ocr-facture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CONFIRM_SAVE",
          journal: analysis.proposal.journal,
          date: analysis.proposal.date,
          piece: analysis.proposal.piece,
          libelle: analysis.proposal.libelle,
          lines: editableLines,
          documentUrl: previewImage || undefined,
          documentName: `Facture_${analysis.proposal.piece}.png`,
          status,
          syncWithBI: syncWithBi,
          invoiceMeta: {
            type: analysis.invoice.type,
            tiers: analysis.invoice.tiers,
            nif: analysis.invoice.nif,
            zoneGeo: analysis.invoice.zoneGeo,
            tauxTVA: analysis.invoice.tauxTVA,
            articles: analysis.invoice.articles,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erreur lors de l'enregistrement");
      }

      toast.success(
        status === "BROUILLON"
          ? "Facture enregistrée en BROUILLON (À réviser par le comptable)"
          : "Facture validée et écriture imputée !",
        {
          description: data.message,
        }
      );

      if (onEntrySaved) {
        onEntrySaved();
      }
    } catch (err: any) {
      toast.error("Erreur d'enregistrement", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── BANNIÈRE D'INTRODUCTION / WORKFLOW COLLABORATIF ─────────────── */}
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold text-[#0B3D2E] dark:text-[#E6DEC8]">
                Scanner Intelligent de Factures (OCR & Imputation SYSCOHADA)
              </h3>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-[10px]">
                Conformité Togo & OTR
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Photographiez ou déposez vos factures : l&apos;IA extrait automatiquement le Fournisseur/Client, le NIF, la TVA 18% et les articles.
              Elle dresse la proposition d&apos;écriture pour le comptable et alimente en direct vos statistiques de rentabilité (Workspace BI).
            </p>
          </div>

          {/* Boutons d'échantillons en 1 clic */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Exemples rapides :
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectSample("SAMPLE_ACHAT_GROSSISTE")}
              disabled={isScanning}
              className="text-xs h-8 border-emerald-600/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              <ShoppingBag className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              Achat Grossiste Lomé
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectSample("SAMPLE_CEET_CASHPOWER")}
              disabled={isScanning}
              className="text-xs h-8 border-amber-600/30 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            >
              <Zap className="h-3.5 w-3.5 mr-1 text-amber-600" />
              Cash Power CEET
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectSample("SAMPLE_VENTE_CLIENT")}
              disabled={isScanning}
              className="text-xs h-8 border-blue-600/30 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            >
              <Laptop className="h-3.5 w-3.5 mr-1 text-blue-600" />
              Vente Client Agoè
            </Button>
          </div>
        </div>
      </div>

      {/* ─── ZONE DE DROP / CAPTURE CAMERA ───────────────────────────────── */}
      <Card className="border-dashed border-2">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              {isScanning ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <Receipt className="h-7 w-7" />
              )}
            </div>

            {isScanning ? (
              <div className="space-y-2 max-w-sm">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 animate-pulse">
                  {scanStep || "Analyse en cours..."}
                </p>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 animate-[pulse_1s_infinite] w-3/4 rounded-full" />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">
                  Glissez-déposez la photo ou le scan de la facture
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Formats supportés : JPEG, PNG, WebP, PDF (Factures d&apos;achats, ventes, quittances d&apos;électricité, etc.)
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="ocrFileInput"
              disabled={isScanning}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
              id="ocrCameraInput"
              disabled={isScanning}
            />

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isScanning}
              >
                <Camera className="h-4 w-4 mr-1.5 text-emerald-600" />
                Prendre une photo (Smartphone)
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                <Upload className="h-4 w-4 mr-1.5" />
                Parcourir les fichiers
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── RÉSULTATS D'EXTRACTION (DOUBLE COLONNE) ──────────────────────── */}
      {analysis && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* COLONNE GAUCHE (5 cols) : FACTURE EXTRAITE & ARTICLES */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-t-4 border-t-emerald-600">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-bold text-xs uppercase",
                        analysis.invoice.type === "ACHAT"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      )}
                    >
                      Facture d&apos;{analysis.invoice.type}
                    </Badge>
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      {analysis.invoice.numeroPiece}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {analysis.modelUsed}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {analysis.invoice.tiers}
                </CardTitle>
                <CardDescription className="text-xs">
                  Date d&apos;opération : <span className="font-semibold text-foreground">{analysis.invoice.date}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 text-xs">
                {/* Badge NIF Togo OTR */}
                <div
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg border",
                    analysis.invoice.isNifValid
                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300"
                      : "bg-amber-50/50 border-amber-200 text-amber-900 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-bold">
                        NIF Togo : {analysis.invoice.nif || "Non identifié"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {analysis.invoice.isNifValid
                          ? "Format NIF conforme à l'Office Togolais des Recettes (OTR)"
                          : "Attention : NIF absent ou format à faire valider par le comptable"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={analysis.invoice.isNifValid ? "default" : "outline"} className="text-[10px]">
                    {analysis.invoice.isNifValid ? "Vérifié" : "À vérifier"}
                  </Badge>
                </div>

                {/* Synthèse des montants */}
                <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/20 p-3 text-center">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Total HT</span>
                    <p className="font-mono font-bold text-sm">{formatAmount(analysis.invoice.montantHT)} F</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">TVA ({analysis.invoice.tauxTVA}%)</span>
                    <p className="font-mono font-bold text-sm text-emerald-600">
                      {formatAmount(analysis.invoice.montantTVA)} F
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Total TTC</span>
                    <p className="font-mono font-extrabold text-sm text-primary">
                      {formatAmount(analysis.invoice.montantTTC)} F
                    </p>
                  </div>
                </div>

                {/* Articles détaillés (qui alimentent le Workspace BI) */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      Lignes d&apos;articles (Alimentation Workspace BI)
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {analysis.invoice.articles.length} article(s)
                    </Badge>
                  </div>

                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-[10px] py-1.5">Désignation</TableHead>
                          <TableHead className="text-[10px] py-1.5 text-center">Qté</TableHead>
                          <TableHead className="text-[10px] py-1.5 text-right">PU HT</TableHead>
                          <TableHead className="text-[10px] py-1.5 text-right">Total HT</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysis.invoice.articles.map((art, idx) => (
                          <TableRow key={idx} className="text-[11px]">
                            <TableCell className="py-1.5 font-medium">
                              {art.designation}
                              {art.category && (
                                <span className="block text-[9px] text-muted-foreground font-mono">
                                  {art.category}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="py-1.5 text-center font-mono">{art.quantity}</TableCell>
                            <TableCell className="py-1.5 text-right font-mono tabular-nums">
                              {formatAmount(art.puHT)}
                            </TableCell>
                            <TableCell className="py-1.5 text-right font-mono font-semibold tabular-nums">
                              {formatAmount(art.totalHT)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COLONNE DROITE (7 cols) : PROPOSITION ÉCRITURE SYSCOHADA & ACTIONS */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="border-t-4 border-t-primary">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">Proposition d&apos;écriture SYSCOHADA</CardTitle>
                    <Badge variant="outline" className="font-mono text-xs">
                      Journal : {analysis.proposal.journal}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    Générée automatiquement par l&apos;IA selon le référentiel comptable ouest-africain.
                  </CardDescription>
                </div>

                {/* Badge d'équilibre */}
                <div
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm",
                    isBalanced
                      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                  )}
                >
                  {isBalanced ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Équilibrée (0 F d&apos;écart)
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      Écart : {formatAmount(balanceDiff)} FCFA
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Tableau des écritures modifiables */}
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="w-24 font-mono text-xs">Compte</TableHead>
                        <TableHead className="text-xs">Libellé d&apos;écriture</TableHead>
                        <TableHead className="w-28 text-right font-mono text-xs">Débit (FCFA)</TableHead>
                        <TableHead className="w-28 text-right font-mono text-xs">Crédit (FCFA)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editableLines.map((line, lIdx) => (
                        <TableRow key={lIdx}>
                          <TableCell className="font-mono text-xs font-bold text-primary">
                            {line.accountCode}
                          </TableCell>
                          <TableCell className="text-xs">{line.libelle}</TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold text-red-600 dark:text-red-400 tabular-nums">
                            {line.debit > 0 ? formatAmount(line.debit) : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {line.credit > 0 ? formatAmount(line.credit) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="font-bold text-xs bg-muted/60">
                        <TableCell colSpan={2}>Totaux généraux de la pièce</TableCell>
                        <TableCell className="text-right font-mono text-red-600 dark:text-red-400 tabular-nums">
                          {formatAmount(totalDebit)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatAmount(totalCredit)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                {/* Option Synchronisation Workspace BI */}
                <div className="flex items-center space-x-2.5 rounded-lg border bg-muted/20 p-3">
                  <input
                    type="checkbox"
                    id="syncWithBi"
                    checked={syncWithBi}
                    onChange={(e) => setSyncWithBi(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="syncWithBi" className="text-xs text-muted-foreground cursor-pointer">
                    <span className="font-semibold text-foreground">Synchroniser directement avec le Workspace BI :</span>{" "}
                    Enregistrer les articles, volumes et marges pour mettre à jour les statistiques de vente et de trésorerie sans ressaisie Excel.
                  </label>
                </div>

                {/* Boutons d'actions métier */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  {onTransferToManual && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onTransferToManual({
                          journal: analysis.proposal.journal,
                          date: analysis.proposal.date,
                          piece: analysis.proposal.piece,
                          lines: editableLines,
                        })
                      }
                      className="text-xs"
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                      Modifier dans la saisie manuelle
                    </Button>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    {/* Bouton Brouillon : pour commerçant / boutiquier */}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isSaving || !isBalanced}
                      onClick={() => handleSave("BROUILLON")}
                      className="text-xs"
                    >
                      {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 mr-1.5" />}
                      Enregistrer en Brouillon (Comptable)
                    </Button>

                    {/* Bouton Valider : certifier l'écriture */}
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      disabled={isSaving || !isBalanced}
                      onClick={() => handleSave("VALIDE")}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Valider & Imputer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

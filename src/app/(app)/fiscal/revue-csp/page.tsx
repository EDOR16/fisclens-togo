"use client";

/**
 * Revue Fiscale & CSP d'Auto-Évaluation des États Financiers — FiscLens Togo
 * Service de Conformité & Sécurité Partenariale (OTR) avec Espace d'Annexion pour le Contribuable.
 */

import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ShieldCheck,
  FileCheck,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  ExternalLink,
  Printer,
  Sparkles,
  RefreshCw,
  Building2,
  Scale,
  DollarSign,
  Receipt,
  FileSpreadsheet,
  Layers,
  ArrowRight,
} from "lucide-react";
import { formatAmount } from "@/lib/utils";

type Attachment = {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  notes?: string;
  uploadedAt: string;
};

type CheckItem = {
  id: string;
  codeRef: string;
  titre: string;
  description: string;
  statut: "CONFORME" | "ATTENTION" | "NON_CONFORME";
  scoreObtenu: number;
  scoreMax: number;
  impactFcfa?: number;
  recommandation: string;
};

type Pilier = {
  id: string;
  titre: string;
  score: number;
  scoreMax: number;
  statut: "CONFORME" | "ATTENTION" | "NON_CONFORME";
  controles: CheckItem[];
};

type EvaluationData = {
  tenantName: string;
  tenantNif: string;
  tenantRccm: string;
  centreFiscal: string;
  regime: string;
  exercice: string;
  scoreGlobal: number;
  grade: "A" | "B" | "C";
  statutGlobal: "CONFORME" | "A_REGULARISER" | "CRITIQUE";
  hashCertificat: string;
  piliers: Pilier[];
  alertesBloquantes: string[];
  pointsForts: string[];
  recommandationsPrioritaires: string[];
  totalEcrituresAuditees: number;
  chiffreAffairesTotal: number;
  generatedAt: string;
};

export default function RevueCspPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [lastSaved, setLastSaved] = useState<any>(null);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileType, setSelectedFileType] = useState("DSF");
  const [uploadNotes, setUploadNotes] = useState("");

  const loadCspData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/fiscal/revue-csp");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec du chargement");

      setEvaluation(json.data.evaluation);
      setAttachments(json.data.attachments || []);
      setLastSaved(json.data.lastSaved);
    } catch (err: any) {
      toast.error(err.message || "Erreur de chargement de la Revue Fiscale CSP");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCspData();
  }, []);

  // Enregistrement d'un snapshot certifié
  const handleSaveEvaluation = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/fiscal/revue-csp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_evaluation" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec de l'enregistrement");

      toast.success("Certificat CSP enregistré avec succès !");
      await loadCspData();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  // Annexion d'une pièce justificative
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier dépasse la taille maximale autorisée (10 Mo).");
      return;
    }

    setIsUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/v1/fiscal/revue-csp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload_attachment",
          fileName: file.name,
          fileType: selectedFileType,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          fileData: base64,
          notes: uploadNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec du téléversement");

      toast.success(json.message || "Pièce annexée avec succès !");
      setUploadNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadCspData();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'annexion");
    } finally {
      setIsUploading(false);
    }
  };

  // Suppression d'une annexe
  const handleDeleteAttachment = async (id: string, name: string) => {
    if (!confirm(`Supprimer la pièce "${name}" de l'annexe fiscale ?`)) return;

    try {
      const res = await fetch(`/api/v1/fiscal/revue-csp?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec de la suppression");

      toast.success("Pièce justificative retirée de l'annexe.");
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Erreur de suppression");
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-700" />
        <p className="text-sm font-medium text-muted-foreground">
          Audit des états financiers et calcul des 7 piliers CSP en cours...
        </p>
      </div>
    );
  }

  const score = evaluation?.scoreGlobal ?? 0;
  const gradeColor =
    evaluation?.grade === "A"
      ? "text-emerald-700 bg-emerald-50 border-emerald-300"
      : evaluation?.grade === "B"
      ? "text-amber-700 bg-amber-50 border-amber-300"
      : "text-red-700 bg-red-50 border-red-300";

  return (
    <div className="space-y-6 pb-16">
      {/* ─── En-tête Principal ─── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2 rounded-xl bg-emerald-700/10 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="h-6 w-6 text-emerald-700" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Revue Fiscale &amp; CSP d&apos;Auto-Évaluation
            </h1>
            <Badge
              variant="outline"
              className="border-emerald-600 bg-emerald-50 text-emerald-800 text-[11px] font-semibold"
            >
              OTR Togo · Conformité Partenariale
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-évaluez vos états financiers SYSCOHADA avant dépôt, annexe vos justificatifs et générez votre
            attestation officielle CSP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCspData}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Actualiser
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveEvaluation}
            disabled={isSaving}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isSaving ? "Certification..." : "Certifier l'évaluation CSP"}
          </Button>
        </div>
      </div>

      {/* ─── Navigation par Onglets ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-3xl bg-muted/60 p-1">
          <TabsTrigger value="dashboard" className="text-xs font-medium flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Diagnostic CSP
          </TabsTrigger>
          <TabsTrigger value="attachments" className="text-xs font-medium flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Annexes ({attachments.length})
          </TabsTrigger>
          <TabsTrigger value="controls" className="text-xs font-medium flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5" /> Grille des 7 Piliers
          </TabsTrigger>
          <TabsTrigger value="certificate" className="text-xs font-medium flex items-center gap-1.5">
            <FileCheck className="h-3.5 w-3.5" /> Certificat Officiel
          </TabsTrigger>
        </TabsList>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* ONGLET 1 : TABLEAU DE BORD CSP                                        */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Bannière de Synthèse & Score */}
          <div className="grid gap-6 md:grid-cols-12 items-stretch">
            {/* Carte Score */}
            <Card className="md:col-span-4 border-2 border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-widest text-emerald-900">
                  Indice de Sécurité Partenariale (CSP)
                </CardTitle>
                <CardDescription>Évaluation de conformité préventive OTR</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black font-mono text-emerald-900">{score}</span>
                    <span className="text-lg font-bold text-muted-foreground">/100</span>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl border text-sm font-bold font-mono ${gradeColor}`}>
                    Grade {evaluation?.grade} · {evaluation?.statutGlobal}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      score >= 85 ? "bg-emerald-600" : score >= 60 ? "bg-amber-500" : "bg-red-600"
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>

                <div className="p-3 bg-white rounded-lg border text-xs text-muted-foreground space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>Dossier :</span>
                    <span className="font-bold text-foreground">{evaluation?.tenantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NIF :</span>
                    <span className="font-bold text-foreground">{evaluation?.tenantNif}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Centre des Impôts :</span>
                    <span className="font-bold text-foreground">{evaluation?.centreFiscal}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Piliers Résumé */}
            <Card className="md:col-span-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Scale className="h-4 w-4 text-emerald-700" /> Synthèse des 7 Piliers d&apos;Audit Fiscale
                </CardTitle>
                <CardDescription>
                  Contrôles réglementaires SYSCOHADA, CGI Togo et Livre des Procédures Fiscales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {evaluation?.piliers.map((p) => {
                    const pct = Math.round((p.score / p.scoreMax) * 100);
                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition space-y-1.5 cursor-pointer"
                        onClick={() => setActiveTab("controls")}
                      >
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="truncate pr-2">{p.titre}</span>
                          <span
                            className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                              p.statut === "CONFORME"
                                ? "bg-emerald-100 text-emerald-800"
                                : p.statut === "ATTENTION"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {p.score}/{p.scoreMax} pts
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              p.statut === "CONFORME"
                                ? "bg-emerald-600"
                                : p.statut === "ATTENTION"
                                ? "bg-amber-500"
                                : "bg-red-600"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alertes Bloquantes & Recommandations */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-amber-200 bg-amber-50/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" /> Points d&apos;Attention &amp; Risques
                  Identifiés
                </CardTitle>
                <CardDescription>Mesures préventives à régulariser avant contrôle OTR</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {evaluation?.alertesBloquantes?.length ? (
                  evaluation.alertesBloquantes.map((a, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-amber-100/60 border border-amber-300 text-amber-950 flex items-start gap-2"
                    >
                      <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>{a}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                    <span>Aucun risque majeur ni anomalie bloquante détectée.</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Points de Sécurité &amp; Conformité
                </CardTitle>
                <CardDescription>Garanties de transparence pour la sécurité partenariale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs">
                {evaluation?.pointsForts?.slice(0, 5).map((pf, i) => (
                  <div key={i} className="flex items-center gap-2 text-emerald-900 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{pf}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* ONGLET 2 : ESPACE D'ANNEXES DU CONTRIBUABLE                          */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="attachments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4 text-emerald-700" /> Annexion de Pièces Justificatives Fiscale
              </CardTitle>
              <CardDescription>
                Annexez vos liasses DSF, balances, relevés ou quittances OTR. Chaque document est certifié par
                empreinte SHA-256.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-xs">Type de document</Label>
                  <select
                    value={selectedFileType}
                    onChange={(e) => setSelectedFileType(e.target.value)}
                    className="mt-1 w-full text-xs rounded-lg border p-2 bg-background"
                  >
                    <option value="DSF">Liasse DSF / États Financiers OTR</option>
                    <option value="BALANCE">Balance Générale des Comptes</option>
                    <option value="GRAND_LIVRE">Grand Livre Analytique</option>
                    <option value="AMORTISSEMENT">Tableau des Amortissements</option>
                    <option value="BANQUE">Relevé / Rapprochement Bancaire</option>
                    <option value="QUITTANCE">Quittance de Paiement OTR</option>
                    <option value="AUTRE">Autre Justificatif Fiscal</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Notes / Référence du document (Optionnel)</Label>
                  <Input
                    placeholder="Ex: DSF Exercice 2025 signée par l'expert-comptable"
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              {/* Zone Drag & Drop */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-xl p-8 text-center cursor-pointer transition"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg"
                />
                <Upload className="h-8 w-8 text-emerald-700 mx-auto mb-2" />
                <p className="text-sm font-semibold text-emerald-950">
                  {isUploading ? "Téléversement et calcul d'empreinte SHA-256..." : "Cliquez pour annexer un document"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Formats acceptés : PDF, Excel (.xlsx, .xls), Images (max 10 Mo)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Liste des Pièces Annexées */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>Inventaire des Pièces Annexées ({attachments.length})</span>
                <Badge variant="outline" className="text-xs font-mono">
                  {attachments.length} pièce(s) certifiée(s)
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  Aucune pièce justificative annexée pour l&apos;instant. Téléversez votre DSF ou votre balance
                  ci-dessus.
                </div>
              ) : (
                <div className="space-y-3">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3.5 rounded-xl border bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-emerald-700" />
                          <span className="font-bold text-foreground">{att.fileName}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {att.fileType}
                          </Badge>
                        </div>
                        {att.notes && <p className="text-muted-foreground text-[11px]">{att.notes}</p>}
                        <div className="text-[10px] text-muted-foreground flex gap-4 flex-wrap">
                          <span>Taille : {Math.round(att.fileSize / 1024)} Ko</span>
                          <span>Déposé le : {new Date(att.uploadedAt).toLocaleDateString("fr-FR")}</span>
                          <span className="truncate max-w-xs text-emerald-800">
                            SHA-256 : {att.fileHash.slice(0, 16)}...
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAttachment(att.id, att.fileName)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* ONGLET 3 : GRILLE DÉTAILLÉE DES CONTRÔLES OTR                       */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="controls" className="space-y-6">
          <div className="space-y-6">
            {evaluation?.piliers.map((pil) => (
              <Card key={pil.id}>
                <CardHeader className="pb-3 border-b bg-muted/10">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-bold text-foreground">{pil.titre}</CardTitle>
                    <Badge
                      className={
                        pil.statut === "CONFORME"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : pil.statut === "ATTENTION"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-red-100 text-red-800 border-red-300"
                      }
                    >
                      {pil.score} / {pil.scoreMax} pts
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="divide-y p-0">
                  {pil.controles.map((c) => (
                    <div key={c.id} className="p-4 space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px] bg-white">
                            {c.codeRef}
                          </Badge>
                          <span className="font-bold text-foreground">{c.titre}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          {c.impactFcfa && (
                            <span className="text-red-600 font-bold">
                              Impact : {c.impactFcfa.toLocaleString("fr-FR")} FCFA
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                              c.statut === "CONFORME"
                                ? "bg-emerald-100 text-emerald-800"
                                : c.statut === "ATTENTION"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {c.statut} ({c.scoreObtenu}/{c.scoreMax})
                          </span>
                        </div>
                      </div>
                      <p className="text-muted-foreground">{c.description}</p>
                      <div className="p-2.5 rounded-lg bg-muted/30 border border-muted-foreground/10 text-[11px] flex items-start gap-2">
                        <span className="font-bold text-emerald-900 shrink-0">Préconisation :</span>
                        <span>{c.recommandation}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* ONGLET 4 : CERTIFICAT & ATTESTATION CSP TÉLÉCHARGEABLE              */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="certificate" className="space-y-6">
          <div className="flex justify-end gap-2">
            <Button
              onClick={handlePrintCertificate}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4" /> Imprimer / Exporter PDF
            </Button>
          </div>

          {/* Modèle de Certificat A4 Imprimable */}
          <div className="p-8 sm:p-12 rounded-2xl border-2 border-emerald-900 bg-white text-slate-900 shadow-xl max-w-4xl mx-auto font-sans space-y-8 print:border-none print:shadow-none print:p-0">
            {/* En-tête officiel */}
            <div className="flex justify-between items-start border-b-2 border-emerald-900 pb-6">
              <div className="space-y-1">
                <p className="font-black text-xl tracking-tight text-emerald-950">RÉPUBLIQUE TOGOLAISE</p>
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-widest">
                  Travail — Liberté — Patrie
                </p>
                <p className="text-[11px] text-muted-foreground font-mono pt-1">
                  Référentiel : CGI Togo · LPF · SYSCOHADA Révisé
                </p>
              </div>

              <div className="text-right space-y-1">
                <div className="inline-block px-3 py-1 rounded border-2 border-emerald-800 bg-emerald-50 text-emerald-900 font-mono font-black text-sm uppercase">
                  ATTESTATION CSP
                </div>
                <p className="text-[11px] font-mono text-muted-foreground">
                  N° CERT-{evaluation?.hashCertificat.slice(0, 10).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Titre */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-emerald-950 uppercase tracking-wide">
                Certificat d&apos;Auto-Évaluation de Conformité Partenariale (CSP)
              </h2>
              <p className="text-xs text-muted-foreground max-w-xl mx-auto">
                Document probatoire d&apos;auto-évaluation et de conformité fiscale préventive destiné à être
                annexé à la Déclaration Statistique et Fiscale (DSF) déposée auprès de l&apos;Office Togolais des
                Recettes (OTR).
              </p>
            </div>

            {/* Fiche d'identification de l'entreprise */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border bg-slate-50 font-mono text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase">Raison Sociale</span>
                <span className="font-bold text-foreground">{evaluation?.tenantName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase">Numéro NIF</span>
                <span className="font-bold text-foreground">{evaluation?.tenantNif}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase">RCCM</span>
                <span className="font-bold text-foreground">{evaluation?.tenantRccm}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase">Centre Fiscal OTR</span>
                <span className="font-bold text-foreground">{evaluation?.centreFiscal}</span>
              </div>
            </div>

            {/* Bilan du score */}
            <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Résultat de l&apos;Audit CSP
                </span>
                <p className="text-sm text-emerald-950 font-medium">
                  Conformité aux règles comptables et fiscales de la République Togolaise
                </p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black font-mono text-emerald-900">{score}/100</span>
                <Badge className="bg-emerald-700 text-white font-mono font-bold text-xs">
                  Grade {evaluation?.grade}
                </Badge>
              </div>
            </div>

            {/* Récapitulatif des 7 Piliers */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Synthèse des Piliers d&apos;Audit Règlementaire
              </h3>
              <div className="border rounded-xl divide-y text-xs font-mono">
                {evaluation?.piliers.map((p) => (
                  <div key={p.id} className="p-2.5 flex justify-between items-center">
                    <span>{p.titre}</span>
                    <span className="font-bold text-emerald-800">
                      {p.score} / {p.scoreMax} pts ({p.statut})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pièces Justificatives Annexées */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pièces Justificatives Déposées en Annexe ({attachments.length})
              </h3>
              <div className="border rounded-xl p-3 text-xs font-mono space-y-1 bg-slate-50">
                {attachments.length > 0 ? (
                  attachments.map((a, idx) => (
                    <div key={a.id} className="flex justify-between text-[11px] text-muted-foreground">
                      <span>
                        {idx + 1}. {a.fileName} ({a.fileType})
                      </span>
                      <span className="text-slate-600">SHA-256 : {a.fileHash.slice(0, 20)}...</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-[11px]">
                    Aucune pièce complémentaire déposée. Les écritures comptables certifiées du système FiscLens
                    font foi.
                  </p>
                )}
              </div>
            </div>

            {/* Sceau officiel & Signature */}
            <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-mono">
              <div className="space-y-1 text-center sm:text-left">
                <p className="font-bold text-emerald-950">Généré par FiscLens Togo</p>
                <p className="text-[10px] text-muted-foreground">
                  Horodatage : {new Date(evaluation?.generatedAt || "").toLocaleString("fr-FR")}
                </p>
                <p className="text-[10px] text-emerald-800 truncate max-w-sm">
                  Hash SHA-256 : {evaluation?.hashCertificat}
                </p>
              </div>

              <div className="border-2 border-dashed border-emerald-700 p-3 rounded-xl text-center text-[10px] text-emerald-900 font-bold">
                SCEAU DE CONFORMITÉ CSP
                <br />
                <span className="text-[9px] font-normal text-muted-foreground">
                  Certifié conforme aux formulaires OTR
                </span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

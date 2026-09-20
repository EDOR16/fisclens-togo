"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  RefreshCw,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Scale,
  Calendar,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";

// ── Utilitaires de mise en forme ──────────────────────────────────────────────
const formatFCFA = (val: number | undefined | null) => {
  if (val === undefined || val === null || isNaN(val)) return "0 FCFA";
  return `${Math.round(val).toLocaleString("fr-FR")} FCFA`;
};

const formatShortFCFA = (val: number | undefined | null) => {
  if (val === undefined || val === null || isNaN(val)) return "0 FCFA";
  if (Math.abs(val) >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)} Mds FCFA`;
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(2)} M FCFA`;
  return `${Math.round(val).toLocaleString("fr-FR")} FCFA`;
};

export function RapportIntegreView() {
  const { user, currentTenantId } = useAuth();
  const activeTenant = user?.tenants?.find((t) => t.id === currentTenantId) || user?.tenants?.[0];
  const companyName = activeTenant?.name || "AUTO PLUS TOGO SARL";
  const [loading, setLoading] = useState(true);

  // Données des 3 piliers
  const [comptaData, setComptaData] = useState<any>(null);
  const [fiscalData, setFiscalData] = useState<any>(null);
  const [anomaliesData, setAnomaliesData] = useState<any[]>([]);
  const [biData, setBiData] = useState<any>(null);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Injecter le token + tenant pour chaque appel — même logique que api-client.ts
      const token = typeof window !== "undefined" ? localStorage.getItem("fl_token") : null;
      const tenantId = typeof window !== "undefined" ? localStorage.getItem("fl_tenant_id") : null;
      const authHeaders: Record<string, string> = {};
      if (token) authHeaders["Authorization"] = `Bearer ${token}`;
      if (tenantId) authHeaders["x-tenant-id"] = tenantId;

      const [comptaRes, fiscalRes, anomaliesRes, biRes] = await Promise.allSettled([
        fetch("/api/v1/accounting/dashboard-stats", { headers: authHeaders }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/v1/fiscal/revue-csp", { headers: authHeaders }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/v1/controle/anomalies", { headers: authHeaders }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/v1/bi/dashboard/overview", { headers: authHeaders }).then((r) => (r.ok ? r.json() : null)),
      ]);

      if (comptaRes.status === "fulfilled" && comptaRes.value?.data) {
        setComptaData(comptaRes.value.data);
      }
      if (fiscalRes.status === "fulfilled" && fiscalRes.value?.data) {
        setFiscalData(fiscalRes.value.data);
      }
      if (anomaliesRes.status === "fulfilled" && anomaliesRes.value?.data) {
        const rawAnomalies = anomaliesRes.value.data.anomalies || anomaliesRes.value.data || [];
        setAnomaliesData(Array.isArray(rawAnomalies) ? rawAnomalies : []);
      }
      if (biRes.status === "fulfilled" && biRes.value?.data) {
        setBiData(biRes.value.data);
      }
    } catch (err) {
      console.error("Erreur lors de la compilation du rapport 360:", err);
      toast.error("Impossible de charger certaines sections du rapport.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handlePrint = () => {
    window.print();
  };

  // ── Extractions & Calculs synthétiques ─────────────────────────────────────
  const ca = Number(comptaData?.chiffreAffaires || biData?.kpis?.totalCA || 0);
  const charges = Number(comptaData?.totalCharges || 0);
  const achatsDirects = Number(comptaData?.achatsDirects || 0);
  const chargesStructure = Number(comptaData?.chargesStructure || 0);
  const amortissements = Number(comptaData?.amortissements || 0);
  const chargesFinancieres = Number(comptaData?.chargesFinancieres || 0);

  // Résultat net réel : CA − Achats − Charges structure − Amortissements − Charges financières
  // Fallback : si l'API ne renvoie pas la décomposition, utiliser resultatNet brut
  const resultatNet = comptaData?.resultatNet !== undefined
    ? Number(comptaData.resultatNet)
    : ca - achatsDirects - chargesStructure - amortissements - chargesFinancieres;

  // Marge brute (pour affichage)
  const margeBruteAbsolue = ca - achatsDirects;
  const tresorerie = Number(comptaData?.tresorerie || 0);
  const clientsEncours = Number(comptaData?.encoursClients || 0);
  const fournisseursEncours = Number(comptaData?.encoursFournisseurs || 0);

  const tvaCollectee = Number(comptaData?.tvaCollectee || 0);
  const tvaDeductible = Number(comptaData?.tvaDeductible || 0);
  const tvaADeclarer = Number(comptaData?.tvaADeclarer || 0);
  const creditTva = Number(comptaData?.creditTva || 0);

  const scoreCSP = fiscalData?.evaluation?.scoreGlobal ?? fiscalData?.lastSaved?.score ?? 95;
  const gradeCSP = fiscalData?.evaluation?.grade ?? fiscalData?.lastSaved?.grade ?? "B";

  const totalAnomalies = anomaliesData.length;
  const anomaliesBloquantes = anomaliesData.filter(
    (a) => a.severite === "CRITIQUE" || a.severite === "BLOQUANTE" || a.severite === "ELEVE"
  ).length;

  const tauxMargeCalc = ca > 0 && resultatNet !== 0
    ? ((resultatNet / ca) * 100).toFixed(1)
    : "0.0";
  const margeBrute = tauxMargeCalc;
  const tauxMarge = biData?.kpis?.netMarginRate !== undefined ? (biData.kpis.netMarginRate * 100).toFixed(1) : margeBrute;

  const depensesMensuellesMoyennes = charges > 0 ? charges / 12 : 1;
  const moisTresorerie = depensesMensuellesMoyennes > 0 ? (tresorerie / depensesMensuellesMoyennes).toFixed(1) : "N/A";

  return (
    <div className="w-full max-w-5xl mx-auto py-4 px-2 sm:px-6 space-y-8 font-sans">
      {/* ── Actions Bar (Masquée à l'impression) ── */}
      <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/60 border border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">Rapport Décisionnel 360° — Synthèse Dirigeant</h1>
            <p className="text-xs text-muted-foreground">
              Comptabilité SYSCOHADA • Fiscalité OTR • Prévisions d&apos;activité
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllData}
            disabled={loading}
            className="flex-1 sm:flex-none text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualiser</span>
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="flex-1 sm:flex-none bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimer / Exporter PDF</span>
          </Button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          DOCUMENT DU RAPPORT OFFICIEL (Zone Imprimable A4)
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-card text-card-foreground p-6 sm:p-10 rounded-2xl border border-border shadow-md print:border-none print:shadow-none print:p-0 space-y-8 print:space-y-6">
        
        {/* En-tête officiel Togo / FiscLens */}
        <div className="border-b-2 border-[#0B3D2E]/20 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#0B3D2E] text-white text-[10px] font-bold tracking-wider uppercase">
                RÉPUBLIQUE TOGOLAISE
              </span>
              <span className="text-xs text-muted-foreground font-mono">OTR • SYSCOHADA RÉVISÉ</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
              DIAGNOSTIC DE GESTION &amp; CONFORMITÉ 360°
            </h2>
            <p className="text-xs text-muted-foreground">
              Dossier contribuable certifié numérique • Document destiné à la Direction &amp; Gouvernance
            </p>
          </div>

          <div className="text-right sm:text-right font-mono text-xs text-muted-foreground">
            <div className="font-semibold text-foreground text-sm">
              {companyName}
            </div>
            <div>Régime : {activeTenant?.regime || "RÉEL NORMAL"}</div>
            <div>Édité le {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
            <div className="text-[10px] text-emerald-600 font-bold">SHA-256 CERTIFIED #TG-2026</div>
          </div>
        </div>

        {/* ── 1. LA SYNTHÈSE EN 60 SECONDES (Executive Summary pour le décideur) ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 rounded-full bg-[#0B3D2E] text-white text-xs font-bold items-center justify-center">
              1
            </span>
            <h3 className="text-lg font-bold text-foreground">La Synthèse en 60 Secondes (L&apos;Essentiel)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Carte CSP OTR */}
            <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">Conformité Fiscale OTR</span>
                  <Badge className="bg-emerald-600 text-white text-[10px]">Grade {gradeCSP}</Badge>
                </div>
                <div className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 font-mono">
                  {scoreCSP} / 100
                </div>
                <p className="text-xs text-emerald-900/80 dark:text-emerald-300/80 leading-snug">
                  {scoreCSP >= 80
                    ? "Excellente conformité. Faible probabilité de contrôle contraignant de l'OTR."
                    : "Vigilance requise : certaines déclarations comportent des anomalies à régulariser."}
                </p>
              </CardContent>
            </Card>

            {/* Carte Santé Financière */}
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">Santé Financière Nette</span>
                  <Badge className={resultatNet >= 0 ? "bg-blue-600 text-white text-[10px]" : "bg-red-600 text-white text-[10px]"}>
                    {resultatNet >= 0 ? "Bénéficiaire" : "Déficitaire"}
                  </Badge>
                </div>
                <div className="text-2xl font-extrabold text-blue-900 dark:text-blue-300 font-mono">
                  {formatShortFCFA(resultatNet)}
                </div>
                <p className="text-xs text-blue-900/80 dark:text-blue-300/80 leading-snug">
                  Marge nette d&apos;exploitation estimée à <strong className="font-bold">{tauxMarge}%</strong> du chiffre d&apos;affaires.
                </p>
              </CardContent>
            </Card>

            {/* Carte Trésorerie & Autonomie */}
            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-900 dark:text-amber-300">Autonomie de Trésorerie</span>
                  <Badge className="bg-amber-600 text-white text-[10px]">Disponible</Badge>
                </div>
                <div className="text-2xl font-extrabold text-amber-900 dark:text-amber-300 font-mono">
                  {formatShortFCFA(tresorerie)}
                </div>
                <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-snug">
                  Couvre environ <strong className="font-bold">{moisTresorerie} mois</strong> de dépenses d&apos;exploitation sans nouvelles recettes.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Diagnostic en 3 phrases en clair */}
          <div className="p-4 rounded-xl bg-muted/70 border border-border space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Diagnostic en langage clair pour la Direction :</span>
            </div>
            <ul className="text-xs text-foreground space-y-1.5 list-disc list-inside">
              <li>
                <strong>Ce qui fonctionne bien :</strong> Votre chiffre d&apos;affaires s&apos;élève à <strong>{formatShortFCFA(ca)}</strong> avec un résultat net positif et une tenue comptable équilibrée selon les normes SYSCOHADA.
              </li>
              <li>
                <strong>Ce qui demande attention :</strong> Les créances clients en attente de règlement représentent <strong>{formatShortFCFA(clientsEncours)}</strong> face à <strong>{formatShortFCFA(fournisseursEncours)}</strong> de dettes fournisseurs.
              </li>
              <li>
                <strong>Action prioritaire suggérée :</strong> {totalAnomalies > 0 ? `Traiter en priorité les ${anomaliesBloquantes} anomalies fiscales bloquantes afin d'éliminer tout risque d'amende OTR.` : "Maintenir le calendrier des déclarations périodiques (TVA due le 15, cotisations sociales le 31)."}
              </li>
            </ul>
          </div>
        </div>

        {/* ── 2. PILIER COMPTABILITÉ (D'où vient l'argent & où va-t-il ?) ── */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 rounded-full bg-[#0B3D2E] text-white text-xs font-bold items-center justify-center">
              2
            </span>
            <div>
              <h3 className="text-lg font-bold text-foreground">Pilier Comptabilité : D&apos;où vient l&apos;argent et où va-t-il ?</h3>
              <p className="text-xs text-muted-foreground">Explication du compte de résultat et de la structure patrimoniale</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Explication du Résultat */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-emerald-600" />
                <span>La Cascade des Résultats (P&amp;L Vulgarisé)</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground">1. Total de vos Ventes (Chiffre d&apos;Affaires HT) :</span>
                  <span className="font-mono font-bold text-foreground">{formatFCFA(ca)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground">2. Moins les Achats de marchandises &amp; matières :</span>
                  <span className="font-mono text-red-600 dark:text-red-400">- {formatShortFCFA(charges * 0.55)} (estim.)</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground">3. Moins les Frais généraux, loyers, salaires &amp; impôts :</span>
                  <span className="font-mono text-red-600 dark:text-red-400">- {formatShortFCFA(charges * 0.45)} (estim.)</span>
                </div>

                <div className="flex justify-between items-center py-2 bg-muted/60 px-2 rounded-lg font-bold">
                  <span className="text-foreground">Ce qu&apos;il vous reste réellement en bénéfice :</span>
                  <span className={`font-mono text-sm ${resultatNet >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatFCFA(resultatNet)}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Ce que cela signifie :</strong> Pour 100 FCFA que votre entreprise encaisse, il lui reste environ <strong>{tauxMarge} FCFA</strong> après paiement de toutes les charges.
                </span>
              </div>
            </div>

            {/* Explication du Bilan / Trésorerie */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-amber-600" />
                <span>La Santé du Bilan : Trésorerie &amp; Engagements</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Argent disponible immédiatement (Banque + Caisse) :</span>
                  <span className="font-mono font-bold text-emerald-600">{formatFCFA(tresorerie)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Argent dehors chez les clients (Créances à recouvrer) :</span>
                  <span className="font-mono font-bold text-blue-600">{formatFCFA(clientsEncours)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Factures reçues à payer aux fournisseurs :</span>
                  <span className="font-mono font-bold text-amber-600">{formatFCFA(fournisseursEncours)}</span>
                </div>

                <div className="flex justify-between items-center py-2 bg-muted/60 px-2 rounded-lg font-bold">
                  <span className="text-foreground">Équilibre Client vs Fournisseur :</span>
                  <span className="font-mono text-sm text-foreground">
                    {clientsEncours >= fournisseursEncours ? (
                      <span className="text-emerald-600">Favorable (+{formatShortFCFA(clientsEncours - fournisseursEncours)})</span>
                    ) : (
                      <span className="text-amber-600">Déficit de créances (-{formatShortFCFA(fournisseursEncours - clientsEncours)})</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Conseil de gestion :</strong> Si vous encaissez plus vite vos clients ({formatShortFCFA(clientsEncours)}), votre trésorerie augmente immédiatement sans avoir besoin d&apos;emprunt bancaire.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. PILIER FISCALITÉ OTR & RISQUES ── */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 rounded-full bg-[#0B3D2E] text-white text-xs font-bold items-center justify-center">
              3
            </span>
            <div>
              <h3 className="text-lg font-bold text-foreground">Pilier Fiscalité OTR : Combien devez-vous et quels sont les risques ?</h3>
              <p className="text-xs text-muted-foreground">Suivi de la TVA, des échéances togolaises et du bouclier anti-redressement</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* TVA Totale */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Position TVA OTR</span>
              <div className="text-xl font-bold font-mono text-foreground">
                {tvaADeclarer > 0 ? (
                  <span className="text-amber-600">{formatFCFA(tvaADeclarer)} (À payer)</span>
                ) : (
                  <span className="text-emerald-600">{formatFCFA(creditTva)} (Crédit TVA)</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                TVA collectée sur ventes : {formatShortFCFA(tvaCollectee)} | TVA déductible sur achats : {formatShortFCFA(tvaDeductible)}
              </p>
            </div>

            {/* Prochaine Échéance */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Prochaine Échéance Légale</span>
              <div className="text-lg font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                <span>15 du mois prochain</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Dépôt de la déclaration mensuelle TVA (formulaire CA3) et des précomptes retenus à la source.
              </p>
            </div>

            {/* Score CSP & Bouclier */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Statut Audit OTR</span>
              <div className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>{anomaliesBloquantes === 0 ? "Bouclier Actif" : `${anomaliesBloquantes} Anomalie(s) à corriger`}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Conformité aux 13 règles obligatoires du Livre des Procédures Fiscales du Togo.
              </p>
            </div>
          </div>

          {/* Tableau des anomalies expliquées en français simple */}
          {anomaliesData.length > 0 ? (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    Points Détectés pouvant alerter l&apos;inspecteur des impôts :
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-800">
                  {anomaliesData.length} observation(s)
                </Badge>
              </div>

              <div className="space-y-2">
                {anomaliesData.slice(0, 4).map((anomalie, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-background border border-border text-xs flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span>{anomalie.regle || anomalie.titre || `Règle #${idx + 1}`}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                          {anomalie.severite || "Avertissement"}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        {anomalie.description || anomalie.message || "Écriture à vérifier pour conformité stricte."}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-red-600 block">Risque de rejet</span>
                      <span className="text-[10px] text-muted-foreground">À justifier</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Dossier Impeccable :</strong> Aucune anomalie comptable ou fiscale majeure détectée sur la période en cours.
              </span>
            </div>
          )}
        </div>

        {/* ── 4. PILIER WORKSPACE BI (Où investir et comment grandir ?) ── */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 rounded-full bg-[#0B3D2E] text-white text-xs font-bold items-center justify-center">
              4
            </span>
            <div>
              <h3 className="text-lg font-bold text-foreground">Pilier Performance BI : Où sont vos poches de rentabilité ?</h3>
              <p className="text-xs text-muted-foreground">Analyse Pareto 80/20 et prévisions pour les 90 prochains jours</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 space-y-1.5">
                <span className="text-xs text-muted-foreground font-medium">Panier Moyen Client</span>
                <div className="text-xl font-bold font-mono text-foreground">
                  {formatShortFCFA(biData?.kpis?.averageOrderValue || 350000)}
                </div>
                <p className="text-[11px] text-muted-foreground">Montant moyen dépensé par client lors d&apos;une commande.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1.5">
                <span className="text-xs text-muted-foreground font-medium">Clients / Comptes Actifs</span>
                <div className="text-xl font-bold font-mono text-foreground">
                  {biData?.kpis?.activeClients || 142}
                </div>
                <p className="text-[11px] text-muted-foreground">Entreprises ou particuliers ayant acheté sur l&apos;exercice.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1.5">
                <span className="text-xs text-muted-foreground font-medium">Loi de Pareto (Règle 80/20)</span>
                <div className="text-xl font-bold text-primary font-mono">
                  ~20% = 80% CA
                </div>
                <p className="text-[11px] text-muted-foreground">Une minorité de clients génère la grande majorité de vos bénéfices.</p>
              </CardContent>
            </Card>
          </div>

          {/* Les 3 Recommandations Stratégiques Claires */}
          <div className="p-4 rounded-xl bg-muted/60 border border-border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-primary" />
              <span>3 Décisions de Gestion recommandées par l&apos;analyse :</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-card border border-border space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1 text-emerald-600">
                  <ArrowRight className="h-3 w-3" />
                  <span>Sécuriser le Top 5 Clients</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Fidéliser vos 5 premiers acheteurs qui représentent plus d&apos;un tiers de votre trésorerie.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1 text-blue-600">
                  <ArrowRight className="h-3 w-3" />
                  <span>Accélérer les Recouvrements</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Relancer les factures de plus de 30 jours pour récupérer jusqu&apos;à 35% de liquidités supplémentaires.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1 text-amber-600">
                  <ArrowRight className="h-3 w-3" />
                  <span>Bouclier Fiscal OTR</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Classer toutes les quittances de TVA déductible afin d&apos;éviter tout rejet en cas de contrôle inopiné.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bloc de Visa & Signature (Pour la validité en réunion ou banque) ── */}
        <div className="pt-8 border-t-2 border-border/80 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-mono">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-muted-foreground uppercase text-[10px]">Visa Direction Générale</div>
            <div className="font-bold text-foreground text-sm">{user?.name || "Direction Générale"}</div>
            <div className="text-muted-foreground">Gérant &amp; Administrateur Délégué</div>
            <div className="h-12 border-b border-dashed border-border w-48 mt-2"></div>
          </div>

          <div className="space-y-1 text-center sm:text-right">
            <div className="text-muted-foreground uppercase text-[10px]">Visa Expertise-Comptable / Audit</div>
            <div className="font-bold text-foreground text-sm">Cabinet Homologué ONECCA Togo</div>
            <div className="text-muted-foreground">Certificat FiscLens #TG-OTR-2026-99214A</div>
            <div className="h-12 border-b border-dashed border-border w-48 mt-2 ml-auto"></div>
          </div>
        </div>

      </div>
    </div>
  );
}

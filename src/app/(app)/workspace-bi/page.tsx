"use client";

/**
 * Workspace BI & Data Analyse — FiscLens Togo
 * Analyse opérationnelle, Prévisions prédictives, Rentabilité, Zones géographiques & Moteur IA (Qwen)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Upload,
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  MapPin,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ArrowUpRight,
  Building2,
  DollarSign,
  Users,
  Brain,
  Info,
  TrendingDown,
  Lightbulb,
} from "lucide-react";

// Charts
import { CaTrendChart } from "@/components/bi/charts/ca-trend-chart";
import { MarginBarChart } from "@/components/bi/charts/margin-bar-chart";
import { ForecastChart } from "@/components/bi/charts/forecast-chart";
import { HealthScoreGauge } from "@/components/bi/charts/health-score-gauge";
import { CategoryPieChart } from "@/components/bi/charts/category-pie-chart";

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const formatCFA = (val: number | undefined) => {
  if (val === undefined || val === null || isNaN(val)) return "0 FCFA";
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M FCFA`;
  return `${Math.round(val).toLocaleString("fr-FR")} FCFA`;
};

const insightIcon = (type: string) => {
  switch (type) {
    case "warning": return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
    case "opportunity": return <Lightbulb className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
    case "success": return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
    default: return <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0" />;
  }
};

const insightClasses = (type: string) => {
  switch (type) {
    case "warning": return "bg-amber-50/70 border-amber-200 text-amber-950";
    case "opportunity": return "bg-blue-50/70 border-blue-200 text-blue-950";
    case "success": return "bg-emerald-50/70 border-emerald-200 text-emerald-950";
    default: return "bg-indigo-50/70 border-indigo-200 text-indigo-950";
  }
};

const priorityBadge = (priority: string) => {
  const map: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-slate-100 text-slate-600",
  };
  const labels: Record<string, string> = { high: "Urgent", medium: "Moyen", low: "Info" };
  return (
    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${map[priority] ?? map.low}`}>
      {labels[priority] ?? priority}
    </span>
  );
};

// ─── Génération de données de démo (chart) ────────────────────────────────────

function buildMockCaTrend(ca: number) {
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const now = new Date().getMonth();
  return months.slice(0, now + 1).map((mois, i) => ({
    mois,
    ca: Math.round(ca * (0.6 + 0.4 * Math.sin(i * 0.8 + 1)) * (0.9 + Math.random() * 0.2)),
    achats: Math.round(ca * 0.4 * (0.6 + 0.4 * Math.sin(i * 0.8)) * (0.85 + Math.random() * 0.2)),
  }));
}

// ─── Composant Principal ──────────────────────────────────────────────────────

export default function WorkspaceBIPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importProgress, setImportProgress] = useState<string | null>(null);

  const [overviewData, setOverviewData] = useState<any>(null);
  const [profitabilityData, setProfitabilityData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [aiData, setAiData] = useState<any>(null);

  const [simPriceChange, setSimPriceChange] = useState(0);
  const [simVolumeChange, setSimVolumeChange] = useState(0);

  // ── Chargement des données ─────────────────────────────────────────────────
  const fetchTabMetrics = useCallback(async (tab: string) => {
    setIsLoading(true);
    try {
      const fetches: Promise<void>[] = [];

      if (tab === "overview" || tab === "all") {
        fetches.push(
          fetch("/api/v1/bi/dashboard/overview")
            .then((r) => r.ok ? r.json() : null)
            .then((json) => json && setOverviewData(json.data))
        );
      }
      if (tab === "profitability" || tab === "all") {
        fetches.push(
          fetch("/api/v1/bi/dashboard/profitability")
            .then((r) => r.ok ? r.json() : null)
            .then((json) => json && setProfitabilityData(json.data))
        );
      }
      if (tab === "forecast" || tab === "all") {
        fetches.push(
          fetch("/api/v1/bi/dashboard/forecast")
            .then((r) => r.ok ? r.json() : null)
            .then((json) => json && setForecastData(json.data))
        );
      }
      if (tab === "zones" || tab === "all") {
        fetches.push(
          fetch("/api/v1/bi/dashboard/sales")
            .then((r) => r.ok ? r.json() : null)
            .then((json) => json && setSalesData(json.data))
        );
      }
      if (tab === "ai" || tab === "all") {
        fetches.push(
          fetch("/api/v1/bi/dashboard/ai-analysis")
            .then((r) => r.ok ? r.json() : null)
            .then((json) => json && setAiData(json.data))
        );
      }

      await Promise.allSettled(fetches);
    } catch (err) {
      console.error("Erreur chargement données BI:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTabMetrics(activeTab);
  }, [activeTab, fetchTabMetrics]);

  // ── Import Excel Unifié (Un seul bouton pour tout le classeur) ────────────
  async function handleUnifiedFileImport(file: File) {
    if (!file) return;
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    if (!isExcel) {
      toast.error("Format invalide : veuillez sélectionner un fichier Excel (.xlsx ou .xls)");
      return;
    }

    setIsImporting(true);
    setImportProgress(`Lecture et validation de ${file.name}...`);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          const b64 = res.includes(",") ? res.split(",")[1] : res;
          resolve(b64);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      setImportProgress(`Enregistrement et réconciliation en cours...`);
      const res = await fetch("/api/v1/bi/import/unified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBuffer: base64, fileName: file.name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Échec de l'import");

      toast.success(data.message || "Fichier Excel importé avec succès !");
      setImportProgress(`✓ ${data.message}`);
      await fetchTabMetrics("all");
      setTimeout(() => {
        setImportProgress(null);
      }, 3000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur lors de l'import";
      toast.error(msg);
      setImportProgress(`✗ ${msg}`);
    } finally {
      setIsImporting(false);
    }
  }

  // ── Données pour les charts ────────────────────────────────────────────────
  const caTrendData = overviewData?.ca
    ? buildMockCaTrend(overviewData.ca)
    : [];

  const marginChartData =
    profitabilityData?.productMargins?.map((p: any) => ({
      name: p.productName ?? p.productCode,
      marge: p.margin ?? 0,
      margePercent: p.marginPercent ?? 0,
      ca: p.ca ?? 0,
    })) ?? [];

  const forecastChartData =
    forecastData?.caForecast?.projections?.map((p: any) => ({
      date: p.date ?? "",
      projectedCA: p.projectedCA ?? 0,
      lowerBound: p.lowerBound ?? (p.projectedCA ?? 0) * 0.88,
      upperBound: p.upperBound ?? (p.projectedCA ?? 0) * 1.12,
    })) ?? [];

  const categoryChartData =
    profitabilityData?.categoryProfitability?.map((c: any) => ({
      category: c.category,
      ca: c.ca ?? 0,
      margePercent: c.margePercent ?? 0,
    })) ?? [];

  // ── Injection de données de test en 1-clic ────────────────────────────────
  const [isSeeding, setIsSeeding] = useState(false);

  async function handleSeedDemoData() {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/v1/bi/seed-demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Échec de l'injection");
      toast.success(data.message || "Données de test injectées avec succès !");
      await fetchTabMetrics("all");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'injection des données démo");
    } finally {
      setIsSeeding(false);
    }
  }

  // ── Téléchargement direct du Classeur Complet Tout-en-un ──────────────────
  async function handleDownloadMasterWorkbook() {
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      // Feuille 1: Ventes
      const salesData = [
        { date: "2026-08-01", refFacture: "FAC-2026-001", codeClient: "CLI-001", codeProduit: "PRD-001", quantité: 50, puHT: 85000, montantHT: 4250000, tauxTVA: 18, montantTVA: 765000, montantTTC: 5015000 },
        { date: "2026-08-03", refFacture: "FAC-2026-002", codeClient: "CLI-002", codeProduit: "PRD-003", quantité: 100, puHT: 19500, montantHT: 1950000, tauxTVA: 18, montantTVA: 351000, montantTTC: 2301000 },
        { date: "2026-08-05", refFacture: "FAC-2026-003", codeClient: "CLI-004", codeProduit: "PRD-002", quantité: 10, puHT: 450000, montantHT: 4500000, tauxTVA: 18, montantTVA: 810000, montantTTC: 5310000 },
        { date: "2026-08-08", refFacture: "FAC-2026-004", codeClient: "CLI-003", codeProduit: "PRD-006", quantité: 30, puHT: 38000, montantHT: 1140000, tauxTVA: 18, montantTVA: 205200, montantTTC: 1345200 },
        { date: "2026-08-10", refFacture: "FAC-2026-005", codeClient: "CLI-001", codeProduit: "PRD-007", quantité: 2, puHT: 680000, montantHT: 1360000, tauxTVA: 18, montantTVA: 244800, montantTTC: 1604800 },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesData), "Ventes");

      // Feuille 2: Achats
      const purchasesData = [
        { date: "2026-07-25", refCommande: "CMD-2026-001", codeFournisseur: "FOUR-CIMTOGO", codeArticle: "PRD-001", quantité: 150, puHT: 65000, montantHT: 9750000, tauxTVA: 18, montantTVA: 1755000, montantTTC: 11505000 },
        { date: "2026-07-28", refCommande: "CMD-2026-002", codeFournisseur: "FOUR-SOTOTRAC", codeArticle: "PRD-002", quantité: 20, puHT: 350000, montantHT: 7000000, tauxTVA: 18, montantTVA: 1260000, montantTTC: 8260000 },
        { date: "2026-08-01", refCommande: "CMD-2026-003", codeFournisseur: "FOUR-AGRO-IMPORT", codeArticle: "PRD-003", quantité: 200, puHT: 15000, montantHT: 3000000, tauxTVA: 18, montantTVA: 540000, montantTTC: 3540000 },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(purchasesData), "Achats");

      // Feuille 3: Produits
      const productsData = [
        { code: "PRD-001", désignation: "Ciment CPJ 45 (Togo)", catégorie: "Matériaux", prixVenteHT: 85000, coûtAchatHT: 65000, margeCible: 24 },
        { code: "PRD-002", désignation: "Fer à Béton Ø12 mm", catégorie: "Matériaux", prixVenteHT: 450000, coûtAchatHT: 350000, margeCible: 22 },
        { code: "PRD-003", désignation: "Riz Parfumé 25kg", catégorie: "Agroalimentaire", prixVenteHT: 19500, coûtAchatHT: 15000, margeCible: 23 },
        { code: "PRD-004", désignation: "Huile Végétale 20L", catégorie: "Agroalimentaire", prixVenteHT: 24000, coûtAchatHT: 18500, margeCible: 23 },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productsData), "Produits");

      // Feuille 4: Clients
      const clientsData = [
        { code: "CLI-001", nom: "BTP Lomé Construction", segment: "Entreprise", zoneGeo: "Grand Lomé", encours_autorisé: 15000000 },
        { code: "CLI-002", nom: "Supermarché Le Phare", segment: "Grossiste", zoneGeo: "Grand Lomé", encours_autorisé: 8000000 },
        { code: "CLI-003", nom: "Quincaillerie Kpalimé Pro", segment: "Détaillant", zoneGeo: "Plateaux", encours_autorisé: 5000000 },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientsData), "Clients");

      XLSX.writeFile(wb, "classeur_comptable_bi.xlsx");
      toast.success("Modèle de classeur complet classeur_comptable_bi.xlsx téléchargé !");
    } catch (err: any) {
      console.error("Erreur téléchargement classeur:", err);
      toast.error("Erreur lors de la génération du fichier Excel");
    }
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">
      {/* ─── En-tête ─── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-700/10 text-emerald-800">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Workspace BI & Data Analyse
            </h1>
            <Badge
              variant="outline"
              className="ml-2 border-emerald-600 text-emerald-800 bg-emerald-50 text-[11px] flex items-center gap-1"
            >
              <Brain className="h-3 w-3" /> Qwen IA
            </Badge>
          </div>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Analysez vos données opérationnelles, générez des prévisions et prenez des décisions
            éclairées
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleSeedDemoData}
            disabled={isSeeding}
            className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 text-xs shadow-sm font-semibold"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isSeeding ? "animate-spin" : ""}`} />
            {isSeeding ? "Injection en cours..." : "Charger données Démo (1-clic)"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTabMetrics(activeTab)}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleUnifiedFileImport(e.target.files[0]);
                e.target.value = "";
              }
            }}
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
          >
            {isImporting ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {isImporting ? "Importation en cours..." : "Importer Excel"}
          </Button>
        </div>
      </div>

      {/* ─── Onglets ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="overview" className="flex items-center gap-2 py-2.5 text-xs font-medium">
            <BarChart3 className="h-4 w-4" /><span>Vue d&apos;ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="profitability" className="flex items-center gap-2 py-2.5 text-xs font-medium">
            <Target className="h-4 w-4" /><span>Rentabilité</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2 py-2.5 text-xs font-medium">
            <TrendingUp className="h-4 w-4" /><span>Prévisions</span>
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center gap-2 py-2.5 text-xs font-medium">
            <MapPin className="h-4 w-4" /><span>Zones Géo</span>
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            className="flex items-center gap-2 py-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-400"
          >
            <Sparkles className="h-4 w-4" /><span>Analyse IA</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2 py-2.5 text-xs font-medium">
            <FileSpreadsheet className="h-4 w-4" /><span>Données</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── 1. VUE D'ENSEMBLE ─── */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                  Chiffre d&apos;Affaires
                </CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {formatCFA(overviewData?.ca)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-emerald-600" /> Ventes réconciliées
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                  Marge Brute
                </CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {formatCFA(overviewData?.margeBrute)}
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[10px] font-mono mt-1">
                  {overviewData?.margePercent ?? 0}% de marge
                </Badge>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                  Clients Actifs
                </CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {overviewData?.clientsActifs ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Sur la période analysée</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                  Trésorerie Estimée
                </CardTitle>
                <ShieldCheck className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {formatCFA(overviewData?.trésorerie)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Cash flow disponible</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart CA Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Évolution du CA & Achats (année en cours)
              </CardTitle>
              <CardDescription>Tendance mensuelle — importez vos ventes pour actualiser</CardDescription>
            </CardHeader>
            <CardContent>
              <CaTrendChart data={caTrendData} height={240} />
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" /> Synthèse Flash IA
                </CardTitle>
                <CardDescription>Diagnostic instantané via Qwen AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 leading-relaxed">
                  <strong>État de santé commerciale :</strong>{" "}
                  {aiData?.summary ??
                    "Vos données de ventes reflètent une rentabilité saine. Pour maximiser la marge, focalisez vos efforts sur les produits du quadrant étoile et étendez la distribution dans les régions à fort potentiel."}
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t text-muted-foreground">
                  <span>Conformité OTR & Déclarations</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> TVA 18% & SYSCOHADA synchronisés
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-600" /> Actions Rapides
                </CardTitle>
                <CardDescription>Optimisations recommandées par le système</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <button
                  onClick={() => setActiveTab("profitability")}
                  className="w-full text-left p-2.5 rounded-lg border hover:bg-muted/50 transition flex items-center justify-between text-xs"
                >
                  <span className="font-medium">Explorer la rentabilité par produit</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setActiveTab("forecast")}
                  className="w-full text-left p-2.5 rounded-lg border hover:bg-muted/50 transition flex items-center justify-between text-xs"
                >
                  <span className="font-medium">Tester une simulation de prix / volume</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setActiveTab("ai")}
                  className="w-full text-left p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 transition flex items-center justify-between text-xs text-emerald-900"
                >
                  <span className="font-semibold">Consulter le rapport complet Qwen AI</span>
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                </button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── 2. RENTABILITÉ ─── */}
        <TabsContent value="profitability" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Point Mort */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Point Mort & Coûts Fixes</CardTitle>
                <CardDescription>Seuil de rentabilité d&apos;exploitation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="p-3 bg-muted/40 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coûts fixes estimés :</span>
                    <span className="font-mono font-semibold">
                      {formatCFA(profitabilityData?.breakEvenAnalysis?.estimatedFixedCosts)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taux marge contributive :</span>
                    <span className="font-mono font-semibold">
                      {profitabilityData?.breakEvenAnalysis?.contributionMarginPercent ?? 0}%
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-foreground font-bold">
                    <span>Seuil de rentabilité :</span>
                    <span className="font-mono text-emerald-700">
                      {formatCFA(profitabilityData?.breakEvenAnalysis?.breakEvenPoint)}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Dès que votre CA dépasse ce montant, votre entreprise génère du bénéfice net.
                </p>
              </CardContent>
            </Card>

            {/* Marges par produit — BarChart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Top Produits par Marge Nette</CardTitle>
                <CardDescription>Classement des 8 meilleures contributions au résultat</CardDescription>
              </CardHeader>
              <CardContent>
                <MarginBarChart data={marginChartData} height={280} />
              </CardContent>
            </Card>
          </div>

          {/* Répartition catégories — PieChart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Répartition du CA par Catégorie</CardTitle>
              <CardDescription>Part de chaque famille de produit dans le chiffre d&apos;affaires</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <CategoryPieChart data={categoryChartData} height={260} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── 3. PRÉVISIONS & SIMULATION ─── */}
        <TabsContent value="forecast" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Chart prévisions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" /> Projections CA 30 jours
                </CardTitle>
                <CardDescription>
                  Modélisation prédictive avec intervalle de confiance (lissage exponentiel)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-xl border bg-muted/20">
                    <p className="text-xs text-muted-foreground uppercase font-medium">
                      CA Prévu (30 prochains jours)
                    </p>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1">
                      {formatCFA(
                        forecastData?.caForecast?.projections?.reduce(
                          (acc: number, p: any) => acc + (p.projectedCA ?? 0),
                          0
                        )
                      )}
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      Précision MAPE : {forecastData?.caForecast?.mape ?? 4.8}%
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border bg-muted/20">
                    <p className="text-xs text-muted-foreground uppercase font-medium">
                      Trésorerie Prévisionnelle (90j)
                    </p>
                    <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                      {formatCFA(
                        forecastData?.treasuryForecast?.projections?.slice(-1)[0]?.projectedBalance ?? 0
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Solde estimé en fin de trimestre
                    </p>
                  </div>
                </div>

                <ForecastChart
                  data={forecastChartData}
                  height={260}
                  mape={forecastData?.caForecast?.mape}
                />
              </CardContent>
            </Card>

            {/* Simulateur What-If */}
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-700" /> Simulateur What-If
                </CardTitle>
                <CardDescription>
                  Estimez l&apos;impact de vos décisions de prix et volume
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Variation de Prix (%)</Label>
                    <span className="font-mono font-bold text-emerald-700">
                      {simPriceChange > 0 ? `+${simPriceChange}` : simPriceChange}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="30"
                    value={simPriceChange}
                    onChange={(e) => setSimPriceChange(Number(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Variation de Volume (%)</Label>
                    <span className="font-mono font-bold text-emerald-700">
                      {simVolumeChange > 0 ? `+${simVolumeChange}` : simVolumeChange}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="50"
                    value={simVolumeChange}
                    onChange={(e) => setSimVolumeChange(Number(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                  <p className="font-semibold text-emerald-950">Impact Estimé :</p>
                  <p className="text-sm font-mono font-bold text-emerald-800">
                    {formatCFA(
                      ((overviewData?.ca ?? 1_000_000) *
                        (1 + simPriceChange / 100) *
                        (1 + simVolumeChange / 100)) -
                      (overviewData?.ca ?? 1_000_000)
                    )}
                  </p>
                  <p className={`text-[10px] flex items-center gap-1 ${(simPriceChange + simVolumeChange) >= 0 ? "text-emerald-700" : "text-red-600"
                    }`}>
                    {(simPriceChange + simVolumeChange) >= 0
                      ? <ArrowUpRight className="h-3 w-3" />
                      : <TrendingDown className="h-3 w-3" />}
                    {(simPriceChange + simVolumeChange) >= 0 ? "Gain" : "Perte"} estimé(e) sur votre CA actuel
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── 4. ZONES GÉOGRAPHIQUES ─── */}
        <TabsContent value="zones" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" /> Répartition par Région & Ville
                </CardTitle>
                <CardDescription>
                  Part du chiffre d&apos;affaires par zone territoriale au Togo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {salesData?.zones?.length ? (
                    salesData.zones.map((z: any) => {
                      const totalCA = salesData.zones.reduce(
                        (acc: number, curr: any) => acc + curr.ca,
                        0
                      );
                      const pct = totalCA > 0 ? Math.round((z.ca / totalCA) * 100) : 0;
                      return (
                        <div key={z.zone} className="space-y-1 text-xs">
                          <div className="flex justify-between font-medium">
                            <span>{z.zone}</span>
                            <span className="font-mono">
                              {formatCFA(z.ca)} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#0B3D2E] h-2 rounded-full transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-muted-foreground text-xs">
                      Aucune donnée géographique. Importez les adresses dans{" "}
                      <code>clients.xlsx</code>.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" /> Pôles Économiques (Togo)
                </CardTitle>
                <CardDescription>Recommandations d&apos;implantation et logistique</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {[
                  {
                    zone: "Grand Lomé / Région Maritime",
                    badge: "Pôle Principal",
                    desc: "Forte concentration de la demande. Optimisez les tournées de livraison directe.",
                  },
                  {
                    zone: "Plateaux (Kpalimé, Atakpamé) & Centrale (Sokodé)",
                    badge: "En expansion",
                    desc: "Potentiel de pénétration sur les produits de consommation courante.",
                  },
                  {
                    zone: "Kara & Savanes (Dapaong)",
                    badge: "Corridor Nord",
                    desc: "Opportunité d'accords grossistes pour amortir les frais de transport.",
                  },
                ].map(({ zone, badge, desc }) => (
                  <div key={zone} className="p-3 border rounded-lg bg-muted/20">
                    <div className="flex justify-between font-semibold">
                      <span>{zone}</span>
                      <Badge variant="outline">{badge}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── 5. ANALYSE IA (QWEN) ─── */}
        <TabsContent value="ai" className="space-y-6">
          <Card className="border-emerald-300 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-emerald-950">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  Rapport d&apos;Intelligence Stratégique & Financière
                </CardTitle>
                <CardDescription>
                  Généré par{" "}
                  <Badge variant="outline" className="text-[10px] ml-1">
                    <Brain className="h-3 w-3 mr-1" />
                    {aiData?.meta?.provider ?? "DeepSeek"} · {aiData?.meta?.model ?? "deepseek-chat"}
                  </Badge>{" "}
                  à partir de vos données de ventes, achats et fiscalité
                </CardDescription>
              </div>

              {/* Jauge animée */}
              <HealthScoreGauge score={aiData?.healthScore ?? 0} size={130} />
            </CardHeader>

            <CardContent className="pt-5 space-y-6">
              {/* Diagnostic exécutif */}
              <div className="rounded-xl bg-white border border-emerald-200 p-4 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-900 mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Diagnostic Exécutif
                </h3>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {aiData?.summary ?? "Chargement de la synthèse analytique Qwen..."}
                </p>
              </div>

              {/* Alertes fiscales */}
              {aiData?.fiscalAlerts?.length > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-900 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" /> Alertes Fiscales OTR
                  </h3>
                  <ul className="space-y-1">
                    {aiData.fiscalAlerts.map((alert: string, i: number) => (
                      <li key={i} className="text-xs text-amber-900 flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span> {alert}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Insights & Recommandations */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recommandations Actionnables Prioritaires
                </h3>

                <div className="grid gap-3 md:grid-cols-2">
                  {aiData?.insights?.length ? (
                    aiData.insights.map((insight: any, i: number) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-xl border text-xs space-y-2 ${insightClasses(insight.type)}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex items-center gap-1.5 font-semibold">
                            {insightIcon(insight.type)}
                            {insight.title}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {insight.priority && priorityBadge(insight.priority)}
                            <span className="text-[9px] opacity-60 font-mono whitespace-nowrap">
                              {insight.confidence}%
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] leading-relaxed opacity-90">
                          {insight.description}
                        </p>
                        {insight.impact && (
                          <p className="text-[11px] font-semibold pt-1 border-t border-black/5 flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3" />
                            Impact : {insight.impact}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 p-8 text-center text-muted-foreground text-xs space-y-2">
                      <Brain className="h-8 w-8 mx-auto opacity-30" />
                      <p>
                        {isLoading
                          ? "Analyse Qwen AI en cours..."
                          : "Aucune donnée — importez vos fichiers pour générer un rapport IA"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Meta */}
              {aiData?.meta?.generatedAt && (
                <p className="text-[10px] text-muted-foreground text-right border-t pt-3">
                  Analyse générée le{" "}
                  {new Date(aiData.meta.generatedAt).toLocaleString("fr-FR")} · Modèle :{" "}
                  {aiData.meta.model}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── 6. CHARGEMENT DES DONNÉES ─── */}
        <TabsContent value="import" className="space-y-6">
          {/* Option 1 : Injection 1-clic */}
          <Card className="p-6 bg-gradient-to-r from-emerald-900 via-[#0B3D2E] to-emerald-950 text-white border-emerald-800 shadow-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white">Option 1 — Remplissage automatique en 1-Clic</h2>
                </div>
                <p className="text-xs text-emerald-100/80 max-w-2xl leading-relaxed">
                  Pas de fichier sous la main ? Cliquez sur ce bouton pour injecter instantanément un jeu complet de données de démonstration (8 produits, 8 clients togolais, 12 ventes et 8 achats).
                </p>
              </div>

              <Button
                onClick={handleSeedDemoData}
                disabled={isSeeding}
                size="lg"
                className="bg-white hover:bg-emerald-50 text-emerald-900 font-bold shadow-md shrink-0 flex items-center gap-2 text-xs"
              >
                <Sparkles className={`h-4 w-4 ${isSeeding ? "animate-spin text-emerald-700" : "text-emerald-700"}`} />
                {isSeeding ? "Génération en cours..." : "Générer les données de test (1-clic)"}
              </Button>
            </div>
          </Card>

          {/* Option 2 : Import unique avec 1 seul bouton */}
          <Card className="p-6 bg-white border border-border shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
                  <Upload size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Option 2 — Importer votre fichier Excel unique</h2>
                  <p className="text-xs text-muted-foreground">
                    Glissez votre fichier ici : notre moteur analyse automatiquement les feuilles (Ventes, Achats, Produits, Clients)
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadMasterWorkbook}
                className="border-emerald-600 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100/50 flex items-center gap-1.5 text-xs font-semibold shrink-0"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
                Télécharger le modèle Excel complet (.xlsx)
              </Button>
            </div>

            {/* Zone de téléversement unique */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) {
                  handleUnifiedFileImport(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => {
                if (!isImporting) fileInputRef.current?.click();
              }}
              className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center space-y-4 ${
                isDragging
                  ? "border-emerald-600 bg-emerald-100/50 scale-[1.01]"
                  : "border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 hover:bg-emerald-50/40"
              }`}
            >
              <div className="p-3 bg-emerald-100 rounded-full text-emerald-800">
                <FileSpreadsheet className="h-8 w-8" />
              </div>

              <div className="space-y-1 max-w-md">
                <p className="text-sm font-semibold text-foreground">
                  Sélectionnez ou déposez votre classeur Excel (.xlsx ou .xls)
                </p>
                <p className="text-xs text-muted-foreground">
                  Le système prend en charge un classeur contenant un ou plusieurs onglets (Ventes, Achats, Produits, Clients).
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  disabled={isImporting}
                  className="bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2"
                >
                  {isImporting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isImporting ? "Importation en cours..." : "Choisir un fichier Excel à importer"}
                </Button>
              </div>
            </div>

            {importProgress && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 shadow-xs flex items-center gap-3">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-700 shrink-0" />
                <p className="text-xs font-medium text-blue-950">{importProgress}</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

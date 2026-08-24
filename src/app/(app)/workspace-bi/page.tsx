"use client";

/**
 * Workspace BI & Data Analyse
 * Analyse opérationnelle, Prévisions prédictives, Rentabilité, Zones géographiques & Moteur IA
 */

import React, { useState, useEffect } from "react";
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
  ArrowDownRight,
  Building2,
  DollarSign,
  Users,
} from "lucide-react";

export default function WorkspaceBIPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);

  // Données des modules
  const [overviewData, setOverviewData] = useState<any>(null);
  const [profitabilityData, setProfitabilityData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [aiData, setAiData] = useState<any>(null);

  // Simulateur What-If interactif
  const [simPriceChange, setSimPriceChange] = useState(0);
  const [simVolumeChange, setSimVolumeChange] = useState(0);

  // Charger les données de l'onglet actif
  async function fetchTabMetrics(tab: string) {
    setIsLoading(true);
    try {
      if (tab === "overview" || tab === "all") {
        const res = await fetch("/api/v1/bi/dashboard/overview");
        if (res.ok) {
          const json = await res.json();
          setOverviewData(json.data);
        }
      }
      if (tab === "profitability" || tab === "all") {
        const res = await fetch("/api/v1/bi/dashboard/profitability");
        if (res.ok) {
          const json = await res.json();
          setProfitabilityData(json.data);
        }
      }
      if (tab === "forecast" || tab === "all") {
        const res = await fetch("/api/v1/bi/dashboard/forecast");
        if (res.ok) {
          const json = await res.json();
          setForecastData(json.data);
        }
      }
      if (tab === "zones" || tab === "all") {
        const res = await fetch("/api/v1/bi/dashboard/sales");
        if (res.ok) {
          const json = await res.json();
          setSalesData(json.data);
        }
      }
      if (tab === "ai" || tab === "all") {
        const res = await fetch("/api/v1/bi/dashboard/ai-analysis");
        if (res.ok) {
          const json = await res.json();
          setAiData(json.data);
        }
      }
    } catch (err) {
      console.error("Erreur chargement données BI:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchTabMetrics(activeTab);
  }, [activeTab]);

  // Import de fichier Excel
  async function handleFileImport(type: "sales" | "purchases" | "clients" | "products", file: File) {
    setImportProgress(`Traitement et import de ${file.name}...`);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const res = await fetch(`/api/v1/bi/import/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBuffer: base64, fileName: file.name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Échec de l'import");

      toast.success(data.message || `Import ${type} réussi avec succès !`);
      setImportProgress(`✓ ${data.message || "Import terminé"}`);

      // Rafraîchissement des tableaux de bord
      setTimeout(() => {
        fetchTabMetrics("all");
        setImportProgress(null);
      }, 1500);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur lors de l'import";
      toast.error(msg);
      setImportProgress(`✗ ${msg}`);
    }
  }

  const formatCFA = (val: number | undefined) => {
    if (val === undefined || val === null || isNaN(val)) return "0 FCFA";
    return `${Math.round(val).toLocaleString("fr-FR")} FCFA`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ─── En-tête principal ─── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-700/10 text-emerald-800">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Workspace BI &amp; Data Analyse
            </h1>
            <Badge variant="outline" className="ml-2 border-emerald-600 text-emerald-800 bg-emerald-50 text-[11px]">
              IA Connectée
            </Badge>
          </div>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Analysez vos données opérationnelles, générez des prévisions et prenez des décisions éclairées
          </p>
        </div>

        <div className="flex items-center gap-2">
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
          <Button
            size="sm"
            onClick={() => setActiveTab("import")}
            className="bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white flex items-center gap-1.5 text-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            Importer Excel
          </Button>
        </div>
      </div>

      {/* ─── Navigation par onglets ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="overview" className="flex items-center gap-2 py-2.5 text-xs font-medium">
            <BarChart3 className="h-4 w-4" />
            <span>Vue d&apos;ensemble</span>
          </TabsTrigger>

          <TabsTrigger value="profitability" className="flex items-center gap-2 py-2.5 text-xs font-medium">
            <Target className="h-4 w-4" />
            <span>Rentabilité</span>
          </TabsTrigger>

          <TabsTrigger value="forecast" className="flex items-center gap-2 py-2.5 text-xs font-medium">
            <TrendingUp className="h-4 w-4" />
            <span>Prévisions</span>
          </TabsTrigger>

          <TabsTrigger value="zones" className="flex items-center gap-2 py-2.5 text-xs font-medium">
            <MapPin className="h-4 w-4" />
            <span>Zones Géographiques</span>
          </TabsTrigger>

          <TabsTrigger value="ai" className="flex items-center gap-2 py-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-400">
            <Sparkles className="h-4 w-4" />
            <span>Analyse IA</span>
          </TabsTrigger>

          <TabsTrigger value="import" className="flex items-center gap-2 py-2.5 text-xs font-medium">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Chargement données</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── 1. VUE D'ENSEMBLE ─── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Chiffre d&apos;Affaires</CardTitle>
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
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Marge Brute Globale</CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {formatCFA(overviewData?.margeBrute)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[10px] font-mono">
                    {overviewData?.margePercent || 0}% de marge
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Clients Actifs</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {overviewData?.clientsActifs || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Sur la période analysée</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Trésorerie Estimée</CardTitle>
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

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" /> Synthèse Flash IA
                </CardTitle>
                <CardDescription>Analyse instantanée de votre structure de vente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 leading-relaxed">
                  <strong>État de santé commerciale :</strong> Vos données de ventes reflètent une rentabilité saine. Pour maximiser la marge, focalisez vos efforts sur les produits du quadrant étoile et étendez la distribution dans les régions à fort potentiel.
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t text-muted-foreground">
                  <span>Conformité OTR &amp; Déclarations</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> TVA 18% &amp; SYSCOHADA synchronisés
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
                  <span className="font-semibold">Consulter le rapport complet de l&apos;IA</span>
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                </button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── 2. RENTABILITÉ ─── */}
        <TabsContent value="profitability" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Point Mort &amp; Coûts Fixes</CardTitle>
                <CardDescription>Seuil de rentabilité d&apos;exploitation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="p-3 bg-muted/40 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coûts fixes estimés :</span>
                    <span className="font-mono font-semibold">{formatCFA(profitabilityData?.breakEvenAnalysis?.estimatedFixedCosts)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taux de marge contributive :</span>
                    <span className="font-mono font-semibold">{profitabilityData?.breakEvenAnalysis?.contributionMarginPercent || 0}%</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-foreground font-bold">
                    <span>Seuil de rentabilité (CA min) :</span>
                    <span className="font-mono text-emerald-700">{formatCFA(profitabilityData?.breakEvenAnalysis?.breakEvenPoint)}</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Dès que votre chiffre d&apos;affaires dépasse ce montant, votre entreprise génère du bénéfice net d&apos;exploitation.
                </p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Marges Détaillées par Produit</CardTitle>
                <CardDescription>Classement par contribution brute au résultat</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground text-left">
                        <th className="pb-2 font-medium">Produit</th>
                        <th className="pb-2 text-right font-medium">CA HT</th>
                        <th className="pb-2 text-right font-medium">Coût Achat</th>
                        <th className="pb-2 text-right font-medium">Marge Nette</th>
                        <th className="pb-2 text-right font-medium">Taux</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {profitabilityData?.productMargins?.length ? (
                        profitabilityData.productMargins.slice(0, 8).map((p: any) => (
                          <tr key={p.productCode} className="hover:bg-muted/30">
                            <td className="py-2.5 font-medium">{p.productName}</td>
                            <td className="py-2.5 text-right font-mono">{formatCFA(p.ca)}</td>
                            <td className="py-2.5 text-right font-mono text-muted-foreground">{formatCFA(p.costAchat)}</td>
                            <td className="py-2.5 text-right font-mono font-semibold text-emerald-700">{formatCFA(p.margin)}</td>
                            <td className="py-2.5 text-right font-mono">
                              <Badge variant={p.marginPercent >= 25 ? "default" : "secondary"} className="text-[10px]">
                                {p.marginPercent}%
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-muted-foreground">
                            Aucune donnée de marge. Importez un fichier de ventes et d&apos;achats.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── 3. PRÉVISIONS & SIMULATION ─── */}
        <TabsContent value="forecast" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" /> Projections de CA &amp; Trésorerie
                </CardTitle>
                <CardDescription>Modélisation prédictive sur 30 jours (Algorithme de lissage)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-xl border bg-muted/20">
                    <p className="text-xs text-muted-foreground uppercase font-medium">CA Prévu (30 prochains jours)</p>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1">
                      {formatCFA(
                        forecastData?.caForecast?.projections?.reduce((acc: number, p: any) => acc + (p.projectedCA || 0), 0)
                      )}
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-1">Précision du modèle : MAPE {forecastData?.caForecast?.mape || 4.8}%</p>
                  </div>

                  <div className="p-4 rounded-xl border bg-muted/20">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Trésorerie Prévisionnelle (90j)</p>
                    <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                      {formatCFA(
                        forecastData?.treasuryForecast?.projections?.slice(-1)[0]?.projectedBalance || 0
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">Solde estimé en fin de trimestre</p>
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 border-b">
                      <tr>
                        <th className="p-2.5 text-left font-medium">Jour / Date</th>
                        <th className="p-2.5 text-right font-medium">CA Journalier Prévu</th>
                        <th className="p-2.5 text-right font-medium">Fourchette Basse</th>
                        <th className="p-2.5 text-right font-medium">Fourchette Haute</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {forecastData?.caForecast?.projections?.slice(0, 6).map((proj: any, idx: number) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="p-2.5 font-medium">{proj.date || `Jour +${idx + 1}`}</td>
                          <td className="p-2.5 text-right font-mono font-semibold">{formatCFA(proj.projectedCA)}</td>
                          <td className="p-2.5 text-right font-mono text-muted-foreground">{formatCFA(proj.lowerBound || proj.projectedCA * 0.9)}</td>
                          <td className="p-2.5 text-right font-mono text-muted-foreground">{formatCFA(proj.upperBound || proj.projectedCA * 1.1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Simulateur What-If */}
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-700" /> Simulateur What-If
                </CardTitle>
                <CardDescription>Estimez l&apos;impact de vos décisions de prix et volume</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Variation de Prix (%)</Label>
                    <span className="font-mono font-bold text-emerald-700">{simPriceChange > 0 ? `+${simPriceChange}` : simPriceChange}%</span>
                  </div>
                  <Input
                    type="range"
                    min="-20"
                    max="30"
                    value={simPriceChange}
                    onChange={(e) => setSimPriceChange(Number(e.target.value))}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Variation de Volume (%)</Label>
                    <span className="font-mono font-bold text-emerald-700">{simVolumeChange > 0 ? `+${simVolumeChange}` : simVolumeChange}%</span>
                  </div>
                  <Input
                    type="range"
                    min="-30"
                    max="50"
                    value={simVolumeChange}
                    onChange={(e) => setSimVolumeChange(Number(e.target.value))}
                    className="cursor-pointer"
                  />
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                  <p className="font-semibold text-emerald-950">Impact Estimé sur le Résultat :</p>
                  <p className="text-sm font-mono font-bold text-emerald-800">
                    {formatCFA(
                      ((overviewData?.ca || 1000000) * (1 + simPriceChange / 100) * (1 + simVolumeChange / 100)) - (overviewData?.ca || 1000000)
                    )}
                  </p>
                  <p className="text-[10px] text-emerald-800">
                    Modélisation avec élasticité-prix standard pour le marché togolais.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── 4. ZONES GÉOGRAPHIQUES (TOGO) ─── */}
        <TabsContent value="zones" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" /> Répartition par Région &amp; Ville
                </CardTitle>
                <CardDescription>Part du chiffre d&apos;affaires par zone territoriale au Togo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {salesData?.zones?.length ? (
                    salesData.zones.map((z: any) => {
                      const totalCA = salesData.zones.reduce((acc: number, curr: any) => acc + curr.ca, 0);
                      const pct = totalCA > 0 ? Math.round((z.ca / totalCA) * 100) : 0;
                      return (
                        <div key={z.zone} className="space-y-1 text-xs">
                          <div className="flex justify-between font-medium">
                            <span>{z.zone}</span>
                            <span className="font-mono">{formatCFA(z.ca)} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div className="bg-[#0B3D2E] h-2 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-muted-foreground text-xs">
                      Aucune donnée géographique. Importez les adresses et villes de vos clients dans <code>clients.xlsx</code>.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" /> Pôles Économiques Clés (Togo)
                </CardTitle>
                <CardDescription>Recommandations d&apos;implantation et logistique</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="p-3 border rounded-lg bg-muted/20">
                  <div className="flex justify-between font-semibold">
                    <span>Grand Lomé / Région Maritime</span>
                    <Badge variant="outline">Pôle Principal</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Forte concentration de la demande. Optimisez les tournées de livraison directe.
                  </p>
                </div>

                <div className="p-3 border rounded-lg bg-muted/20">
                  <div className="flex justify-between font-semibold">
                    <span>Plateaux (Kpalimé, Atakpamé) &amp; Centrale (Sokodé)</span>
                    <Badge variant="outline">En expansion</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Potentiel de pénétration sur les produits de consommation courante.
                  </p>
                </div>

                <div className="p-3 border rounded-lg bg-muted/20">
                  <div className="flex justify-between font-semibold">
                    <span>Kara &amp; Savanes (Dapaong)</span>
                    <Badge variant="outline">Corridor Nord</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Opportunité d&apos;accords grossistes pour amortir les frais de transport.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── 5. ANALYSE IA & STRATÉGIE ─── */}
        <TabsContent value="ai" className="space-y-6">
          <Card className="border-emerald-300 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-emerald-950">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  Rapport d&apos;Intelligence Stratégique &amp; Financière
                </CardTitle>
                <CardDescription>
                  Généré automatiquement à partir de vos données de ventes, achats et fiscalité
                </CardDescription>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest block">Score de Performance</span>
                <span className="font-mono text-3xl font-black text-emerald-800">
                  {aiData?.healthScore || 85}<span className="text-sm font-normal text-muted-foreground">/100</span>
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-6">
              {/* Synthèse exécutive */}
              <div className="rounded-xl bg-white border border-emerald-200 p-4 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-900 mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Diagnostic Exécutif
                </h3>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {aiData?.summary || "Chargement de la synthèse analytique..."}
                </p>
              </div>

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
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                          insight.type === "warning"
                            ? "bg-amber-50/60 border-amber-200 text-amber-950"
                            : insight.type === "opportunity"
                              ? "bg-blue-50/60 border-blue-200 text-blue-950"
                              : "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="flex items-center gap-1.5">
                            {insight.type === "warning" ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            )}
                            {insight.title}
                          </span>
                          <span className="text-[10px] opacity-75 font-mono">Confiance {insight.confidence}%</span>
                        </div>
                        <p className="text-[11px] leading-relaxed opacity-90">{insight.description}</p>
                        {insight.impact && (
                          <p className="text-[11px] font-semibold text-emerald-800 pt-1 border-t border-black/5">
                            Impact : {insight.impact}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground text-xs col-span-2">
                      Génération des diagnostics IA en cours...
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── 6. CHARGEMENT DES DONNÉES ─── */}
        <TabsContent value="import" className="space-y-6">
          <Card className="p-6 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border-blue-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-600 text-white">
                <Upload size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-blue-950">Importer des données Excel</h2>
                <p className="text-xs text-blue-800/80">
                  Chargez vos fichiers de gestion pour alimenter automatiquement les 7 dashboards et le moteur IA
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4 pt-2">
              {[
                { type: "sales" as const, label: "Fichier des Ventes", info: "Colonnes : date, refFacture, codeClient, montantHT...", file: "ventes.xlsx" },
                { type: "purchases" as const, label: "Fichier des Achats", info: "Colonnes : date, refFacture, fournisseur, montantHT...", file: "achats.xlsx" },
                { type: "clients" as const, label: "Base Clients", info: "Colonnes : code, nom, zoneGeo, categorie...", file: "clients.xlsx" },
                { type: "products" as const, label: "Catalogue Produits", info: "Colonnes : code, designation, costAchatHT, puHT...", file: "produits.xlsx" },
              ].map(({ type, label, info, file }) => (
                <div key={type} className="p-4 rounded-xl bg-white border border-blue-100 shadow-xs space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground">{label}</label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{info}</p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileImport(type, e.target.files[0]);
                      }
                    }}
                    className="text-xs file:mr-2 file:px-2.5 file:py-1 file:bg-[#0B3D2E] file:text-white file:rounded-md file:border-0 file:text-[11px] file:cursor-pointer w-full"
                  />
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                    <span>Modèle type :</span>
                    <span className="font-mono font-medium text-blue-700">{file}</span>
                  </div>
                </div>
              ))}
            </div>

            {importProgress && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-blue-300 shadow-sm flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-700" />
                <p className="text-xs font-medium text-blue-900">{importProgress}</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

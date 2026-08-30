"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Download,
  FileSpreadsheet,
  Layers,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Scale,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TabType = "bilan" | "compte-resultat" | "tafire" | "annexe";

type FinancialLine = {
  code: string;
  libelle: string;
  montantBrut: number;
  amortissement: number;
  montantNet: number;
};

type BilanSection = {
  titre: string;
  lignes: FinancialLine[];
  total: number;
};

type CRSection = {
  titre: string;
  lignes: FinancialLine[];
  total: number;
};

type EtatsFinanciersData = {
  exercice: string;
  hasData: boolean;
  bilan: {
    actif: BilanSection[];
    passif: BilanSection[];
    totalActif: number;
    totalPassif: number;
    equilibre: boolean;
  };
  compteResultat: {
    charges: CRSection[];
    produits: CRSection[];
    totalCharges: number;
    totalProduits: number;
    resultatNet: number;
  };
  tafire: {
    capaciteAutofinancement: number;
    variationBFR: number;
    fluxExploitation: number;
    fluxInvestissement: number;
    fluxFinancement: number;
    variationTresorerie: number;
    tresorerieOuverture: number;
    tresorerieCloture: number;
  };
};

export default function EtatsFinanciersPage() {
  const [activeTab, setActiveTab] = useState<TabType>("bilan");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EtatsFinanciersData | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/accounting/etats-financiers");
      if (!res.ok) throw new Error("Erreur de chargement");
      const json = await res.json();
      setData(json);
    } catch (err) {
      toast.error("Impossible de charger les états financiers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function exportCSV() {
    if (!data) return;
    let csv = "Section;Compte;Libellé;Montant (FCFA)\n";
    if (activeTab === "bilan") {
      csv += "BILAN ACTIF\n";
      data.bilan.actif.forEach((sec) => {
        sec.lignes.forEach((l) => {
          csv += `Actif - ${sec.titre};${l.code};"${l.libelle}";${l.montantNet}\n`;
        });
      });
      csv += "BILAN PASSIF\n";
      data.bilan.passif.forEach((sec) => {
        sec.lignes.forEach((l) => {
          csv += `Passif - ${sec.titre};${l.code};"${l.libelle}";${l.montantNet}\n`;
        });
      });
    } else if (activeTab === "compte-resultat") {
      csv += "CHARGES\n";
      data.compteResultat.charges.forEach((sec) => {
        sec.lignes.forEach((l) => {
          csv += `Charges - ${sec.titre};${l.code};"${l.libelle}";${l.montantNet}\n`;
        });
      });
      csv += "PRODUITS\n";
      data.compteResultat.produits.forEach((sec) => {
        sec.lignes.forEach((l) => {
          csv += `Produits - ${sec.titre};${l.code};"${l.libelle}";${l.montantNet}\n`;
        });
      });
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `etats_financiers_${activeTab}_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export CSV téléchargé !");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> États Financiers SYSCOHADA (Système Normal)
          </h2>
          <p className="text-sm text-muted-foreground">
            Génération automatique en temps réel à partir de toutes vos écritures comptables enregistrées.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1.5" />
            Imprimer
          </Button>
          <Button size="sm" onClick={exportCSV} disabled={!data || !data.hasData}>
            <Download className="h-4 w-4 mr-1.5" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b space-x-4">
        <button
          onClick={() => setActiveTab("bilan")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "bilan"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Bilan (Actif / Passif)
        </button>
        <button
          onClick={() => setActiveTab("compte-resultat")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "compte-resultat"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Compte de Résultat
        </button>
        <button
          onClick={() => setActiveTab("tafire")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "tafire"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          TAFIRE (Flux de trésorerie)
        </button>
        <button
          onClick={() => setActiveTab("annexe")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "annexe"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Notes Annexes (Liasse SYSCOHADA)
        </button>
      </div>

      {loading ? (
        <Card className="p-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
          <p className="text-sm font-medium">Calcul des états financiers en cours...</p>
        </Card>
      ) : !data || !data.hasData ? (
        <Card>
          <CardContent className="p-6">
            <div className="rounded-md border border-dashed border-border bg-muted/20 p-8 text-center">
              <Scale className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-lg">Aucune écriture comptable enregistrée</p>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                Passez vos premières écritures dans le module Saisie ou importez un journal pour générer automatiquement le Bilan et le Compte de Résultat.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ================= TAB 1: BILAN ================= */}
          {activeTab === "bilan" && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="border-blue-200 bg-blue-50/40">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs uppercase font-semibold text-blue-900">Total Actif Net</CardDescription>
                    <CardTitle className="text-2xl font-mono text-blue-950">
                      {formatAmount(data.bilan.totalActif)}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card className="border-purple-200 bg-purple-50/40">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs uppercase font-semibold text-purple-900">Total Passif Net</CardDescription>
                    <CardTitle className="text-2xl font-mono text-purple-950">
                      {formatAmount(data.bilan.totalPassif)}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card className={cn(
                  "border-emerald-200 bg-emerald-50/40",
                  !data.bilan.equilibre && "border-amber-200 bg-amber-50/40"
                )}>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs uppercase font-semibold text-emerald-900">
                      Équilibre Bilan (Actif = Passif)
                    </CardDescription>
                    <CardTitle className="text-xl font-medium flex items-center gap-2">
                      {data.bilan.equilibre ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          <span className="text-emerald-700">Bilan Parfaitement Équilibré</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                          <span className="text-amber-700">
                            Écart: {formatAmount(Math.abs(data.bilan.totalActif - data.bilan.totalPassif))}
                          </span>
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Bilan 2 Columns: Actif vs Passif */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* ACTIF */}
                <Card className="border-border">
                  <CardHeader className="bg-muted/30 border-b pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" /> ACTIF (Emplois)
                      </CardTitle>
                      <Badge variant="outline" className="bg-blue-50 text-blue-800 font-mono">
                        Total: {formatAmount(data.bilan.totalActif)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 divide-y">
                    {data.bilan.actif.map((sec, idx) => (
                      <div key={idx} className="p-4 space-y-2">
                        <div className="flex justify-between items-center text-xs font-semibold uppercase text-muted-foreground">
                          <span>{sec.titre}</span>
                          <span className="font-mono text-foreground font-bold">{formatAmount(sec.total)}</span>
                        </div>
                        {sec.lignes.length === 0 ? (
                          <p className="text-xs italic text-muted-foreground py-1">Néant</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="w-20 text-[11px]">Compte</TableHead>
                                <TableHead className="text-[11px]">Rubrique</TableHead>
                                <TableHead className="text-right text-[11px]">Net (FCFA)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sec.lignes.map((l, lIdx) => (
                                <TableRow key={lIdx} className="text-xs">
                                  <TableCell className="font-mono font-medium text-primary">{l.code}</TableCell>
                                  <TableCell>{l.libelle}</TableCell>
                                  <TableCell className="text-right font-mono font-semibold">{formatAmount(l.montantNet)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* PASSIF */}
                <Card className="border-border">
                  <CardHeader className="bg-muted/30 border-b pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Scale className="h-4 w-4 text-purple-600" /> PASSIF (Ressources)
                      </CardTitle>
                      <Badge variant="outline" className="bg-purple-50 text-purple-800 font-mono">
                        Total: {formatAmount(data.bilan.totalPassif)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 divide-y">
                    {data.bilan.passif.map((sec, idx) => (
                      <div key={idx} className="p-4 space-y-2">
                        <div className="flex justify-between items-center text-xs font-semibold uppercase text-muted-foreground">
                          <span>{sec.titre}</span>
                          <span className="font-mono text-foreground font-bold">{formatAmount(sec.total)}</span>
                        </div>
                        {sec.lignes.length === 0 ? (
                          <p className="text-xs italic text-muted-foreground py-1">Néant</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="w-20 text-[11px]">Compte</TableHead>
                                <TableHead className="text-[11px]">Rubrique</TableHead>
                                <TableHead className="text-right text-[11px]">Net (FCFA)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sec.lignes.map((l, lIdx) => (
                                <TableRow key={lIdx} className="text-xs">
                                  <TableCell className="font-mono font-medium text-primary">{l.code}</TableCell>
                                  <TableCell>{l.libelle}</TableCell>
                                  <TableCell className="text-right font-mono font-semibold">{formatAmount(l.montantNet)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ================= TAB 2: COMPTE DE RÉSULTAT ================= */}
          {activeTab === "compte-resultat" && (
            <div className="space-y-6">
              {/* CR KPIs */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="border-green-200 bg-green-50/40">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs uppercase font-semibold text-green-900">Total Produits (Classe 7)</CardDescription>
                    <CardTitle className="text-2xl font-mono text-green-950 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      {formatAmount(data.compteResultat.totalProduits)}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card className="border-red-200 bg-red-50/40">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs uppercase font-semibold text-red-900">Total Charges (Classe 6)</CardDescription>
                    <CardTitle className="text-2xl font-mono text-red-950 flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      {formatAmount(data.compteResultat.totalCharges)}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card className={cn(
                  "border-border",
                  data.compteResultat.resultatNet >= 0
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-rose-300 bg-rose-50/50"
                )}>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs uppercase font-semibold">
                      {data.compteResultat.resultatNet >= 0 ? "Résultat Net (Bénéfice)" : "Résultat Net (Perte)"}
                    </CardDescription>
                    <CardTitle className={cn(
                      "text-2xl font-mono font-bold",
                      data.compteResultat.resultatNet >= 0 ? "text-emerald-700" : "text-rose-700"
                    )}>
                      {formatAmount(data.compteResultat.resultatNet)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* CR Two Columns: Charges vs Produits */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* CHARGES */}
                <Card className="border-border">
                  <CardHeader className="bg-rose-50/40 border-b pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2 text-rose-950">
                        <TrendingDown className="h-4 w-4 text-rose-600" /> CHARGES (Classe 6)
                      </CardTitle>
                      <Badge variant="outline" className="bg-rose-100/60 text-rose-900 font-mono">
                        {formatAmount(data.compteResultat.totalCharges)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 divide-y">
                    {data.compteResultat.charges.map((sec, idx) => (
                      <div key={idx} className="p-4 space-y-2">
                        <div className="flex justify-between items-center text-xs font-semibold uppercase text-muted-foreground">
                          <span>{sec.titre}</span>
                          <span className="font-mono text-foreground font-bold">{formatAmount(sec.total)}</span>
                        </div>
                        {sec.lignes.length === 0 ? (
                          <p className="text-xs italic text-muted-foreground py-1">Néant</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="w-20 text-[11px]">Compte</TableHead>
                                <TableHead className="text-[11px]">Intitulé</TableHead>
                                <TableHead className="text-right text-[11px]">Montant (FCFA)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sec.lignes.map((l, lIdx) => (
                                <TableRow key={lIdx} className="text-xs">
                                  <TableCell className="font-mono font-medium text-rose-600">{l.code}</TableCell>
                                  <TableCell>{l.libelle}</TableCell>
                                  <TableCell className="text-right font-mono font-semibold">{formatAmount(l.montantNet)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* PRODUITS */}
                <Card className="border-border">
                  <CardHeader className="bg-emerald-50/40 border-b pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2 text-emerald-950">
                        <TrendingUp className="h-4 w-4 text-emerald-600" /> PRODUITS (Classe 7)
                      </CardTitle>
                      <Badge variant="outline" className="bg-emerald-100/60 text-emerald-900 font-mono">
                        {formatAmount(data.compteResultat.totalProduits)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 divide-y">
                    {data.compteResultat.produits.map((sec, idx) => (
                      <div key={idx} className="p-4 space-y-2">
                        <div className="flex justify-between items-center text-xs font-semibold uppercase text-muted-foreground">
                          <span>{sec.titre}</span>
                          <span className="font-mono text-foreground font-bold">{formatAmount(sec.total)}</span>
                        </div>
                        {sec.lignes.length === 0 ? (
                          <p className="text-xs italic text-muted-foreground py-1">Néant</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="w-20 text-[11px]">Compte</TableHead>
                                <TableHead className="text-[11px]">Intitulé</TableHead>
                                <TableHead className="text-right text-[11px]">Montant (FCFA)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sec.lignes.map((l, lIdx) => (
                                <TableRow key={lIdx} className="text-xs">
                                  <TableCell className="font-mono font-medium text-emerald-600">{l.code}</TableCell>
                                  <TableCell>{l.libelle}</TableCell>
                                  <TableCell className="text-right font-mono font-semibold">{formatAmount(l.montantNet)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ================= TAB 3: TAFIRE ================= */}
          {activeTab === "tafire" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-primary" /> Tableau Financier des Ressources et des Emplois (TAFIRE)
                  </CardTitle>
                  <CardDescription>
                    Flux de trésorerie de l&apos;exercice selon la nomenclature SYSCOHADA Révisé
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Indicateurs de Flux</TableHead>
                        <TableHead className="text-right">Montant (FCFA)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-sm">
                      <TableRow>
                        <TableCell className="font-medium">Capacité d&apos;Autofinancement Globale (C.A.F.)</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatAmount(data.tafire.capaciteAutofinancement)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Variation du Besoin en Fonds de Roulement (B.F.R.)</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatAmount(data.tafire.variationBFR)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/30 font-bold">
                        <TableCell>I. FLUX NET DE TRÉSORERIE D&apos;EXPLOITATION</TableCell>
                        <TableCell className="text-right font-mono text-primary">{formatAmount(data.tafire.fluxExploitation)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/30 font-bold">
                        <TableCell>II. FLUX NET DE TRÉSORERIE D&apos;INVESTISSEMENT</TableCell>
                        <TableCell className="text-right font-mono text-primary">{formatAmount(data.tafire.fluxInvestissement)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/30 font-bold">
                        <TableCell>III. FLUX NET DE TRÉSORERIE DE FINANCEMENT</TableCell>
                        <TableCell className="text-right font-mono text-primary">{formatAmount(data.tafire.fluxFinancement)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-primary/10 font-bold text-base">
                        <TableCell>VARIATION GLOBALE DE LA TRÉSORERIE (I + II + III)</TableCell>
                        <TableCell className="text-right font-mono text-primary">{formatAmount(data.tafire.variationTresorerie)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ================= TAB 4: NOTES ANNEXES ================= */}
          {activeTab === "annexe" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> Notes Annexes & Mentions Légales SYSCOHADA
                  </CardTitle>
                  <CardDescription>
                    Informations normatives pour la liasse fiscale OTR Togo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="p-4 rounded-lg border bg-muted/20 space-y-2">
                    <h4 className="font-semibold text-foreground">1. Règles et méthodes comptables retenues</h4>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Les états financiers sont préparés et présentés conformément aux dispositions de l&apos;Acte uniforme de l&apos;OHADA relatif au droit comptable et à l&apos;information financière (AUDCIF / SYSCOHADA Révisé).
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/20 space-y-2">
                    <h4 className="font-semibold text-foreground">2. Continuité de l&apos;exploitation et permanence des méthodes</h4>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      L&apos;évaluation des éléments du patrimoine est effectuée selon la méthode des coûts historiques. Les amortissements sont calculés de manière linéaire selon les durées d&apos;utilité fiscale togolaise.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

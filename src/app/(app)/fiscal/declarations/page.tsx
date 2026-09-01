"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText, CheckCircle2, Clock, AlertCircle, RefreshCw,
  Receipt, Building, Users, ExternalLink, Home, Car, DollarSign, Calculator
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatAmount } from "@/lib/utils";
import Link from "next/link";
import { CustomTaxDialog } from "@/components/fiscal/custom-tax-dialog";
import { useAuth } from "@/lib/auth-context";

type DeclarationStatut = "A_PRODUIRE" | "A_JOUR" | "EN_RETARD";

type FiscalSummary = {
  tva: {
    tvaNetteDue: number;
    tvaCollectee: number;
    tvaDeductible: number;
    periode: string;
    disponible: boolean;
  };
  is: {
    impotExigible: number;
    resultatFiscal: number;
    impotRetenu: string;
    exercice: string;
    disponible: boolean;
  };
  irpp: {
    disponible: boolean;
    irppMensuel: number;
  };
  patente: {
    montantEstime: number;
    disponible: boolean;
  };
  hasEcritures: boolean;
  tenantName: string;
  tenantNif: string;
  tenantRegime: string;
};

function getStatutBadge(statut: DeclarationStatut) {
  if (statut === "A_JOUR") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 gap-1 hover:bg-emerald-100">
        <CheckCircle2 className="h-3 w-3" /> À jour
      </Badge>
    );
  }
  if (statut === "EN_RETARD") {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" /> En retard
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300 bg-amber-50">
      <Clock className="h-3 w-3" /> À produire
    </Badge>
  );
}

function getEcheanceStatus(echeance: string): DeclarationStatut {
  const today = new Date();
  const due = new Date(echeance);
  if (due < today) return "EN_RETARD";
  return "A_PRODUIRE";
}

export default function DeclarationsPage() {
  const [data, setData] = useState<FiscalSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.toISOString().slice(0, 7);

  async function loadData() {
    setLoading(true);
    try {
      const [tvaRes, isRes, irppRes, efRes] = await Promise.all([
        fetch(`/api/v1/fiscal/tva?periode=${currentMonth}`),
        fetch(`/api/v1/fiscal/is?exercice=${currentYear}`),
        fetch("/api/v1/fiscal/irpp"),
        fetch("/api/v1/accounting/etats-financiers"),
      ]);

      const tvaData = tvaRes.ok ? await tvaRes.json() : null;
      const isData = isRes.ok ? await isRes.json() : null;
      const irppData = irppRes.ok ? await irppRes.json() : null;
      const efData = efRes.ok ? await efRes.json() : null;

      setData({
        tva: {
          tvaNetteDue: tvaData?.calculation?.tvaNetteDue ?? 0,
          tvaCollectee: tvaData?.calculation?.tvaCollectee ?? 0,
          tvaDeductible: tvaData?.calculation?.tvaDeductibleApresProrata ?? 0,
          periode: tvaData?.periode ?? currentMonth,
          disponible: !!tvaData,
        },
        is: {
          impotExigible: isData?.calculation?.impotExigible ?? 0,
          resultatFiscal: isData?.calculation?.resultatFiscal ?? 0,
          impotRetenu: isData?.calculation?.impotRetenu ?? "IS",
          exercice: isData?.exercice ?? String(currentYear),
          disponible: !!isData,
        },
        irpp: {
          disponible: !!irppData?.dashSummary,
          irppMensuel: irppData?.dashSummary?.totalIrppRetenu ?? 0,
        },
        patente: {
          montantEstime: Math.round((efData?.compteDeResultat?.chiffreAffaires || 0) * 0.007),
          disponible: !!efData?.compteDeResultat?.chiffreAffaires,
        },
        hasEcritures: !!(efData?.hasData),
        tenantName: tvaData?.tenant?.name ?? isData?.tenant?.name ?? "Entreprise",
        tenantNif: tvaData?.tenant?.nif ?? isData?.tenant?.nif ?? "",
        tenantRegime: tvaData?.tenant?.regime ?? isData?.tenant?.regime ?? "REEL_NORMAL",
      });
    } catch (err) {
      toast.error("Erreur lors du chargement des données fiscales");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ─── Référentiel Exhaustif de Déclarations OTR Togo ───
  const declarations = data ? [
    {
      id: "tva-mensuelle",
      nom: "Déclaration TVA mensuelle (Bordereau CA3)",
      periode: data.tva.periode,
      echeance: `${data.tva.periode}-15`,
      type: "TVA 18%",
      reference: "CGI art. 195 & LPF art. 60",
      montant: data.tva.tvaNetteDue,
      lien: "/fiscal/tva",
      disponible: data.tva.disponible,
      icone: Receipt,
      couleur: "text-blue-600",
    },
    {
      id: "irpp-paie-mensuelle",
      nom: "Versement mensuel IRPP & Cotisations Sociales (CNSS 4% + AMU 5%)",
      periode: data.tva.periode,
      echeance: `${data.tva.periode}-15`,
      type: "IRPP / Paie",
      reference: "CGI art. 74 & LPF art. 99",
      montant: data.irpp.irppMensuel,
      lien: "/fiscal/irpp",
      disponible: data.irpp.disponible,
      icone: Users,
      couleur: "text-emerald-600",
    },
    {
      id: "retenues-rsr-loyers",
      nom: "Retenues à la source (RSR 3%/5%/20% & Retenue Loyers 8,75%)",
      periode: data.tva.periode,
      echeance: `${data.tva.periode}-15`,
      type: "Retenues LPF",
      reference: "LPF art. 99 & 100",
      montant: 0,
      lien: "/fiscal/simulateur",
      disponible: true,
      icone: DollarSign,
      couleur: "text-cyan-600",
    },
    {
      id: "patente-annuelle",
      nom: "Droit de Patente annuel (Bordereau de liquidation)",
      periode: String(currentYear),
      echeance: `${currentYear}-03-31`,
      type: "Patente",
      reference: "CGI art. 250 & 254",
      montant: data.patente.montantEstime,
      lien: "/fiscal/patente",
      disponible: data.patente.disponible,
      icone: Building,
      couleur: "text-amber-600",
    },
    {
      id: "is-annuel",
      nom: `Impôt sur les Sociétés (IS 27% / IMF 1%) — Liasse GUDEF`,
      periode: data.is.exercice,
      echeance: `${Number(data.is.exercice) + 1}-04-30`,
      type: "IS / Liasse",
      reference: "CGI art. 113 & LPF art. 17, 49",
      montant: data.is.impotExigible,
      lien: "/fiscal/is",
      disponible: data.is.disponible,
      icone: Building,
      couleur: "text-purple-600",
    },
    {
      id: "is-acompte-1",
      nom: "1er Acompte Provisionnel IS (25% de l'impôt N-1)",
      periode: String(currentYear),
      echeance: `${currentYear}-03-31`,
      type: "IS Acompte",
      reference: "CGI art. 114 & LPF art. 55",
      montant: Math.round(data.is.impotExigible * 0.25),
      lien: "/fiscal/is",
      disponible: data.is.disponible,
      icone: Building,
      couleur: "text-purple-400",
    },
    {
      id: "is-acompte-2",
      nom: "2ème Acompte Provisionnel IS (25%)",
      periode: String(currentYear),
      echeance: `${currentYear}-06-30`,
      type: "IS Acompte",
      reference: "CGI art. 114 & LPF art. 55",
      montant: Math.round(data.is.impotExigible * 0.25),
      lien: "/fiscal/is",
      disponible: data.is.disponible,
      icone: Building,
      couleur: "text-purple-400",
    },
    {
      id: "irpp-dash",
      nom: "DASH — Déclaration Annuelle des Salaires et Rémunérations",
      periode: String(currentYear - 1),
      echeance: `${currentYear}-01-31`,
      type: "DAS / DASH",
      reference: "LPF art. 28",
      montant: 0,
      lien: "/fiscal/irpp",
      disponible: data.irpp.disponible,
      icone: Users,
      couleur: "text-orange-600",
    },
    {
      id: "taxes-foncieres",
      nom: "Taxes Foncières (TFPB 7,5% & TFPNB 0,5%) & Taxe d'Habitation",
      periode: String(currentYear),
      echeance: `${currentYear}-03-31`,
      type: "Foncier / Local",
      reference: "CGI art. 275, 276, 296",
      montant: 0,
      lien: "/fiscal/simulateur",
      disponible: true,
      icone: Home,
      couleur: "text-teal-600",
    },
    {
      id: "tvm-annuelle",
      nom: "Taxe sur les Véhicules à Moteur (TVM)",
      periode: String(currentYear),
      echeance: `${currentYear}-03-31`,
      type: "TVM",
      reference: "CGI art. 162 & LPF art. 58",
      montant: 0,
      lien: "/fiscal/simulateur",
      disponible: true,
      icone: Car,
      couleur: "text-emerald-700",
    },
  ] : [];

  const regime = data?.tenantRegime ?? "REEL_NORMAL";

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Centre des Déclarations Fiscales OTR — République Togolaise
          </h2>
          <p className="text-sm text-muted-foreground">
            Suivi et liquidation de tous les impôts, droits et taxes selon le Livre Pratique OTR 2026.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CustomTaxDialog onAdded={loadData} />
          <Link href="/fiscal/simulateur">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Calculator className="h-4 w-4" /> Simulateur Fiscal Global
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Dossier infos */}
      {data && (
        <div className="grid sm:grid-cols-4 gap-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-semibold">Dossier OTR</CardDescription>
              <CardTitle className="text-base truncate">{data.tenantName}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-0.5">
              <p>NIF : <strong>{data.tenantNif || "Non renseigné"}</strong></p>
              <p>Régime : <strong>{regime}</strong></p>
            </CardContent>
          </Card>

          <Card className={cn(
            data.tva.tvaNetteDue > 0 ? "border-blue-200 bg-blue-50/40" : "border-emerald-200 bg-emerald-50/40"
          )}>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-semibold text-blue-800">
                TVA Nette Due — {data.tva.periode}
              </CardDescription>
              <CardTitle className="text-xl font-mono text-blue-900">
                {formatAmount(data.tva.tvaNetteDue)} FCFA
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Collectée: {formatAmount(data.tva.tvaCollectee)} | Déductible: {formatAmount(data.tva.tvaDeductible)}
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/40">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-semibold text-purple-800">
                IS / IMF — {data.is.exercice}
              </CardDescription>
              <CardTitle className="text-xl font-mono text-purple-900">
                {formatAmount(data.is.impotExigible)} FCFA
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Résultat fiscal : {formatAmount(data.is.resultatFiscal)} FCFA ({data.is.impotRetenu})
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-semibold text-amber-800">
                Droit de Patente ({currentYear})
              </CardDescription>
              <CardTitle className="text-xl font-mono text-amber-900">
                {formatAmount(data.patente.montantEstime)} FCFA
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Estimation sur le CA réalisé (CGI art. 254)
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tableau des déclarations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Échéancier &amp; Tableau Général des Obligations Fiscales OTR</CardTitle>
          <CardDescription>
            Toutes les déclarations légales d&apos;une entreprise togolaise. Cliquez sur « Ouvrir » pour liquider ou simuler l&apos;impôt correspondant.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Calcul des montants fiscaux depuis la comptabilité...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Obligation Fiscale</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Référence Légale</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Échéance Légale</TableHead>
                  <TableHead className="text-right">Montant (FCFA)</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {declarations.map((d) => {
                  const statut = getEcheanceStatus(d.echeance);
                  const Icon = d.icone;
                  return (
                    <TableRow key={d.id} className={cn(!d.disponible && "opacity-75")}>
                      <TableCell>
                        <Icon className={cn("h-4 w-4", d.couleur)} />
                      </TableCell>
                      <TableCell className="font-medium text-sm">{d.nom}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{d.type}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{d.reference}</TableCell>
                      <TableCell className="font-mono text-xs">{d.periode}</TableCell>
                      <TableCell className={cn("text-xs font-medium", statut === "EN_RETARD" && "text-red-600 font-bold")}>
                        {new Date(d.echeance).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {d.montant > 0 ? (
                          <span className="text-primary">{formatAmount(d.montant)}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatutBadge(statut)}</TableCell>
                      <TableCell>
                        <Link href={d.lien as any}>
                          <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
                            Ouvrir <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Synthèse des délais OTR */}
      <Card className="border-emerald-200 bg-emerald-50/30">
        <CardContent className="pt-4 flex gap-3 text-sm text-emerald-950">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
          <div className="space-y-1">
            <p className="font-bold">Calendrier des Déclarations et Télépaiement sur E-Taxe (LPF Chapitre 5)</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1 text-emerald-900">
              <div className="bg-white/60 p-2 rounded border border-emerald-200">
                <strong>15 du mois</strong> : TVA, TAF, TCA, RSR, RSNR, Retenues Loyers, Accises
              </div>
              <div className="bg-white/60 p-2 rounded border border-emerald-200">
                <strong>31 janvier</strong> : Déclaration Annuelle des Salaires (DAS / DASH)
              </div>
              <div className="bg-white/60 p-2 rounded border border-emerald-200">
                <strong>31 mars</strong> : IRPP, TPU, Patente (Personnes Physiques), TVM
              </div>
              <div className="bg-white/60 p-2 rounded border border-emerald-200">
                <strong>30 avril</strong> : Liasse Fiscale IS (GUDEF), Patente (Personnes Morales)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

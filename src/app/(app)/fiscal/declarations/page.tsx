"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText, Download, CheckCircle2, Clock, AlertCircle, RefreshCw,
  Receipt, Building, Users, TrendingUp, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/lib/utils";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  };
  hasEcritures: boolean;
  tenantName: string;
  tenantNif: string;
  tenantRegime: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
      // Charger TVA, IS et infos tenant en parallèle
      const [tvaRes, isRes, efRes] = await Promise.all([
        fetch(`/api/v1/fiscal/tva?periode=${currentMonth}`),
        fetch(`/api/v1/fiscal/is?exercice=${currentYear}`),
        fetch("/api/v1/accounting/etats-financiers"),
      ]);

      const tvaData = tvaRes.ok ? await tvaRes.json() : null;
      const isData = isRes.ok ? await isRes.json() : null;
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
          disponible: false,
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

  // ─── Déclarations générées dynamiquement ─────────────────────────────────

  const declarations = data ? [
    {
      id: "tva-mensuelle",
      nom: "Déclaration TVA mensuelle (CA3)",
      periode: data.tva.periode,
      echeance: `${data.tva.periode}-15`,
      type: "TVA",
      montant: data.tva.tvaNetteDue,
      lien: "/fiscal/tva",
      disponible: data.tva.disponible,
      icone: Receipt,
      couleur: "text-blue-600",
    },
    {
      id: "is-annuel",
      nom: `Impôt sur les Sociétés — Liasse fiscale (${data.is.exercice})`,
      periode: data.is.exercice,
      echeance: `${Number(data.is.exercice) + 1}-04-30`,
      type: "IS",
      montant: data.is.impotExigible,
      lien: "/fiscal/is",
      disponible: data.is.disponible,
      icone: Building,
      couleur: "text-purple-600",
    },
    {
      id: "is-acompte-1",
      nom: `1er Acompte IS (25% de l'IS N-1)`,
      periode: data.is.exercice,
      echeance: `${data.is.exercice}-03-31`,
      type: "IS Acompte",
      montant: Math.round(data.is.impotExigible * 0.25),
      lien: "/fiscal/is",
      disponible: data.is.disponible,
      icone: Building,
      couleur: "text-purple-400",
    },
    {
      id: "irpp-dash",
      nom: "DASH — Déclaration Annuelle des Salaires",
      periode: String(currentYear),
      echeance: `${currentYear}-03-31`,
      type: "IRPP / Paie",
      montant: 0,
      lien: "/fiscal/irpp",
      disponible: false,
      icone: Users,
      couleur: "text-orange-600",
    },
  ] : [];

  const regime = data?.tenantRegime ?? "REEL_NORMAL";

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Centre des Déclarations Fiscales &amp; Exports OTR
          </h2>
          <p className="text-sm text-muted-foreground">
            Montants calculés automatiquement depuis vos écritures comptables SYSCOHADA
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      {/* Dossier infos */}
      {data && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-semibold">Dossier fiscal</CardDescription>
              <CardTitle className="text-base">{data.tenantName}</CardTitle>
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
                TVA Net à reverser — {data.tva.periode}
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
                IS / IMF — Exercice {data.is.exercice}
              </CardDescription>
              <CardTitle className="text-xl font-mono text-purple-900">
                {formatAmount(data.is.impotExigible)} FCFA
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Résultat fiscal : {formatAmount(data.is.resultatFiscal)} FCFA ({data.is.impotRetenu})
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tableau des déclarations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Toutes les déclarations réglementaires — Exercice {currentYear}</CardTitle>
          <CardDescription>
            {data?.hasEcritures
              ? "Montants issus de vos écritures SYSCOHADA. Cliquez sur une ligne pour accéder au module détaillé."
              : "Aucune écriture comptable trouvée. Saisissez des écritures pour générer les montants fiscaux."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Calcul des montants depuis la comptabilité...</p>
            </div>
          ) : declarations.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/20 m-6 p-6 text-center">
              <p className="font-semibold">Aucune déclaration disponible</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Les formulaires TVA, IS et IRPP seront générés dès que des écritures comptables seront saisies.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Déclaration</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Période / Exercice</TableHead>
                  <TableHead>Échéance légale</TableHead>
                  <TableHead className="text-right">Montant (FCFA)</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-28">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {declarations.map((d) => {
                  const statut = getEcheanceStatus(d.echeance);
                  const Icon = d.icone;
                  return (
                    <TableRow key={d.id} className={cn(!d.disponible && "opacity-60")}>
                      <TableCell>
                        <Icon className={cn("h-4 w-4", d.couleur)} />
                      </TableCell>
                      <TableCell className="font-medium text-sm">{d.nom}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{d.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{d.periode}</TableCell>
                      <TableCell className={cn("text-xs", statut === "EN_RETARD" && "text-red-600 font-semibold")}>
                        {new Date(d.echeance).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
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

      {/* Note légale */}
      <Card className="border-amber-200 bg-amber-50/40">
        <CardContent className="pt-4 flex gap-3 text-sm text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
          <div className="space-y-1">
            <p className="font-semibold">Rappel des obligations déclaratives OTR — Togo (CGI / LPF)</p>
            <ul className="text-xs space-y-0.5 list-disc list-inside text-amber-700">
              <li><strong>TVA (CA3)</strong> : Dépôt et paiement avant le <strong>15 du mois suivant</strong> (art. 209 CGI)</li>
              <li><strong>IS / Acomptes</strong> : 4 acomptes aux 31/03, 30/06, 30/09, 31/12 — Solde avant le <strong>30 avril N+1</strong></li>
              <li><strong>IRPP / Paie (CNSS+AMU)</strong> : Versement mensuel avant le <strong>15 du mois suivant</strong></li>
              <li><strong>DASH</strong> : Déclaration Annuelle des Salaires avant le <strong>31 mars N+1</strong></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

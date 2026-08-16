"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Download, FileText, CheckCircle2 } from "lucide-react";

export default function TvaPage() {
  const [periode, setPeriode] = useState("2025-08");

  // Données de calcul TVA pour la période
  const tvaCollectee = 2_241_000; // 18% sur 12 450 000
  const tvaDeductibleImmo = 360_000;
  const tvaDeductibleServices = 1_025_000;
  const tvaDeductibleTotale = tvaDeductibleImmo + tvaDeductibleServices;
  const creditReporteMoisPrecedent = 0;
  const prorataDeduction = 100; // 100%

  const tvaNetteDue = Math.max(0, tvaCollectee - tvaDeductibleTotale - creditReporteMoisPrecedent);
  const creditReportable = Math.max(0, (tvaDeductibleTotale + creditReporteMoisPrecedent) - tvaCollectee);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" /> Déclaration de Taxe sur la Valeur Ajoutée (TVA 18%)
            </h2>
            <Badge variant="outline" className="border-primary/40 text-primary text-xs">
              Taux standard Togo : 18%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            État récapitulatif mensuel, prorata de déduction et calcul du net à reverser à l&apos;OTR (Échéance : 15 du mois M+1)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4" /> État des déductions
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4" /> Télécharger formulaire OTR (PDF)
          </Button>
        </div>
      </div>

      {/* Cartes KPI TVA */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">TVA Collectée (18%)</CardDescription>
            <CardTitle className="text-xl font-mono text-primary">{formatAmount(tvaCollectee)} FCFA</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">TVA Déductible</CardDescription>
            <CardTitle className="text-xl font-mono text-blue-600">{formatAmount(tvaDeductibleTotale)} FCFA</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">Crédit reporté</CardDescription>
            <CardTitle className="text-xl font-mono text-muted-foreground">{formatAmount(creditReporteMoisPrecedent)} FCFA</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-primary bg-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-primary">TVA Nette à reverser</CardDescription>
            <CardTitle className="text-xl font-mono text-green-700">{formatAmount(tvaNetteDue)} FCFA</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Décompte fiscal officiel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bordereau de Déclaration TVA — Période {periode}</CardTitle>
          <CardDescription>Conforme au modèle officiel de déclaration CA3 de l&apos;OTR</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ligne</TableHead>
                <TableHead>Désignation des opérations</TableHead>
                <TableHead className="text-right">Base Hors Taxe</TableHead>
                <TableHead className="text-right">Taux</TableHead>
                <TableHead className="text-right">Montant TVA (FCFA)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-muted/40 font-semibold">
                <TableCell colSpan={5}>I. CHIFFRE D&apos;AFFAIRES & TVA COLLECTÉE</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">01</TableCell>
                <TableCell>Opérations taxables à 18% (Ventes de biens et services)</TableCell>
                <TableCell className="text-right font-mono">{formatAmount(12_450_000)}</TableCell>
                <TableCell className="text-right font-mono">18%</TableCell>
                <TableCell className="text-right font-mono font-medium">{formatAmount(tvaCollectee)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">02</TableCell>
                <TableCell>Opérations exonérées ou exportations</TableCell>
                <TableCell className="text-right font-mono">0</TableCell>
                <TableCell className="text-right font-mono">0%</TableCell>
                <TableCell className="text-right font-mono">0</TableCell>
              </TableRow>
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell colSpan={4}>TOTAL TVA COLLECTÉE (A)</TableCell>
                <TableCell className="text-right font-mono text-primary">{formatAmount(tvaCollectee)}</TableCell>
              </TableRow>

              <TableRow className="bg-muted/40 font-semibold">
                <TableCell colSpan={5}>II. DÉDUCTIONS & TVA RÉCUPÉRABLE</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">03</TableCell>
                <TableCell>TVA sur immobilisations (investissements)</TableCell>
                <TableCell className="text-right font-mono">{formatAmount(2_000_000)}</TableCell>
                <TableCell className="text-right font-mono">18%</TableCell>
                <TableCell className="text-right font-mono font-medium">{formatAmount(tvaDeductibleImmo)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">04</TableCell>
                <TableCell>TVA sur autres biens et services (achats d&apos;exploitation)</TableCell>
                <TableCell className="text-right font-mono">{formatAmount(5_694_444)}</TableCell>
                <TableCell className="text-right font-mono">18%</TableCell>
                <TableCell className="text-right font-mono font-medium">{formatAmount(tvaDeductibleServices)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">05</TableCell>
                <TableCell>Prorata général de déduction applicable</TableCell>
                <TableCell className="text-right font-mono" colSpan={2}>100 %</TableCell>
                <TableCell className="text-right font-mono font-medium">{formatAmount(tvaDeductibleTotale)}</TableCell>
              </TableRow>
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell colSpan={4}>TOTAL TVA DÉDUCTIBLE (B)</TableCell>
                <TableCell className="text-right font-mono text-blue-600">{formatAmount(tvaDeductibleTotale)}</TableCell>
              </TableRow>

              <TableRow className="bg-primary/10 font-bold text-base">
                <TableCell colSpan={4}>III. TVA NETTE DUE À L&apos;OTR (A - B)</TableCell>
                <TableCell className="text-right font-mono text-green-700">{formatAmount(tvaNetteDue)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

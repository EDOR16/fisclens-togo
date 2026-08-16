"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, Download, Calendar, HelpCircle, CheckCircle2 } from "lucide-react";

export default function IsPage() {
  const chiffreAffaires = 64_500_000;
  const resultatComptable = 7_150_000;
  const reintegrations = 450_000; // Charges non déductibles
  const deductions = 200_000; // Produits non imposables
  const resultatFiscal = resultatComptable + reintegrations - deductions;

  // Calcul IS vs IMF
  const tauxIS = 0.27; // 27%
  const isTheorique = Math.floor(resultatFiscal * tauxIS);

  // IMF (Impôt Minimum Forfaitaire) : 1% du CA avec plancher et plafond légal
  const imfTheorique = Math.max(100_000, Math.min(5_000_000, Math.floor(chiffreAffaires * 0.01)));

  // Impôt exigible : max(IS, IMF)
  const isExigible = Math.max(isTheorique, imfTheorique);
  const acompteJuin = Math.floor(isExigible / 3);
  const acompteSeptembre = Math.floor(isExigible / 3);
  const soldeAvril = isExigible - acompteJuin - acompteSeptembre;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" /> Impôt sur les Sociétés (IS 27%) & IMF
            </h2>
            <Badge variant="outline" className="border-primary/40 text-primary text-xs">
              CGI Togo — Règle du Max(IS, IMF)
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Détermination du résultat fiscal, comparaison IS 27% vs IMF 1% et échéancier des acomptes provisionnels
          </p>
        </div>
        <Button size="sm">
          <Download className="h-4 w-4" /> Liasse Fiscale OTR (PDF)
        </Button>
      </div>

      {/* Cartes synthèse comparaison */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className={isTheorique >= imfTheorique ? "border-primary bg-primary/5" : ""}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardDescription className="text-xs font-semibold uppercase">IS au taux de 27%</CardDescription>
              {isTheorique >= imfTheorique && <Badge variant="success">Retenu</Badge>}
            </div>
            <CardTitle className="text-xl font-mono text-primary">{formatAmount(isTheorique)} FCFA</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Base : Résultat fiscal de {formatAmount(resultatFiscal)} FCFA
          </CardContent>
        </Card>

        <Card className={imfTheorique > isTheorique ? "border-amber-400 bg-amber-50" : ""}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardDescription className="text-xs font-semibold uppercase">IMF (Min. Forfaitaire 1%)</CardDescription>
              {imfTheorique > isTheorique && <Badge variant="warning">Retenu (Déficit/Plancher)</Badge>}
            </div>
            <CardTitle className="text-xl font-mono">{formatAmount(imfTheorique)} FCFA</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Base : 1% sur CA {formatAmount(chiffreAffaires)} FCFA
          </CardContent>
        </Card>

        <Card className="border-2 border-primary">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-primary">Impôt Dû Définitif</CardDescription>
            <CardTitle className="text-2xl font-mono text-green-700">{formatAmount(isExigible)} FCFA</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Max(IS 27%, IMF) exigible à l&apos;OTR
          </CardContent>
        </Card>
      </div>

      {/* Échéancier des acomptes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Calendrier de paiement des acomptes (CGI Togo)
          </CardTitle>
          <CardDescription>
            L&apos;IS est réglé en 2 acomptes provisionnels (juin et septembre) + liquidation du solde (avril N+1)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Échéance</TableHead>
                <TableHead>Date légale limite</TableHead>
                <TableHead>Fraction exigible</TableHead>
                <TableHead className="text-right">Montant à régler (FCFA)</TableHead>
                <TableHead className="text-right">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold">1er Acompte IS</TableCell>
                <TableCell className="text-sm">30 Juin 2025</TableCell>
                <TableCell className="text-sm">1/3 de l&apos;impôt de référence</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatAmount(acompteJuin)}</TableCell>
                <TableCell className="text-right"><Badge variant="success">Acquitté</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">2ème Acompte IS</TableCell>
                <TableCell className="text-sm">30 Septembre 2025</TableCell>
                <TableCell className="text-sm">1/3 de l&apos;impôt de référence</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatAmount(acompteSeptembre)}</TableCell>
                <TableCell className="text-right"><Badge variant="warning">À régler</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Solde de liquidation</TableCell>
                <TableCell className="text-sm">30 Avril 2026</TableCell>
                <TableCell className="text-sm">Régularisation finale sur liasse</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatAmount(soldeAvril)}</TableCell>
                <TableCell className="text-right"><Badge variant="outline">Planifié</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

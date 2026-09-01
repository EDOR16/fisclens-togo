"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShieldCheck, Calculator, RefreshCw, Info, Download, AlertCircle } from "lucide-react";
import { formatAmount } from "@/lib/utils";
import { calculateRSR, calculateRSNR, calculateRetenueLoyers, calculatePrelevementBIC } from "@/lib/fiscal/togo-rules";

export default function RetenuesPage() {
  // RSR
  const [montantRSR, setMontantRSR] = useState(2_000_000);
  const [statutRSR, setStatutRSR] = useState<"AVEC_ATTESTATION" | "AVEC_NIF_SANS_ATTESTATION" | "SANS_NIF">("AVEC_ATTESTATION");
  const resRSR = calculateRSR(montantRSR, statutRSR);

  // RSNR
  const [montantRSNR, setMontantRSNR] = useState(5_000_000);
  const resRSNR = calculateRSNR(montantRSNR);

  // Loyers
  const [montantLoyer, setMontantLoyer] = useState(500_000);
  const resLoyers = calculateRetenueLoyers(montantLoyer);

  // BIC Douane & Gros
  const [montantBIC, setMontantBIC] = useState(15_000_000);
  const [statutBIC, setStatutBIC] = useState<"CARTE_IMMATRICULATION" | "NIF_SEUL" | "SANS_NIF">("CARTE_IMMATRICULATION");
  const resBIC = calculatePrelevementBIC(montantBIC, statutBIC);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" /> Retenues à la Source &amp; Prélèvements Fiscaux
            </h2>
            <Badge variant="outline" className="border-cyan-400 bg-cyan-50 text-cyan-800 text-xs">
              Livre IV LPF Togo
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Liquidation et déclaration des retenues opérées pour le compte du Trésor public togolais.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 1. RSR Prestations Résidents */}
        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50/50 pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-blue-700 border-blue-300">LPF art. 99</Badge>
              <span className="text-xs text-muted-foreground">Échéance : 15 du mois</span>
            </div>
            <CardTitle className="text-base text-blue-900">
              RSR — Retenue sur Prestations de Services (Résidents)
            </CardTitle>
            <CardDescription className="text-xs">
              Applicable aux honoraires et prestations versés par les personnes morales et l&apos;État.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Montant brut de la facture (FCFA)</label>
                <input
                  type="number"
                  value={montantRSR}
                  onChange={(e) => setMontantRSR(Math.max(0, Number(e.target.value)))}
                  className="w-full mt-1 p-2 rounded-md border text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Statut fiscal du prestataire</label>
                <select
                  value={statutRSR}
                  onChange={(e) => setStatutRSR(e.target.value as any)}
                  className="w-full mt-1 p-2 rounded-md border text-xs"
                >
                  <option value="AVEC_ATTESTATION">Avec Attestation de régularité (3%)</option>
                  <option value="AVEC_NIF_SANS_ATTESTATION">Avec NIF sans attestation (5%)</option>
                  <option value="SANS_NIF">Sans NIF immatriculé (20%)</option>
                </select>
              </div>
            </div>

            <div className="bg-muted/30 p-3 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Taux légal de retenue :</span>
                <strong>{resRSR.tauxPct}%</strong>
              </div>
              <div className="flex justify-between text-blue-900 font-bold text-sm pt-1 border-t">
                <span>Montant Retenu à reverser à l&apos;OTR :</span>
                <span className="font-mono text-base">{formatAmount(resRSR.retenueRSR)} FCFA</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Net à payer au prestataire :</span>
                <span className="font-mono">{formatAmount(montantRSR - resRSR.retenueRSR)} FCFA</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Retenue sur Revenus Locatifs */}
        <Card className="border-indigo-200">
          <CardHeader className="bg-indigo-50/50 pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-indigo-700 border-indigo-300">LPF art. 100</Badge>
              <span className="text-xs text-muted-foreground">Taux global : 8,75%</span>
            </div>
            <CardTitle className="text-base text-indigo-900">
              Retenue à la Source sur Loyers
            </CardTitle>
            <CardDescription className="text-xs">
              Retenue légale opérée par les locataires personnes morales sur les loyers bruts versés.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Loyer brut mensuel ou annuel (FCFA)</label>
              <input
                type="number"
                value={montantLoyer}
                onChange={(e) => setMontantLoyer(Math.max(0, Number(e.target.value)))}
                className="w-full mt-1 p-2 rounded-md border text-sm font-mono"
              />
            </div>

            <div className="bg-muted/30 p-3 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Part TFPB foncière (3,75%) :</span>
                <span className="font-mono">{formatAmount(resLoyers.ventilationTfpb)} FCFA</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Part IRPP foncier (5,00%) :</span>
                <span className="font-mono">{formatAmount(resLoyers.ventilationIrpp)} FCFA</span>
              </div>
              <div className="flex justify-between text-indigo-900 font-bold text-sm pt-1 border-t">
                <span>Retenue totale à verser à l&apos;OTR (8,75%) :</span>
                <span className="font-mono text-base">{formatAmount(resLoyers.retenueTotale)} FCFA</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Loyer net payé au propriétaire :</span>
                <span className="font-mono">{formatAmount(montantLoyer - resLoyers.retenueTotale)} FCFA</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. RSNR Non-Résidents */}
        <Card className="border-purple-200">
          <CardHeader className="bg-purple-50/50 pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-purple-700 border-purple-300">LPF art. 98</Badge>
              <span className="text-xs text-muted-foreground">Taux fixe : 20%</span>
            </div>
            <CardTitle className="text-base text-purple-900">
              RSNR — Retenue sur Prestations des Non-Résidents
            </CardTitle>
            <CardDescription className="text-xs">
              Sommes versées à l&apos;étranger pour droits d&apos;auteur, logiciels, brevets et prestations d&apos;expertise.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Montant brut facturé par le prestataire étranger (FCFA)</label>
              <input
                type="number"
                value={montantRSNR}
                onChange={(e) => setMontantRSNR(Math.max(0, Number(e.target.value)))}
                className="w-full mt-1 p-2 rounded-md border text-sm font-mono"
              />
            </div>

            <div className="bg-muted/30 p-3 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Taux légal RSNR :</span>
                <strong>20% sur le montant brut</strong>
              </div>
              <div className="flex justify-between text-purple-900 font-bold text-sm pt-1 border-t">
                <span>Retenue RSNR due :</span>
                <span className="font-mono text-base">{formatAmount(resRSNR.retenueRSNR)} FCFA</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Sous réserve des conventions fiscales internationales bilatérales applicables (CGI art. 2 &amp; 60).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 4. Prélèvement BIC Importations & Achats en gros */}
        <Card className="border-teal-200">
          <CardHeader className="bg-teal-50/50 pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-teal-700 border-teal-300">LPF art. 102 &amp; 103</Badge>
              <span className="text-xs text-muted-foreground">Cordon douanier &amp; Gros</span>
            </div>
            <CardTitle className="text-base text-teal-900">
              Prélèvement BIC (Importations &amp; Achats en Gros)
            </CardTitle>
            <CardDescription className="text-xs">
              Prélèvement libératoire ou imputable sur l&apos;IS / IRPP du redevable.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Valeur CAF / Achat en gros (FCFA)</label>
                <input
                  type="number"
                  value={montantBIC}
                  onChange={(e) => setMontantBIC(Math.max(0, Number(e.target.value)))}
                  className="w-full mt-1 p-2 rounded-md border text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Carte / Immatriculation fiscale</label>
                <select
                  value={statutBIC}
                  onChange={(e) => setStatutBIC(e.target.value as any)}
                  className="w-full mt-1 p-2 rounded-md border text-xs"
                >
                  <option value="CARTE_IMMATRICULATION">Carte d&apos;immatriculation valide (1%)</option>
                  <option value="NIF_SEUL">NIF sans carte d&apos;immatriculation (5%)</option>
                  <option value="SANS_NIF">Sans NIF (20%)</option>
                </select>
              </div>
            </div>

            <div className="bg-muted/30 p-3 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Taux de prélèvement BIC :</span>
                <strong>{resBIC.tauxPct}%</strong>
              </div>
              <div className="flex justify-between text-teal-900 font-bold text-sm pt-1 border-t">
                <span>Montant du prélèvement :</span>
                <span className="font-mono text-base">{formatAmount(resBIC.montantPrelevement)} FCFA</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Ce prélèvement est imputable sur l&apos;impôt sur le revenu (IRPP) ou l&apos;impôt sur les sociétés (IS) final (LPF art. 104).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note OTR */}
      <Card className="border-amber-200 bg-amber-50/40">
        <CardContent className="pt-4 flex gap-3 text-xs text-amber-900">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold">Obligation de Reversement (LPF art. 99 &amp; 131)</p>
            <p className="mt-0.5 leading-relaxed">
              Toutes les retenues à la source effectuées au cours d&apos;un mois doivent être obligatoirement déclarées et reversées à l&apos;OTR au plus tard le <strong>15 du mois suivant</strong>. En cas de défaut de reversement, une amende égale à 100% des retenues non effectuées s&apos;applique (LPF art. 131).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

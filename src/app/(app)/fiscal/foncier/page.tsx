"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Building, Calculator, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatAmount } from "@/lib/utils";
import { calculateTaxesFoncieres, calculateTaxeHabitation, TARIFS_TAXE_HABITATION } from "@/lib/fiscal/togo-rules";

export default function FoncierPage() {
  // TFPB (Bâti)
  const [vlcBati, setVlcBati] = useState(3_600_000);
  const [isHabitationPrincipale, setIsHabitationPrincipale] = useState(false);
  const [anneesConstruction, setAnneesConstruction] = useState(0);
  const resTFPB = calculateTaxesFoncieres({
    typePropriete: "BATIE",
    valeurLocativeCadastrale: vlcBati,
    isHabitationPrincipaleUnique: isHabitationPrincipale,
    isConstructionNeuveAnnees: anneesConstruction,
  });

  // TFPNB (Non Bâti)
  const [valeurVenale, setValeurVenale] = useState(25_000_000);
  const resTFPNB = calculateTaxesFoncieres({
    typePropriete: "NON_BATIE",
    valeurVenale: valeurVenale,
  });

  // Taxe d'Habitation
  const [typeLogement, setTypeLogement] = useState<string>("VILLA");
  const [isExonereHabitation, setIsExonereHabitation] = useState(false);
  const resHabitation = calculateTaxeHabitation(typeLogement, isExonereHabitation);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" /> Fiscalité Foncière &amp; Taxe d&apos;Habitation
            </h2>
            <Badge variant="outline" className="border-orange-400 bg-orange-50 text-orange-800 text-xs">
              CGI art. 258-296
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Liquidation des taxes foncières (TFPB / TFPNB) et de la taxe d&apos;habitation communale au Togo.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 1. TFPB (Propriétés Bâties) */}
        <Card className="border-orange-200">
          <CardHeader className="bg-orange-50/50 pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-orange-700 border-orange-300">CGI art. 258, 275</Badge>
              <span className="text-xs text-muted-foreground">Taux effectif : 3,75%</span>
            </div>
            <CardTitle className="text-base text-orange-900">
              TFPB — Propriétés Bâties
            </CardTitle>
            <CardDescription className="text-xs">
              Immeubles, bureaux, entrepôts, usines. (7,5% du net cadastral après abattement de 50%).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Valeur Locative Cadastrale (VLC) annuelle (FCFA)</label>
              <input
                type="number"
                value={vlcBati}
                onChange={(e) => setVlcBati(Math.max(0, Number(e.target.value)))}
                className="w-full mt-1 p-2 rounded-md border text-sm font-mono"
              />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-hab-princ"
                  checked={isHabitationPrincipale}
                  onChange={(e) => setIsHabitationPrincipale(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="chk-hab-princ" className="text-muted-foreground cursor-pointer">
                  Habitation principale unique (Exonération CGI art. 261)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-muted-foreground">Années de construction neuve :</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={anneesConstruction}
                  onChange={(e) => setAnneesConstruction(Number(e.target.value))}
                  className="w-16 p-1 border rounded text-xs text-center"
                />
              </div>
            </div>

            <div className="bg-muted/30 p-3 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Abattement forfaitaire de gestion 50% :</span>
                <span>-{formatAmount(resTFPB.abattementGestionFrais)} FCFA</span>
              </div>
              <div className="flex justify-between text-orange-900 font-bold text-sm pt-1 border-t">
                <span>Taxe TFPB exigible :</span>
                <span className="font-mono text-base">{formatAmount(resTFPB.montantTaxe)} FCFA</span>
              </div>
              {resTFPB.exoneration && (
                <div className="p-2 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {resTFPB.motifExoneration}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. TFPNB (Propriétés Non Bâties) */}
        <Card className="border-teal-200">
          <CardHeader className="bg-teal-50/50 pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-teal-700 border-teal-300">CGI art. 259, 276</Badge>
              <span className="text-xs text-muted-foreground">Taux : 0,5%</span>
            </div>
            <CardTitle className="text-base text-teal-900">
              TFPNB — Propriétés Non Bâties
            </CardTitle>
            <CardDescription className="text-xs">
              Terrains urbains, lotissements, terrains à bâtir (0,5% de la valeur vénale cadastrale).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Valeur vénale du terrain (FCFA)</label>
              <input
                type="number"
                value={valeurVenale}
                onChange={(e) => setValeurVenale(Math.max(0, Number(e.target.value)))}
                className="w-full mt-1 p-2 rounded-md border text-sm font-mono"
              />
            </div>

            <div className="bg-muted/30 p-3 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Taux légal d&apos;imposition :</span>
                <strong>0,5%</strong>
              </div>
              <div className="flex justify-between text-teal-900 font-bold text-sm pt-1 border-t">
                <span>Taxe TFPNB exigible :</span>
                <span className="font-mono text-base">{formatAmount(resTFPNB.montantTaxe)} FCFA</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Exonérations : terrains agricoles, maraîchers, pépinières (CGI art. 268-269).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Taxe d'Habitation */}
        <Card className="border-rose-200">
          <CardHeader className="bg-rose-50/50 pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-rose-700 border-rose-300">CGI art. 296</Badge>
              <span className="text-xs text-muted-foreground">Tarif annuel fixe</span>
            </div>
            <CardTitle className="text-base text-rose-900">
              Taxe d&apos;Habitation Communale
            </CardTitle>
            <CardDescription className="text-xs">
              Droit annuel affecté aux budgets des communes pour les services d&apos;assainissement.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Type de résidence / logement</label>
              <select
                value={typeLogement}
                onChange={(e) => setTypeLogement(e.target.value)}
                className="w-full mt-1 p-2 rounded-md border text-xs"
              >
                {TARIFS_TAXE_HABITATION.map((t) => (
                  <option key={t.type} value={t.type}>{t.label} — {formatAmount(t.montant)} FCFA</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                id="chk-exo-hab"
                checked={isExonereHabitation}
                onChange={(e) => setIsExonereHabitation(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="chk-exo-hab" className="text-muted-foreground cursor-pointer">
                Exonéré (retraité 60 ans+, &lt;18 ans, indigent — CGI art. 292)
              </label>
            </div>

            <div className="bg-muted/30 p-3 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between text-rose-900 font-bold text-sm pt-1 border-t">
                <span>Montant Taxe d&apos;Habitation :</span>
                <span className="font-mono text-base">{formatAmount(resHabitation)} FCFA</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Échéance annuelle de déclaration et paiement avant le <strong>31 mars</strong> (LPF art. 83).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Échéances OTR */}
      <Card className="border-amber-200 bg-amber-50/40">
        <CardContent className="pt-4 flex gap-3 text-xs text-amber-900">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold">Délais de Déclaration et Paiement des Impôts Locaux (LPF art. 83 &amp; 84)</p>
            <p className="mt-0.5 leading-relaxed">
              Les déclarations des impôts fonciers (TFPB, TFPNB) et de la taxe d&apos;habitation sont souscrites annuellement au plus tard le <strong>31 mars</strong> de chaque année auprès du centre des impôts territorialement compétent ou via la plateforme E-Taxe OTR.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

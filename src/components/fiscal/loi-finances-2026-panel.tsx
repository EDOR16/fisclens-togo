"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  Receipt,
  Truck,
  Sprout,
  Accessibility,
  FileCheck,
  Calculator,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { formatAmount } from "@/lib/utils";
import {
  calculatePrecompteTva,
  isTvmSuspendue,
  isExonerationElevagePeche,
  calculateCreditImpotHandicap,
  verifierConformiteFacture,
  type PrecompteTvaStatut,
  type UsageVehicule,
  type CategorieElevagePeche,
  type TypeFacture,
} from "@/lib/fiscal/loi-finances-2026";

export function LoiFinances2026Panel() {
  // ── Art. 13 : Précompte TVA
  const [precompteHT, setPrecompteHT] = useState(500_000);
  const [precompteStatut, setPrecompteStatut] = useState<PrecompteTvaStatut>(
    "FOURNISSEUR_NIF_VALIDE"
  );
  const rPrecompte = calculatePrecompteTva({
    montantHT: precompteHT,
    statut: precompteStatut,
  });

  // ── Art. 14 : TVM suspension
  const [tvmUsage, setTvmUsage] = useState<UsageVehicule>("COMMERCIAL_TRANSPORT");
  const rTvm = isTvmSuspendue({ usage: tvmUsage, anneeReference: 2026 });

  // ── Art. 18 : Exonération élevage
  const [elevageCategorie, setElevageCategorie] =
    useState<CategorieElevagePeche>("PROVENDE");
  const [elevageEnregistre, setElevageEnregistre] = useState(false);
  const rElevage = isExonerationElevagePeche({
    categorie: elevageCategorie,
    exploitantEnregistre: elevageEnregistre,
    anneeReference: 2026,
  });

  // ── Art. 20 : Crédit handicap
  const [handicapSalaries, setHandicapSalaries] = useState(2);
  const [handicapContrats, setHandicapContrats] = useState(2);
  const rHandicap = calculateCreditImpotHandicap({
    nombreSalariesHandicapes: handicapSalaries,
    contratsValides: handicapContrats,
    anneeReference: 2026,
  });

  // ── Art. 62 LPF : Conformité facture
  const [factureType, setFactureType] = useState<TypeFacture>("ELECTRONIQUE_CERTIFIEE");
  const [factureNumero, setFactureNumero] = useState("FAC-2026-001");
  const [factureAssujetti, setFactureAssujetti] = useState(true);
  const [factureVignette, setFactureVignette] = useState(true);
  const [factureDestinataireAssujetti, setFactureDestinataireAssujetti] = useState(true);
  const rFacture = verifierConformiteFacture({
    typeFacture: factureType,
    estAssujettiTVA: factureAssujetti,
    contientVignette: factureVignette,
    numeroFacture: factureNumero,
    tauxTVA: factureAssujetti ? 18 : undefined,
    destinataireAssujetti: factureDestinataireAssujetti,
  });

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200 bg-emerald-50/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">
              Loi de Finances 2026 — Dispositions applicables
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              Loi n° 2025-002 du 31/12/2025
            </Badge>
          </div>
          <CardDescription className="text-xs">
            5 mesures fiscales entrées en vigueur le 1er janvier 2026 pour l'exercice en cours.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Art. 13 — Précompte TVA */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-base">Art. 13 — Précompte TVA à la source</CardTitle>
            <Badge variant="outline" className="text-[10px]">Nouveau 2026</Badge>
          </div>
          <CardDescription className="text-xs">
            L'acquéreur opère la retenue TVA sur facture fournisseur identifié par NIF.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Montant HT de la facture (FCFA)</Label>
              <Input
                type="number"
                value={precompteHT}
                onChange={(e) => setPrecompteHT(Math.max(0, Number(e.target.value)))}
                className="font-mono"
              />
            </div>
            <div>
              <Label className="text-xs">Statut du fournisseur</Label>
              <select
                value={precompteStatut}
                onChange={(e) => setPrecompteStatut(e.target.value as PrecompteTvaStatut)}
                className="w-full mt-1 p-2 rounded-md border text-xs"
              >
                <option value="FOURNISSEUR_NIF_VALIDE">NIF valide — précompte appliqué</option>
                <option value="FOURNISSEUR_SANS_NIF">Sans NIF — précompte non applicable</option>
                <option value="ETAT_OU_COLLECTIVITE">État / collectivité — cas particulier</option>
              </select>
            </div>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg space-y-2 text-xs">
            <div className="flex justify-between">
              <span>HT :</span>
              <span className="font-mono">{formatAmount(rPrecompte.montantHT)} FCFA</span>
            </div>
            <div className="flex justify-between">
              <span>TVA facturée (18%) :</span>
              <span className="font-mono">{formatAmount(rPrecompte.tvaFacturee)} FCFA</span>
            </div>
            <div className="flex justify-between text-blue-700 font-semibold border-t pt-2">
              <span>TVA précomptée :</span>
              <span className="font-mono">{formatAmount(rPrecompte.tvaPrecomptee)} FCFA</span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-1">
              <span>Net à payer fournisseur :</span>
              <span className="font-mono">
                {formatAmount(rPrecompte.netAPayerFournisseur)} FCFA
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Art. 14 — Suspension TVM */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-base">Art. 14 — Suspension TVM véhicules commerciaux</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Du 1er janvier au 31 décembre 2026 pour les véhicules de transport.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid lg:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Usage du véhicule</Label>
            <select
              value={tvmUsage}
              onChange={(e) => setTvmUsage(e.target.value as UsageVehicule)}
              className="w-full mt-1 p-2 rounded-md border text-xs"
            >
              <option value="COMMERCIAL_TRANSPORT">Commercial — transport marchandises/personnes</option>
              <option value="PRIVE">Privé</option>
              <option value="MIXTE">Mixte</option>
            </select>
          </div>
          <div
            className={`p-3 rounded-lg border-2 ${
              rTvm.suspendue
                ? "border-emerald-300 bg-emerald-50"
                : "border-amber-300 bg-amber-50"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              {rTvm.suspendue ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-800">TVM suspendue pour 2026</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-800">TVM de droit commun applicable</span>
                </>
              )}
            </div>
            {rTvm.motif && (
              <p className="text-xs text-muted-foreground mt-1">{rTvm.motif}</p>
            )}
            <p className="text-[10px] font-mono text-muted-foreground mt-2">{rTvm.article}</p>
          </div>
        </CardContent>
      </Card>

      {/* Art. 18 — Exonération élevage */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4 text-green-600" />
            <CardTitle className="text-base">Art. 18 — Exonération TVA provendes & élevage</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Provendes, aliments composés et produits locaux transformés.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Catégorie du produit</Label>
              <select
                value={elevageCategorie}
                onChange={(e) => setElevageCategorie(e.target.value as CategorieElevagePeche)}
                className="w-full mt-1 p-2 rounded-md border text-xs"
              >
                <option value="PROVENDE">Provende</option>
                <option value="ALIMENT_COMPOSE">Aliment composé</option>
                <option value="COMPLEMENT">Complément</option>
                <option value="PRODUIT_LOCAL_TRANSFORME">Produit local transformé</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            {elevageCategorie === "PRODUIT_LOCAL_TRANSFORME" && (
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={elevageEnregistre}
                  onChange={(e) => setElevageEnregistre(e.target.checked)}
                />
                Exploitant dûment enregistré auprès des autorités
              </label>
            )}
          </div>
          <div
            className={`p-3 rounded-lg border-2 ${
              rElevage.exonere
                ? "border-emerald-300 bg-emerald-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              {rElevage.exonere ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-800">Exonéré de TVA (LF 2026)</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">Non exonéré</span>
                </>
              )}
            </div>
            {rElevage.motif && (
              <p className="text-xs text-muted-foreground mt-1">{rElevage.motif}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Art. 20 — Crédit handicap */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Accessibility className="h-4 w-4 text-purple-600" />
            <CardTitle className="text-base">Art. 20 — Crédit d'impôt handicap</CardTitle>
            <Badge variant="outline" className="text-[10px]">120 000 FCFA/salarié/an</Badge>
          </div>
          <CardDescription className="text-xs">
            CDD ≥ 12 mois ou CDI — reportable 5 ans.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nombre de salariés en situation de handicap</Label>
              <Input
                type="number"
                min={0}
                value={handicapSalaries}
                onChange={(e) => setHandicapSalaries(Math.max(0, Number(e.target.value)))}
                className="font-mono"
              />
            </div>
            <div>
              <Label className="text-xs">Contrats valides (CDD ≥ 12 mois ou CDI)</Label>
              <Input
                type="number"
                min={0}
                value={handicapContrats}
                onChange={(e) => setHandicapContrats(Math.max(0, Number(e.target.value)))}
                className="font-mono"
              />
            </div>
          </div>
          <div className="bg-purple-50 border-2 border-purple-200 p-3 rounded-lg space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Salariés éligibles :</span>
              <span className="font-mono font-bold">{rHandicap.nombreSalariesEligibles}</span>
            </div>
            <div className="flex justify-between">
              <span>Montant unitaire :</span>
              <span className="font-mono">{formatAmount(rHandicap.montantUnitaire)} FCFA</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t pt-2 text-purple-900">
              <span>Crédit d'impôt total :</span>
              <span className="font-mono">{formatAmount(rHandicap.creditTotal)} FCFA</span>
            </div>
            {rHandicap.reportable && (
              <p className="text-[10px] text-purple-700">
                Reportable sur {rHandicap.dureeReportAnnees} ans si maintien du salarié
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Art. 62 LPF — Conformité facture */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-base">Art. 62 LPF — Conformité facture</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Facture électronique certifiée obligatoire entre redevables TVA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid lg:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Type de facture</Label>
              <select
                value={factureType}
                onChange={(e) => setFactureType(e.target.value as TypeFacture)}
                className="w-full mt-1 p-2 rounded-md border text-xs"
              >
                <option value="ELECTRONIQUE_CERTIFIEE">Électronique certifiée</option>
                <option value="NORMALISEE_PAPIER">Normalisée papier</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Numéro de facture</Label>
              <Input
                value={factureNumero}
                onChange={(e) => setFactureNumero(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1 pt-5">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={factureAssujetti}
                  onChange={(e) => setFactureAssujetti(e.target.checked)}
                />
                Émetteur assujetti TVA
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={factureDestinataireAssujetti}
                  onChange={(e) => setFactureDestinataireAssujetti(e.target.checked)}
                />
                Destinataire assujetti TVA
              </label>
              {factureType === "NORMALISEE_PAPIER" && (
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={factureVignette}
                    onChange={(e) => setFactureVignette(e.target.checked)}
                  />
                  Vignette OTR présente
                </label>
              )}
            </div>
          </div>
          <div
            className={`p-3 rounded-lg border-2 ${
              rFacture.conforme
                ? "border-emerald-300 bg-emerald-50"
                : "border-red-300 bg-red-50"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              {rFacture.conforme ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-800">Facture conforme</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-red-800">
                    {rFacture.erreurs.length} non-conformité(s)
                  </span>
                </>
              )}
            </div>
            {rFacture.erreurs.length > 0 && (
              <ul className="mt-2 space-y-1">
                {rFacture.erreurs.map((err, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-1">
                    <span>•</span> {err}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
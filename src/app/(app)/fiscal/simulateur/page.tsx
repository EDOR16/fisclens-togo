"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator, Users, Building, Receipt, FileSpreadsheet, Home, Car,
  DollarSign, ShieldAlert, ArrowRight, CheckCircle2, Info
} from "lucide-react";
import {
  calculateTogoPayroll,
  calculateTogoIS,
  calculateTogoTva,
  calculateTogoPatente,
  calculateTogoTPU,
  calculateTogoTPV,
  calculateTaxesFoncieres,
  calculateTaxeHabitation,
  calculateRSR,
  calculateRSNR,
  calculateRetenueLoyers,
  calculatePrelevementBIC,
  calculateTogoTVM,
  calculateTogoTAF,
  calculateTogoTCA,
  calculatePenalitesRetard,
  TARIFS_TAXE_HABITATION,
  TARIFS_TVM_TOGO,
  TAUX_TCA_TOGO,
} from "@/lib/fiscal/togo-rules";
import { formatAmount } from "@/lib/utils";
import { CustomTaxDialog } from "@/components/fiscal/custom-tax-dialog";

export default function SimulateurPage() {
  const [activeTab, setActiveTab] = useState("directs");

  // ─── États Simulateurs ───
  // 1. IRPP & Paie
  const [salaireBrut, setSalaireBrut] = useState(350_000);
  const [chargesFamille, setChargesFamille] = useState(2);
  const payrollRes = calculateTogoPayroll({ salaireBrut, nombreChargesFamille: chargesFamille });

  // 2. IS / IMF
  const [caIS, setCaIS] = useState(50_000_000);
  const [produitsIS, setProduitsIS] = useState(50_000_000);
  const [chargesIS, setChargesIS] = useState(38_000_000);
  const isRes = calculateTogoIS({ chiffreAffairesHt: caIS, totalProduits: produitsIS, totalCharges: chargesIS });

  // 3. TVA & Précompte
  const [caTva, setCaTva] = useState(20_000_000);
  const [achatsTvaBiens, setAchatsTvaBiens] = useState(1_800_000);
  const [achatsTvaImmo, setAchatsTvaImmo] = useState(0);
  const [precompteMarches, setPrecompteMarches] = useState(0);
  const tvaRes = calculateTogoTva({
    ventesTaxablesHt: caTva,
    achatsBiensServicesTva: achatsTvaBiens,
    achatsImmoTva: achatsTvaImmo,
    marchesPublicsTvaFacturee: precompteMarches,
  });

  // 4. TPU & Patente
  const [caPatente, setCaPatente] = useState(35_000_000);
  const [secteurPatente, setSecteurPatente] = useState<"COMMERCE" | "SERVICES" | "INDUSTRIE" | "REVENDEDEUR_TISSUS">("COMMERCE");
  const patenteRes = calculateTogoPatente({ chiffreAffairesHt: caPatente, secteur: secteurPatente });
  const tpuRes = calculateTogoTPU({ typeRegime: "DECLARATIF", secteur: "COMMERCE", chiffreAffairesHt: caPatente });

  // 5. Fonciers & Habitation
  const [vlcBati, setVlcBati] = useState(2_400_000);
  const [valeurNonBati, setValeurNonBati] = useState(15_000_000);
  const [typeLogement, setTypeLogement] = useState<string>("VILLA");
  const tfpbRes = calculateTaxesFoncieres({ typePropriete: "BATIE", valeurLocativeCadastrale: vlcBati });
  const tfpnbRes = calculateTaxesFoncieres({ typePropriete: "NON_BATIE", valeurVenale: valeurNonBati });
  const taxeHabitationMontant = calculateTaxeHabitation(typeLogement);

  // 6. Retenues à la source (RSR, RSNR, Loyers, BIC)
  const [prestationRSR, setPrestationRSR] = useState(1_500_000);
  const [statutRSR, setStatutRSR] = useState<"AVEC_ATTESTATION" | "AVEC_NIF_SANS_ATTESTATION" | "SANS_NIF">("AVEC_ATTESTATION");
  const rsrRes = calculateRSR(prestationRSR, statutRSR);

  const [loyerBrut, setLoyerBrut] = useState(400_000);
  const retenueLoyerRes = calculateRetenueLoyers(loyerBrut);

  const [importCaf, setImportCaf] = useState(10_000_000);
  const [statutBic, setStatutBic] = useState<"CARTE_IMMATRICULATION" | "NIF_SEUL" | "SANS_NIF">("CARTE_IMMATRICULATION");
  const bicRes = calculatePrelevementBIC(importCaf, statutBic);

  // 7. Spécifiques (TVM, TAF, TCA)
  const [typeTVM, setTypeTVM] = useState<string>("AUTO_8_11_CV");
  const tvmRes = calculateTogoTVM(typeTVM);

  const [primesTCA, setPrimesTCA] = useState(500_000);
  const [brancheTCA, setBrancheTCA] = useState<keyof typeof TAUX_TCA_TOGO>("INCENDIE_BIENS_PRO");
  const tcaRes = calculateTogoTCA(primesTCA, brancheTCA);

  // 8. Pénalités de retard
  const [impotRetard, setImpotRetard] = useState(1_000_000);
  const [nbMoisRetard, setNbMoisRetard] = useState(2);
  const [miseEnDemeure, setMiseEnDemeure] = useState(false);
  const penalitesRes = calculatePenalitesRetard(impotRetard, nbMoisRetard, miseEnDemeure);

  return (
    <div className="space-y-6">
      {/* En-tête officiel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Calculator className="h-6 w-6 text-primary" /> Simulateur Exhaustif des Impôts &amp; Taxes du Togo
            </h2>
            <Badge className="bg-emerald-600 text-white font-mono text-xs">
              OTR 2026 · CGI &amp; LPF
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Moteur de calcul complet couvrant l&apos;intégralité des 10+ impôts, droits, taxes, retenues et prélèvements en vigueur en République Togolaise.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CustomTaxDialog />
        </div>
      </div>

      {/* Tabs par catégories OTR */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 h-auto p-1 bg-muted/60">
          <TabsTrigger value="directs" className="text-xs py-2">Impôts Directs (IRPP/IS)</TabsTrigger>
          <TabsTrigger value="tva" className="text-xs py-2">TVA &amp; CA (18%)</TabsTrigger>
          <TabsTrigger value="locaux" className="text-xs py-2">Patente &amp; TPU</TabsTrigger>
          <TabsTrigger value="fonciers" className="text-xs py-2">Foncier &amp; Habitation</TabsTrigger>
          <TabsTrigger value="retenues" className="text-xs py-2">Retenues &amp; Prélèvements</TabsTrigger>
          <TabsTrigger value="specifiques" className="text-xs py-2">TVM, TCA &amp; Pénalités</TabsTrigger>
        </TabsList>

        {/* ─── TAB 1 : IMPÔTS DIRECTS (IRPP / IS / IMF) ─── */}
        <TabsContent value="directs" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* IRPP & Salaires */}
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50/50 pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-blue-700 border-blue-300">CGI art. 26 &amp; 74</Badge>
                  <span className="text-xs text-muted-foreground">CNSS 4% + AMU 5% = 9%</span>
                </div>
                <CardTitle className="text-base text-blue-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" /> IRPP &amp; Salaires (Barème 8 tranches)
                </CardTitle>
                <CardDescription className="text-xs">
                  Abattement forfaitaire 28% (plafonné à 10M/an) et déductions familiales (10 000 FCFA/pers/mois).
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Salaire brut mensuel (FCFA)</label>
                    <input
                      type="number"
                      value={salaireBrut}
                      onChange={(e) => setSalaireBrut(Math.max(0, Number(e.target.value)))}
                      className="w-full mt-1 p-2 rounded-md border text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Personnes à charge (max 6)</label>
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={chargesFamille}
                      onChange={(e) => setChargesFamille(Math.min(6, Math.max(0, Number(e.target.value))))}
                      className="w-full mt-1 p-2 rounded-md border text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Cotisations salarié (CNSS 4% + AMU 5% = 9%) :</span>
                    <strong className="text-destructive">-{formatAmount(payrollRes.totalRetenueSalariale)} FCFA</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Charges patronales (CNSS 15% + AMU 5% = 20%) :</span>
                    <strong className="text-amber-600">+{formatAmount(payrollRes.totalChargePatronale)} FCFA</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Abattement frais professionnels 28% :</span>
                    <span className="text-muted-foreground">-{formatAmount(payrollRes.abattementFraisPro)} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base imposable mensuelle IRPP :</span>
                    <span className="font-mono">{formatAmount(payrollRes.baseImposableIrpp)} FCFA</span>
                  </div>
                  <div className="flex justify-between text-blue-700">
                    <span>Retenue IRPP à la source :</span>
                    <strong>-{formatAmount(payrollRes.irppNet)} FCFA</strong>
                  </div>
                  <div className="pt-2 border-t flex justify-between text-sm font-bold text-emerald-700">
                    <span>Net à payer au salarié :</span>
                    <span className="font-mono text-base">{formatAmount(payrollRes.netAPayer)} FCFA</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* IS / IMF */}
            <Card className="border-purple-200">
              <CardHeader className="bg-purple-50/50 pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-purple-700 border-purple-300">CGI art. 113 &amp; 120</Badge>
                  <span className="text-xs text-muted-foreground">IS 27% vs IMF 1% (min 20 000 F)</span>
                </div>
                <CardTitle className="text-base text-purple-900 flex items-center gap-2">
                  <Building className="h-5 w-5 text-purple-600" /> Impôt sur les Sociétés (IS) &amp; Acomptes
                </CardTitle>
                <CardDescription className="text-xs">
                  Comparaison automatique IS (27% du bénéfice fiscal) et IMF (1% du Chiffre d&apos;Affaires).
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Chiffre d&apos;affaires HT</label>
                    <input
                      type="number"
                      value={caIS}
                      onChange={(e) => setCaIS(Math.max(0, Number(e.target.value)))}
                      className="w-full mt-1 p-2 rounded-md border text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Total Produits</label>
                    <input
                      type="number"
                      value={produitsIS}
                      onChange={(e) => setProduitsIS(Math.max(0, Number(e.target.value)))}
                      className="w-full mt-1 p-2 rounded-md border text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Total Charges</label>
                    <input
                      type="number"
                      value={chargesIS}
                      onChange={(e) => setChargesIS(Math.max(0, Number(e.target.value)))}
                      className="w-full mt-1 p-2 rounded-md border text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Résultat fiscal :</span>
                    <strong className="font-mono">{formatAmount(isRes.resultatFiscal)} FCFA</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>IS Théorique (27%) :</span>
                    <span className="font-mono">{formatAmount(isRes.isTheorique)} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IMF Minimum (1% du CA, min 20k) :</span>
                    <span className="font-mono">{formatAmount(isRes.mfpTheorique)} FCFA</span>
                  </div>
                  <div className="pt-2 border-t flex justify-between text-sm font-bold text-purple-800">
                    <span>Impôt exigible ({isRes.impotRetenu}) :</span>
                    <span className="font-mono text-base">{formatAmount(isRes.impotExigible)} FCFA</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground pt-1 flex justify-between">
                    <span>4 acomptes trimestriels :</span>
                    <span className="font-mono font-semibold">{formatAmount(isRes.acompte1)} FCFA / trimestre</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 2 : TVA (18%) & ACTIVITÉS FINANCIÈRES (TAF 10%) ─── */}
        <TabsContent value="tva" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-emerald-200">
              <CardHeader className="bg-emerald-50/50 pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300">CGI art. 195 &amp; 201</Badge>
                  <span className="text-xs text-muted-foreground">Taux unique 18%</span>
                </div>
                <CardTitle className="text-base text-emerald-900 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-emerald-600" /> TVA &amp; Précompte Marchés Publics
                </CardTitle>
                <CardDescription className="text-xs">
                  Bordereau mensuel CA3 et retenue à la source 50% sur marchés publics.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Ventes taxables HT (FCFA)</label>
                    <input
                      type="number"
                      value={caTva}
                      onChange={(e) => setCaTva(Math.max(0, Number(e.target.value)))}
                      className="w-full mt-1 p-2 rounded-md border text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">TVA Déductible Biens &amp; Services</label>
                    <input
                      type="number"
                      value={achatsTvaBiens}
                      onChange={(e) => setAchatsTvaBiens(Math.max(0, Number(e.target.value)))}
                      className="w-full mt-1 p-2 rounded-md border text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">TVA Déductible sur Immos</label>
                    <input
                      type="number"
                      value={achatsTvaImmo}
                      onChange={(e) => setAchatsTvaImmo(Math.max(0, Number(e.target.value)))}
                      className="w-full mt-1 p-2 rounded-md border text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">TVA facturée marchés publics (si précompte 50%)</label>
                    <input
                      type="number"
                      value={precompteMarches}
                      onChange={(e) => setPrecompteMarches(Math.max(0, Number(e.target.value)))}
                      className="w-full mt-1 p-2 rounded-md border text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>TVA collectée brute (18%) :</span>
                    <strong className="font-mono">{formatAmount(tvaRes.tvaCollectee)} FCFA</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>TVA déductible totale :</span>
                    <span className="text-muted-foreground">-{formatAmount(tvaRes.tvaDeductibleTotale)} FCFA</span>
                  </div>
                  {tvaRes.precompteMarchesPublics > 0 && (
                    <div className="flex justify-between text-blue-700">
                      <span>Précompte 50% retenu par l&apos;État (CGI art. 201) :</span>
                      <span>-{formatAmount(tvaRes.precompteMarchesPublics)} FCFA</span>
                    </div>
                  )}
                  <div className="pt-2 border-t flex justify-between text-sm font-bold text-emerald-800">
                    <span>{tvaRes.tvaNetteDue > 0 ? "TVA Nette à reverser :" : "Crédit de TVA reportable :"}</span>
                    <span className="font-mono text-base">
                      {formatAmount(tvaRes.tvaNetteDue > 0 ? tvaRes.tvaNetteDue : tvaRes.creditReportable)} FCFA
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TAF (Activités financières) */}
            <Card className="border-cyan-200">
              <CardHeader className="bg-cyan-50/50 pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-cyan-700 border-cyan-300">CGI art. 214 &amp; 220</Badge>
                  <span className="text-xs text-muted-foreground">Taux 10%</span>
                </div>
                <CardTitle className="text-base text-cyan-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-cyan-600" /> TAF (Activités Financières)
                </CardTitle>
                <CardDescription className="text-xs">
                  Applicable aux banques, établissements financiers et intermédiaires de change.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Profits bruts bancaires / commissions (FCFA)</label>
                  <input
                    type="number"
                    defaultValue={10_000_000}
                    id="input-taf"
                    className="w-full mt-1 p-2 rounded-md border text-sm font-mono"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const taf = calculateTogoTAF(val);
                      const el = document.getElementById("result-taf");
                      if (el) el.innerText = `${formatAmount(taf.montantTaf)} FCFA`;
                    }}
                  />
                </div>

                <div className="bg-muted/30 p-3 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Base imposable :</span>
                    <span>Montant brut des profits</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taux légal :</span>
                    <strong>10%</strong>
                  </div>
                  <div className="pt-2 border-t flex justify-between text-sm font-bold text-cyan-800">
                    <span>Taxe due :</span>
                    <span id="result-taf" className="font-mono text-base">{formatAmount(1_000_000)} FCFA</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 3 : PATENTE & TPU ─── */}
        <TabsContent value="locaux" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Droit de Patente */}
            <Card className="border-amber-200">
              <CardHeader className="bg-amber-50/50 pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-amber-700 border-amber-300">CGI art. 250-255</Badge>
                  <span className="text-xs text-muted-foreground">Barème 0,55% à 1,20%</span>
                </div>
                <CardTitle className="text-base text-amber-900 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-amber-600" /> Droit de Patente
                </CardTitle>
                <CardDescription className="text-xs">
                  Calculé sur le Chiffre d&apos;Affaires HT (ou marge brute) avec réduction de 60% pour revendeurs de tissus.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Chiffre d&apos;affaires HT (FCFA)</label>
                    <input
                      type="number"
                      value={caPatente}
                      onChange={(e) => setCaPatente(Math.max(0, Number(e.target.value)))}
                      className="w-full mt-1 p-2 rounded-md border text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Secteur d&apos;activité</label>
                    <select
                      value={secteurPatente}
                      onChange={(e) => setSecteurPatente(e.target.value as any)}
                      className="w-full mt-1 p-2 rounded-md border text-xs"
                    >
                      <option value="COMMERCE">Commerce général</option>
                      <option value="SERVICES">Prestations de services</option>
                      <option value="INDUSTRIE">Industrie</option>
                      <option value="REVENDEDEUR_TISSUS">Revendeur de tissus (-60%)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Taux moyen appliqué :</span>
                    <strong>{patenteRes.tauxMoyen.toFixed(2)}%</strong>
                  </div>
                  {patenteRes.reductionRevendeurTissus > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Réduction revendeur de tissus (60%) :</span>
                      <span>-{formatAmount(patenteRes.reductionRevendeurTissus)} FCFA</span>
                    </div>
                  )}
                  <div className="pt-2 border-t flex justify-between text-sm font-bold text-amber-900">
                    <span>Montant Net de Patente :</span>
                    <span className="font-mono text-base">{formatAmount(patenteRes.montantNet)} FCFA</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground pt-1 flex justify-between">
                    <span>Répartition légale :</span>
                    <span>État 30% ({formatAmount(patenteRes.repartition.etat)}) | Collectivités 50% ({formatAmount(patenteRes.repartition.collectivites)})</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TPU */}
            <Card className="border-indigo-200">
              <CardHeader className="bg-indigo-50/50 pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-indigo-700 border-indigo-300">CGI art. 131-139</Badge>
                  <span className="text-xs text-muted-foreground">TPU (Petites entreprises)</span>
                </div>
                <CardTitle className="text-base text-indigo-900 flex items-center gap-2">
                  <Building className="h-5 w-5 text-indigo-600" /> Taxe Professionnelle Unique (TPU)
                </CardTitle>
                <CardDescription className="text-xs">
                  Forfaitaire (CA ≤ 30M) ou déclarative (30M &lt; CA ≤ 60M : 2% commerce, 8% services).
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="bg-muted/30 p-3 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Régime appliqué :</span>
                    <strong>{tpuRes.regime}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Tarif / Taux :</span>
                    <span>{tpuRes.tauxOuTarif}</span>
                  </div>
                  <div className="pt-2 border-t flex justify-between text-sm font-bold text-indigo-900">
                    <span>Montant annuel TPU :</span>
                    <span className="font-mono text-base">{formatAmount(tpuRes.montantAnnuel)} FCFA</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Échéance par quart :</span>
                    <span className="font-mono font-semibold">{formatAmount(tpuRes.montantTrimestriel)} FCFA / trimestre</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 4 : TAXES FONCIÈRES & TAXE D'HABITATION ─── */}
        <TabsContent value="fonciers" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-5">
            {/* TFPB (Propriétés Bâties) */}
            <Card className="border-orange-200">
              <CardHeader className="bg-orange-50/50 pb-3">
                <Badge variant="outline" className="w-fit text-orange-700 border-orange-300 text-xs">CGI art. 258, 275</Badge>
                <CardTitle className="text-sm font-bold text-orange-900">TFPB (Propriétés Bâties)</CardTitle>
                <CardDescription className="text-xs">
                  7,5% × (50% × VLC) = 3,75% de la Valeur Locative Cadastrale
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Valeur Locative Cadastrale (FCFA)</label>
                  <input
                    type="number"
                    value={vlcBati}
                    onChange={(e) => setVlcBati(Math.max(0, Number(e.target.value)))}
                    className="w-full mt-1 p-2 rounded-md border text-xs font-mono"
                  />
                </div>
                <div className="bg-muted/30 p-2.5 rounded text-xs space-y-1">
                  <div className="flex justify-between"><span>Abattement 50% :</span> <span>-{formatAmount(tfpbRes.abattementGestionFrais)} F</span></div>
                  <div className="flex justify-between font-bold text-orange-900"><span>Montant TFPB :</span> <span>{formatAmount(tfpbRes.montantTaxe)} FCFA</span></div>
                </div>
              </CardContent>
            </Card>

            {/* TFPNB (Non Bâties) */}
            <Card className="border-teal-200">
              <CardHeader className="bg-teal-50/50 pb-3">
                <Badge variant="outline" className="w-fit text-teal-700 border-teal-300 text-xs">CGI art. 259, 276</Badge>
                <CardTitle className="text-sm font-bold text-teal-900">TFPNB (Terrains Non Bâtis)</CardTitle>
                <CardDescription className="text-xs">
                  0,5% de la valeur vénale cadastrale du terrain
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Valeur vénale cadastrale (FCFA)</label>
                  <input
                    type="number"
                    value={valeurNonBati}
                    onChange={(e) => setValeurNonBati(Math.max(0, Number(e.target.value)))}
                    className="w-full mt-1 p-2 rounded-md border text-xs font-mono"
                  />
                </div>
                <div className="bg-muted/30 p-2.5 rounded text-xs space-y-1">
                  <div className="flex justify-between"><span>Taux légal :</span> <span>0,5%</span></div>
                  <div className="flex justify-between font-bold text-teal-900"><span>Montant TFPNB :</span> <span>{formatAmount(tfpnbRes.montantTaxe)} FCFA</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Taxe d'Habitation */}
            <Card className="border-rose-200">
              <CardHeader className="bg-rose-50/50 pb-3">
                <Badge variant="outline" className="w-fit text-rose-700 border-rose-300 text-xs">CGI art. 296</Badge>
                <CardTitle className="text-sm font-bold text-rose-900">Taxe d&apos;Habitation</CardTitle>
                <CardDescription className="text-xs">
                  Tarif forfaitaire annuel par type d&apos;habitation
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Type d&apos;habitation</label>
                  <select
                    value={typeLogement}
                    onChange={(e) => setTypeLogement(e.target.value)}
                    className="w-full mt-1 p-2 rounded-md border text-xs"
                  >
                    {TARIFS_TAXE_HABITATION.map((t) => (
                      <option key={t.type} value={t.type}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-muted/30 p-2.5 rounded text-xs space-y-1">
                  <div className="flex justify-between font-bold text-rose-900"><span>Tarif annuel :</span> <span>{formatAmount(taxeHabitationMontant)} FCFA</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 5 : RETENUES À LA SOURCE (RSR, RSNR, LOYERS, BIC) ─── */}
        <TabsContent value="retenues" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-5">
            {/* RSR (Prestations Résidents) */}
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50/50 pb-3">
                <Badge variant="outline" className="w-fit text-blue-700 border-blue-300 text-xs">LPF art. 99</Badge>
                <CardTitle className="text-sm font-bold text-blue-900">RSR (Prestations Résidents)</CardTitle>
                <CardDescription className="text-xs">
                  3% (attestation), 5% (NIF seul), 20% (sans NIF)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Montant brut prestation (FCFA)</label>
                  <input
                    type="number"
                    value={prestationRSR}
                    onChange={(e) => setPrestationRSR(Math.max(0, Number(e.target.value)))}
                    className="w-full mt-1 p-2 rounded-md border text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Statut du prestataire</label>
                  <select
                    value={statutRSR}
                    onChange={(e) => setStatutRSR(e.target.value as any)}
                    className="w-full mt-1 p-2 rounded-md border text-xs"
                  >
                    <option value="AVEC_ATTESTATION">Avec Attestation Fiscale (3%)</option>
                    <option value="AVEC_NIF_SANS_ATTESTATION">Avec NIF sans attestation (5%)</option>
                    <option value="SANS_NIF">Sans NIF (20%)</option>
                  </select>
                </div>
                <div className="bg-muted/30 p-2.5 rounded text-xs space-y-1">
                  <div className="flex justify-between font-bold text-blue-900">
                    <span>Retenue RSR ({rsrRes.tauxPct}%) :</span>
                    <span>{formatAmount(rsrRes.retenueRSR)} FCFA</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Retenue sur Loyers */}
            <Card className="border-indigo-200">
              <CardHeader className="bg-indigo-50/50 pb-3">
                <Badge variant="outline" className="w-fit text-indigo-700 border-indigo-300 text-xs">LPF art. 100</Badge>
                <CardTitle className="text-sm font-bold text-indigo-900">Retenue sur Loyers (8,75%)</CardTitle>
                <CardDescription className="text-xs">
                  Ventilation : 3,75% TFPB + 5% IRPP
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Montant brut loyer mensuel (FCFA)</label>
                  <input
                    type="number"
                    value={loyerBrut}
                    onChange={(e) => setLoyerBrut(Math.max(0, Number(e.target.value)))}
                    className="w-full mt-1 p-2 rounded-md border text-xs font-mono"
                  />
                </div>
                <div className="bg-muted/30 p-2.5 rounded text-xs space-y-1">
                  <div className="flex justify-between text-muted-foreground"><span>Part TFPB (3,75%) :</span> <span>{formatAmount(retenueLoyerRes.ventilationTfpb)} F</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Part IRPP (5%) :</span> <span>{formatAmount(retenueLoyerRes.ventilationIrpp)} F</span></div>
                  <div className="flex justify-between font-bold text-indigo-900 pt-1 border-t">
                    <span>Total Retenu (8,75%) :</span>
                    <span>{formatAmount(retenueLoyerRes.retenueTotale)} FCFA</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prélèvement BIC */}
            <Card className="border-violet-200">
              <CardHeader className="bg-violet-50/50 pb-3">
                <Badge variant="outline" className="w-fit text-violet-700 border-violet-300 text-xs">LPF art. 102 &amp; 103</Badge>
                <CardTitle className="text-sm font-bold text-violet-900">Prélèvement BIC (Achats / Import)</CardTitle>
                <CardDescription className="text-xs">
                  1% (carte), 5% (NIF sans carte), 20% (sans NIF)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Valeur CAF / Achat en gros (FCFA)</label>
                  <input
                    type="number"
                    value={importCaf}
                    onChange={(e) => setImportCaf(Math.max(0, Number(e.target.value)))}
                    className="w-full mt-1 p-2 rounded-md border text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Situation acquéreur</label>
                  <select
                    value={statutBic}
                    onChange={(e) => setStatutBic(e.target.value as any)}
                    className="w-full mt-1 p-2 rounded-md border text-xs"
                  >
                    <option value="CARTE_IMMATRICULATION">Carte d&apos;immatriculation valide (1%)</option>
                    <option value="NIF_SEUL">NIF sans carte (5%)</option>
                    <option value="SANS_NIF">Sans NIF (20%)</option>
                  </select>
                </div>
                <div className="bg-muted/30 p-2.5 rounded text-xs space-y-1">
                  <div className="flex justify-between font-bold text-violet-900">
                    <span>Prélèvement ({bicRes.tauxPct}%) :</span>
                    <span>{formatAmount(bicRes.montantPrelevement)} FCFA</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 6 : SPÉCIFIQUES (TVM, TCA, PÉNALITÉS) ─── */}
        <TabsContent value="specifiques" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-5">
            {/* TVM */}
            <Card className="border-emerald-200">
              <CardHeader className="bg-emerald-50/50 pb-3">
                <Badge variant="outline" className="w-fit text-emerald-700 border-emerald-300 text-xs">CGI art. 162-170</Badge>
                <CardTitle className="text-sm font-bold text-emerald-900">Taxe sur les Véhicules (TVM)</CardTitle>
                <CardDescription className="text-xs">
                  Tarif annuel selon puissance fiscale
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Catégorie de véhicule</label>
                  <select
                    value={typeTVM}
                    onChange={(e) => setTypeTVM(e.target.value)}
                    className="w-full mt-1 p-2 rounded-md border text-xs"
                  >
                    {TARIFS_TVM_TOGO.map((v) => (
                      <option key={v.type} value={v.type}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-muted/30 p-2.5 rounded text-xs space-y-1">
                  <div className="flex justify-between font-bold text-emerald-900">
                    <span>Tarif TVM :</span>
                    <span>{formatAmount(tvmRes.tarif)} FCFA</span>
                  </div>
                  <div className="text-[10.5px] text-muted-foreground">
                    Affectation : SAFER 78% ({formatAmount(tvmRes.repartition.safer)} F) · Trésor 10% · OTR 12%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TCA Assurances */}
            <Card className="border-sky-200">
              <CardHeader className="bg-sky-50/50 pb-3">
                <Badge variant="outline" className="w-fit text-sky-700 border-sky-300 text-xs">CGI art. 222-228</Badge>
                <CardTitle className="text-sm font-bold text-sky-900">Taxe sur Assurances (TCA)</CardTitle>
                <CardDescription className="text-xs">
                  Taux variable de 0,20% à 25% selon la branche
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Branche d&apos;assurance</label>
                  <select
                    value={brancheTCA}
                    onChange={(e) => setBrancheTCA(e.target.value as any)}
                    className="w-full mt-1 p-2 rounded-md border text-xs"
                  >
                    {Object.entries(TAUX_TCA_TOGO).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Prime d&apos;assurance (FCFA)</label>
                  <input
                    type="number"
                    value={primesTCA}
                    onChange={(e) => setPrimesTCA(Math.max(0, Number(e.target.value)))}
                    className="w-full mt-1 p-2 rounded-md border text-xs font-mono"
                  />
                </div>
                <div className="bg-muted/30 p-2.5 rounded text-xs space-y-1">
                  <div className="flex justify-between font-bold text-sky-900">
                    <span>Taxe TCA ({tcaRes.tauxPct}%) :</span>
                    <span>{formatAmount(tcaRes.montantTca)} FCFA</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pénalités de retard */}
            <Card className="border-red-200">
              <CardHeader className="bg-red-50/50 pb-3">
                <Badge variant="outline" className="w-fit text-red-700 border-red-300 text-xs">LPF art. 115 &amp; 116</Badge>
                <CardTitle className="text-sm font-bold text-red-900">Calculateur de Pénalités</CardTitle>
                <CardDescription className="text-xs">
                  10% 1er mois + 1%/mois supplémentaire + 20% AMED
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Principal dû (FCFA)</label>
                    <input
                      type="number"
                      value={impotRetard}
                      onChange={(e) => setImpotRetard(Math.max(0, Number(e.target.value)))}
                      className="w-full mt-1 p-2 rounded-md border text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Mois de retard</label>
                    <input
                      type="number"
                      min={1}
                      value={nbMoisRetard}
                      onChange={(e) => setNbMoisRetard(Math.max(1, Number(e.target.value)))}
                      className="w-full mt-1 p-2 rounded-md border text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-amed"
                    checked={miseEnDemeure}
                    onChange={(e) => setMiseEnDemeure(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="chk-amed" className="text-xs text-muted-foreground cursor-pointer">
                    Mise en demeure notifiée (+20%)
                  </label>
                </div>
                <div className="bg-muted/30 p-2.5 rounded text-xs space-y-1">
                  <div className="flex justify-between text-destructive">
                    <span>Pénalités &amp; Intérêts :</span>
                    <span>+{formatAmount(penalitesRes.totalPenalites)} FCFA</span>
                  </div>
                  <div className="flex justify-between font-bold text-red-900 pt-1 border-t">
                    <span>Total à payer à l&apos;OTR :</span>
                    <span>{formatAmount(penalitesRes.totalExigible)} FCFA</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Note de conformité OTR 2026 */}
      <div className="rounded-lg bg-emerald-50/50 border border-emerald-200 p-4 text-xs text-emerald-800 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-emerald-950">Conformité intégrale au Livre Pratique du CGI et du LPF — Édition 2026 (OTR Togo)</p>
          <p className="mt-0.5 text-emerald-850">
            Tous les modules ci-dessus calculent exactement selon les formules légales officielles édictées par le Commissariat des Impôts de l&apos;Office Togolais des Recettes.
          </p>
        </div>
      </div>
    </div>
  );
}

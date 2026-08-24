/**
 * Moteur fiscal et social de la République Togolaise (CGI Togo / CNSS)
 * Tous les montants sont calculés en FCFA entiers.
 * Barème IRPP, taux IS/TVA/MFP et mécanisme des acomptes vérifiés contre :
 * CODE GENERAL DES IMPOTS ET LIVRE DES PROCEDURES FISCALES — OTR 2025.
 */

// ---------------------------------------------------------------------------
// 1. MODULE TVA (18%) — Art. 195 CGI : taux unique 18%
// ---------------------------------------------------------------------------

export type TvaCalculationInput = {
  ventesTaxablesHt: number;
  ventesExonereesHt?: number;
  achatsImmoTva: number;
  achatsBiensServicesTva: number;
  creditReportePrecedent?: number;
  prorataDeductionPct?: number; // 0 à 100 (défaut 100)
};

export type TvaCalculationResult = {
  tauxTva: number;
  tvaCollectee: number;
  tvaDeductibleImmo: number;
  tvaDeductibleBiensServices: number;
  tvaDeductibleTotale: number;
  prorataApplique: number;
  tvaDeductibleApresProrata: number;
  creditReportePrecedent: number;
  tvaNetteDue: number;
  creditReportable: number;
};

export function calculateTogoTva(input: TvaCalculationInput): TvaCalculationResult {
  const tauxTva = 0.18;
  const tvaCollectee = Math.round(input.ventesTaxablesHt * tauxTva);
  const tvaDeductibleImmo = Math.round(input.achatsImmoTva);
  const tvaDeductibleBiensServices = Math.round(input.achatsBiensServicesTva);
  const tvaDeductibleTotale = tvaDeductibleImmo + tvaDeductibleBiensServices;

  const prorata = input.prorataDeductionPct !== undefined ? input.prorataDeductionPct : 100;
  const tvaDeductibleApresProrata = Math.round((tvaDeductibleTotale * prorata) / 100);
  const creditReporte = input.creditReportePrecedent || 0;

  const totalDeductionsEtCredits = tvaDeductibleApresProrata + creditReporte;

  const tvaNetteDue = Math.max(0, tvaCollectee - totalDeductionsEtCredits);
  const creditReportable = Math.max(0, totalDeductionsEtCredits - tvaCollectee);

  return {
    tauxTva: 18,
    tvaCollectee,
    tvaDeductibleImmo,
    tvaDeductibleBiensServices,
    tvaDeductibleTotale,
    prorataApplique: prorata,
    tvaDeductibleApresProrata,
    creditReportePrecedent: creditReporte,
    tvaNetteDue,
    creditReportable,
  };
}

// ---------------------------------------------------------------------------
// 2. MODULE IRPP & PAIE TOGO (CGI Art. 26 & 74 / CNSS / AMU)
// ---------------------------------------------------------------------------
// Taux de cotisations sociales (source : CNSS Togo / Décret n° 2023-096/PR AMU) :
//   CNSS vieillesse-invalidité : 4% ouvrier + 15% patronal
//   AMU (Assurance Maladie Universelle) : 5% ouvrier + 5% patronal
//   Total prélèvement salarié   : 4% CNSS + 5% AMU = 9%
//   Total charge patronale      : 15% CNSS + 5% AMU = 20%
// ---------------------------------------------------------------------------

export type PayrollCalculationInput = {
  salaireBrut: number;
  avantagesEnNature?: number;
  nombreChargesFamille?: number; // Déductions familiales
};

export type PayrollCalculationResult = {
  salaireBrut: number;
  // ─── CNSS vieillesse-invalidité ───────────────────────────
  cnssSalariale: number;    // 4%   — cotisation ouvrier CNSS
  cnssPatronale: number;    // 15%  — cotisation employeur CNSS (hors AMU)
  // ─── AMU (Assurance Maladie Universelle) ──────────────────
  amuSalariale: number;     // 5%   — ouvrier AMU [Décret 2023-096/PR]
  amuPatronale: number;     // 5%   — employeur AMU
  // ─── Agrégats ─────────────────────────────────────────────
  totalRetenueSalariale: number;  // cnssSalariale + amuSalariale (9%)
  totalChargePatronale: number;   // cnssPatronale + amuPatronale (20%)
  coutTotalEmployeur: number;     // salaireBrut + totalChargePatronale
  brutApresCotisations: number;   // salaireBrut - totalRetenueSalariale
  abattementFraisPro: number;     // 28% plafonné à 833 333 FCFA/mois
  baseImposableIrpp: number;
  irppBrut: number;
  reductionChargeFamille: number;
  irppNet: number;
  netAPayer: number;
};

// Barème progressif annuel IRPP Togo [CGI art. 74, Loi n°2022-022 du 27/12/2022]
// Seuils ramenés au mois (÷12) pour une retenue mensuelle à la source.
const TRANCHES_IRPP_MENSUEL = [
  { min: 0, max: 75_000, taux: 0.0 }, // 0 – 900 000 F/an : exonéré
  { min: 75_000, max: 250_000, taux: 0.03 }, // 900 001 – 3 000 000 F/an : 3%
  { min: 250_000, max: 500_000, taux: 0.10 }, // 3 000 001 – 6 000 000 F/an : 10%
  { min: 500_000, max: 750_000, taux: 0.15 }, // 6 000 001 – 9 000 000 F/an : 15%
  { min: 750_000, max: 1_000_000, taux: 0.20 }, // 9 000 001 – 12 000 000 F/an : 20%
  { min: 1_000_000, max: 1_250_000, taux: 0.25 }, // 12 000 001 – 15 000 000 F/an : 25%
  { min: 1_250_000, max: 1_666_667, taux: 0.30 }, // 15 000 001 – 20 000 000 F/an : 30%
  { min: 1_666_667, max: Infinity, taux: 0.35 }, // Plus de 20 000 000 F/an : 35%
];

// Taux de cotisations sociales Togo (CNSS + AMU)
const TAUX = {
  CNSS_SAL: 0.04,   // 4%    ouvrier CNSS vieillesse-invalidité
  CNSS_PAT: 0.15,   // 15%   patronal CNSS (hors AMU)
  AMU_SAL: 0.05,    // 5%    ouvrier AMU [Décret 2023-096/PR]
  AMU_PAT: 0.05,    // 5%    patronal AMU
} as const;

export function calculateTogoPayroll(input: PayrollCalculationInput): PayrollCalculationResult {
  const { salaireBrut } = input;

  // ─── Cotisations salariales ───────────────────────────────
  const cnssSalariale = Math.round(salaireBrut * TAUX.CNSS_SAL);
  const amuSalariale = Math.round(salaireBrut * TAUX.AMU_SAL);
  const totalRetenueSalariale = cnssSalariale + amuSalariale; // 9%

  // ─── Charges patronales ───────────────────────────────────
  const cnssPatronale = Math.round(salaireBrut * TAUX.CNSS_PAT);
  const amuPatronale = Math.round(salaireBrut * TAUX.AMU_PAT);
  const totalChargePatronale = cnssPatronale + amuPatronale;  // 20%
  const coutTotalEmployeur = salaireBrut + totalChargePatronale;

  // ─── Base IRPP ────────────────────────────────────────────
  const brutApresCotisations = salaireBrut - totalRetenueSalariale;

  // Abattement forfaitaire de 28% plafonné à 10 000 000 FCFA/an (833 333 FCFA/mois)
  const MAX_ABATTEMENT_MENSUEL = Math.round(10_000_000 / 12);
  const abattementFraisPro = Math.min(
    Math.round(brutApresCotisations * 0.28),
    MAX_ABATTEMENT_MENSUEL
  );

  const baseImposableIrpp = Math.max(
    0,
    Math.floor((brutApresCotisations - abattementFraisPro) / 1000) * 1000
  );

  // ─── Calcul IRPP par tranche [CGI art. 74] ────────────────
  let irppBrut = 0;
  for (const t of TRANCHES_IRPP_MENSUEL) {
    if (baseImposableIrpp > t.min) {
      const taxableDansTranche = Math.min(baseImposableIrpp, t.max) - t.min;
      irppBrut += taxableDansTranche * t.taux;
    }
  }
  irppBrut = Math.round(irppBrut);

  // ─── Réduction charges de famille [CGI art. 73 : 10 000 F/pers/mois, max 6] ──
  const charges = Math.min(input.nombreChargesFamille || 0, 6);
  const reductionChargeFamille = charges * 10_000;
  const irppNet = Math.max(0, irppBrut - reductionChargeFamille);

  // ─── Net à payer ──────────────────────────────────────────
  const netAPayer = salaireBrut - totalRetenueSalariale - irppNet;

  return {
    salaireBrut,
    cnssSalariale,
    cnssPatronale,
    amuSalariale,
    amuPatronale,
    totalRetenueSalariale,
    totalChargePatronale,
    coutTotalEmployeur,
    brutApresCotisations,
    abattementFraisPro,
    baseImposableIrpp,
    irppBrut,
    reductionChargeFamille,
    irppNet,
    netAPayer,
  };
}

// ---------------------------------------------------------------------------
// 3. MODULE IS & MFP (27% vs 1% du CA, plancher 20 000 F)
// CGI art. 113 (taux IS 27%), art. 120 (MFP), art. 114 (acomptes)
// ---------------------------------------------------------------------------

export type IsCalculationInput = {
  chiffreAffairesHt: number;
  totalProduits: number;
  totalCharges: number;
  reintegrationsFiscales?: number;
  deductionsFiscales?: number;
  /** Impôt (IS ou MFP) mis à la charge du contribuable au titre du dernier exercice clos [Art. 114] */
  impotExercicePrecedent?: number;
};

export type IsCalculationResult = {
  chiffreAffairesHt: number;
  resultatComptable: number;
  reintegrations: number;
  deductions: number;
  resultatFiscal: number;
  tauxIs: number;
  isTheorique: number;
  tauxMfp: number;
  mfpTheorique: number;
  impotRetenu: "IS" | "MFP";
  impotExigible: number;
  /** 4 acomptes égaux, chacun 25% de l'impôt de l'exercice N-1 [Art. 114] */
  acompte1: number;
  acompte2: number;
  acompte3: number;
  acompte4: number;
};

export function calculateTogoIS(input: IsCalculationInput): IsCalculationResult {
  const resultatComptable = input.totalProduits - input.totalCharges;
  const reintegrations = input.reintegrationsFiscales || 0;
  const deductions = input.deductionsFiscales || 0;
  const resultatFiscal = Math.max(0, resultatComptable + reintegrations - deductions);

  // IS à 27% [Art. 113] — toute fraction < 1 000 F négligée
  const tauxIs = 0.27;
  const isTheorique = Math.floor((resultatFiscal * tauxIs) / 1000) * 1000;

  // MFP : 1% du CA HT, plancher 20 000 FCFA, sans plafond [Art. 120]
  const tauxMfp = 0.01;
  const calculMfp = Math.round(input.chiffreAffairesHt * tauxMfp);
  const mfpTheorique = Math.max(20_000, calculMfp);

  // Règle du Max(IS, MFP) — le MFP s'applique en cas de déficit ou si l'IS lui est inférieur
  const impotRetenu = isTheorique >= mfpTheorique ? "IS" : "MFP";
  const impotExigible = Math.max(isTheorique, mfpTheorique);

  // Acomptes provisionnels [Art. 114] : 4 acomptes égaux au quart de l'impôt N-1,
  // arrondis au millier de francs inférieur. Nécessite l'impôt de l'exercice précédent.
  const baseAcompte = input.impotExercicePrecedent ?? 0;
  const acompteUnitaire = Math.floor(baseAcompte / 4 / 1000) * 1000;

  return {
    chiffreAffairesHt: input.chiffreAffairesHt,
    resultatComptable,
    reintegrations,
    deductions,
    resultatFiscal,
    tauxIs: 27,
    isTheorique,
    tauxMfp: 1,
    mfpTheorique,
    impotRetenu,
    impotExigible,
    acompte1: acompteUnitaire,
    acompte2: acompteUnitaire,
    acompte3: acompteUnitaire,
    acompte4: acompteUnitaire,
  };
}
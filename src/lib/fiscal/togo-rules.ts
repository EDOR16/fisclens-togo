/**
 * Moteur fiscal et social de la République Togolaise (CGI Togo / CNSS)
 * Tous les montants sont calculés en FCFA entiers.
 */

// ---------------------------------------------------------------------------
// 1. MODULE TVA (18%)
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
// Taux applicables (source : CNSS Togo / décret AMU 2011) :
//   CNSS vieillesse-invalidité : 4% ouvrier + 15% patronal
//   AMU (Assurance Maladie Universelle) : 1% ouvrier + 2.5% patronal
//   Total prélèvement salarié   : 4% CNSS + 1% AMU = 5%
//   Total charge patronale      : 15% CNSS + 2.5% AMU = 17.5%
//   → coût global employeur     : salaire brut × 117.5%
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
  amuSalariale: number;     // 1%   — ouvrier AMU (décret AMU Togo)
  amuPatronale: number;     // 2.5% — employeur AMU (décret AMU Togo)
  // ─── Agrégats ─────────────────────────────────────────────
  totalRetenueSalariale: number;  // cnssSalariale + amuSalariale (5%)
  totalChargePatronale: number;   // cnssPatronale + amuPatronale (17.5%)
  coutTotalEmployeur: number;     // salaireBrut + totalChargePatronale
  brutApresCotisations: number;   // salaireBrut - totalRetenueSalariale
  abattementFraisPro: number;     // 28% plafonné à 833 333 FCFA/mois
  baseImposableIrpp: number;
  irppBrut: number;
  reductionChargeFamille: number;
  irppNet: number;
  netAPayer: number;
};

// Barème progressif mensuel IRPP Togo [CGI art. 74]
const TRANCHES_IRPP_MENSUEL = [
  { min: 0,         max: 75_000,    taux: 0.0  },
  { min: 75_000,    max: 250_000,   taux: 0.07 },
  { min: 250_000,   max: 500_000,   taux: 0.15 },
  { min: 500_000,   max: 1_000_000, taux: 0.25 },
  { min: 1_000_000, max: 1_500_000, taux: 0.30 },
  { min: 1_500_000, max: Infinity,  taux: 0.35 },
];

// Taux de cotisations sociales Togo (CNSS + AMU)
const TAUX = {
  CNSS_SAL:  0.04,   // 4%    ouvrier CNSS vieillesse-invalidité
  CNSS_PAT:  0.15,   // 15%   patronal CNSS (hors AMU)
  AMU_SAL:   0.01,   // 1%    ouvrier AMU
  AMU_PAT:   0.025,  // 2.5%  patronal AMU
} as const;

export function calculateTogoPayroll(input: PayrollCalculationInput): PayrollCalculationResult {
  const { salaireBrut } = input;

  // ─── Cotisations salariales ───────────────────────────────
  const cnssSalariale = Math.round(salaireBrut * TAUX.CNSS_SAL);
  const amuSalariale  = Math.round(salaireBrut * TAUX.AMU_SAL);
  const totalRetenueSalariale = cnssSalariale + amuSalariale; // 5%

  // ─── Charges patronales ───────────────────────────────────
  const cnssPatronale        = Math.round(salaireBrut * TAUX.CNSS_PAT);
  const amuPatronale         = Math.round(salaireBrut * TAUX.AMU_PAT);
  const totalChargePatronale = cnssPatronale + amuPatronale;  // 17.5%
  const coutTotalEmployeur   = salaireBrut + totalChargePatronale;

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

  // ─── Réduction charges de famille ────────────────────────
  const charges = Math.min(input.nombreChargesFamille || 0, 6);
  const reductionChargeFamille = charges * 2000;
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
// 3. MODULE IS & IMF (27% vs 1%)
// ---------------------------------------------------------------------------

export type IsCalculationInput = {
  chiffreAffairesHt: number;
  totalProduits: number;
  totalCharges: number;
  reintegrationsFiscales?: number;
  deductionsFiscales?: number;
};

export type IsCalculationResult = {
  chiffreAffairesHt: number;
  resultatComptable: number;
  reintegrations: number;
  deductions: number;
  resultatFiscal: number;
  tauxIs: number;
  isTheorique: number;
  tauxImf: number;
  imfTheorique: number;
  impotRetenu: "IS" | "IMF";
  impotExigible: number;
  acompteJuin: number; // 33%
  acompteSeptembre: number; // 33%
  soldeAvril: number; // 34%
};

export function calculateTogoIS(input: IsCalculationInput): IsCalculationResult {
  const resultatComptable = input.totalProduits - input.totalCharges;
  const reintegrations = input.reintegrationsFiscales || 0;
  const deductions = input.deductionsFiscales || 0;
  const resultatFiscal = Math.max(0, resultatComptable + reintegrations - deductions);

  // IS à 27%
  const tauxIs = 0.27;
  const isTheorique = Math.round(resultatFiscal * tauxIs);

  // IMF : 1% du CA (plancher 200 000 FCFA, plafond 5 000 000 FCFA) [CGI Togo]
  const tauxImf = 0.01;
  const calculImf = Math.round(input.chiffreAffairesHt * tauxImf);
  const imfTheorique = Math.max(200_000, Math.min(5_000_000, calculImf));

  // Règle du Max(IS, IMF)
  const impotRetenu = isTheorique >= imfTheorique ? "IS" : "IMF";
  const impotExigible = Math.max(isTheorique, imfTheorique);

  // Acomptes provisionnels
  const acompteJuin       = Math.round(impotExigible / 3);
  const acompteSeptembre  = Math.round(impotExigible / 3);
  const soldeAvril        = impotExigible - acompteJuin - acompteSeptembre;

  return {
    chiffreAffairesHt: input.chiffreAffairesHt,
    resultatComptable,
    reintegrations,
    deductions,
    resultatFiscal,
    tauxIs: 27,
    isTheorique,
    tauxImf: 1,
    imfTheorique,
    impotRetenu,
    impotExigible,
    acompteJuin,
    acompteSeptembre,
    soldeAvril,
  };
}

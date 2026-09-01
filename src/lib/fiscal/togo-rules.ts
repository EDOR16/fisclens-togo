/**
 * MOTEUR FISCAL ET SOCIAL DE LA RÉPUBLIQUE TOGOLAISE (CGI Togo / LPF / CNSS / AMU)
 * ─────────────────────────────────────────────────────────────────────────────
 * Source officielle de référence :
 * OFFICE TOGOLAIS DES RECETTES (OTR) — COMMISSARIAT DES IMPÔTS
 * LIVRE PRATIQUE DU CGI ET DU LPF — ÉDITION 2026
 * 
 * Tous les impôts, droits, taxes, retenues à la source, prélèvements et régimes
 * sont indexés avec leurs références exactes d'articles CGI et LPF.
 */

// ═════════════════════════════════════════════════════════════════════════════
// 1. IMPÔTS DIRECTS
// ═════════════════════════════════════════════════════════════════════════════

// ─── 1.1 IRPP (Impôt sur le Revenu des Personnes Physiques) ───────────────────
// CGI art. 74 : Barème progressif officiel 2026 (8 tranches)
export const BAREME_IRPP_ANNUEL = [
  { min: 0, max: 900_000, taux: 0.00, label: "0 à 900 000 FCFA : Exonéré" },
  { min: 900_000, max: 3_000_000, taux: 0.03, label: "900 001 à 3 000 000 FCFA : 3%" },
  { min: 3_000_000, max: 6_000_000, taux: 0.10, label: "3 000 001 à 6 000 000 FCFA : 10%" },
  { min: 6_000_000, max: 9_000_000, taux: 0.15, label: "6 000 001 à 9 000 000 FCFA : 15%" },
  { min: 9_000_000, max: 12_000_000, taux: 0.20, label: "9 000 001 à 12 000 000 FCFA : 20%" },
  { min: 12_000_000, max: 15_000_000, taux: 0.25, label: "12 000 001 à 15 000 000 FCFA : 25%" },
  { min: 15_000_000, max: 20_000_000, taux: 0.30, label: "15 000 001 à 20 000 000 FCFA : 30%" },
  { min: 20_000_000, max: Infinity, taux: 0.35, label: "Au-delà de 20 000 000 FCFA : 35%" },
] as const;

export const BAREME_IRPP_MENSUEL = BAREME_IRPP_ANNUEL.map((t) => ({
  min: Math.round(t.min / 12),
  max: t.max === Infinity ? Infinity : Math.round(t.max / 12),
  taux: t.taux,
}));

// Taux de cotisations sociales Togo (CNSS + AMU)
export const TAUX_SOCIAUX_TOGO = {
  CNSS_SALARIALE: 0.04,   // 4%  — Retenue ouvrière CNSS (CGI art. 25-26)
  CNSS_PATRONALE: 0.15,   // 15% — Charge patronale CNSS
  AMU_SALARIALE: 0.05,    // 5%  — Retenue ouvrière AMU (Décret 2023-096/PR)
  AMU_PATRONALE: 0.05,    // 5%  — Charge patronale AMU
  TOTAL_SALARIAL: 0.09,   // 9%  — Total retenue employé
  TOTAL_PATRONAL: 0.20,   // 20% — Total charge employeur
} as const;

export type PayrollCalculationInput = {
  salaireBrut: number;
  avantagesEnNature?: number;
  nombreChargesFamille?: number; // CGI art. 72-73 : 10 000 FCFA/pers/mois, max 6
};

export type PayrollCalculationResult = {
  salaireBrut: number;
  cnssSalariale: number;
  cnssPatronale: number;
  amuSalariale: number;
  amuPatronale: number;
  totalRetenueSalariale: number; // 9%
  totalChargePatronale: number;  // 20%
  coutTotalEmployeur: number;
  brutApresCotisations: number;
  abattementFraisPro: number;    // 28% sur fraction ≤ 10M FCFA/an (CGI art. 26)
  baseImposableIrpp: number;
  irppBrut: number;
  reductionChargeFamille: number;
  irppNet: number;
  netAPayer: number;
};

export function calculateTogoPayroll(input: PayrollCalculationInput): PayrollCalculationResult {
  const { salaireBrut } = input;
  const cnssSalariale = Math.round(salaireBrut * TAUX_SOCIAUX_TOGO.CNSS_SALARIALE);
  const amuSalariale = Math.round(salaireBrut * TAUX_SOCIAUX_TOGO.AMU_SALARIALE);
  const totalRetenueSalariale = cnssSalariale + amuSalariale;

  const cnssPatronale = Math.round(salaireBrut * TAUX_SOCIAUX_TOGO.CNSS_PATRONALE);
  const amuPatronale = Math.round(salaireBrut * TAUX_SOCIAUX_TOGO.AMU_PATRONALE);
  const totalChargePatronale = cnssPatronale + amuPatronale;
  const coutTotalEmployeur = salaireBrut + totalChargePatronale;

  const brutApresCotisations = salaireBrut - totalRetenueSalariale;
  const maxAbattementMensuel = Math.round(10_000_000 / 12);
  const abattementFraisPro = Math.min(Math.round(brutApresCotisations * 0.28), maxAbattementMensuel);

  const baseImposableIrpp = Math.max(0, Math.floor((brutApresCotisations - abattementFraisPro) / 1000) * 1000);

  let irppBrut = 0;
  for (const t of BAREME_IRPP_MENSUEL) {
    if (baseImposableIrpp > t.min) {
      const taxable = Math.min(baseImposableIrpp, t.max) - t.min;
      irppBrut += taxable * t.taux;
    }
  }
  irppBrut = Math.round(irppBrut);

  const charges = Math.min(input.nombreChargesFamille || 0, 6);
  const reductionChargeFamille = charges * 10_000;
  const irppNet = Math.max(0, irppBrut - reductionChargeFamille);
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

// ─── 1.2 IS (Impôt sur les Sociétés) & IMF ────────────────────────────────────
// CGI art. 92, 113 (IS 27%), art. 120 (MFP 1%, plancher 20 000 FCFA)
export type IsCalculationInput = {
  chiffreAffairesHt: number;
  totalProduits: number;
  totalCharges: number;
  reintegrationsFiscales?: number;
  deductionsFiscales?: number;
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

  const tauxIs = 0.27; // CGI art. 113
  const isTheorique = Math.floor((resultatFiscal * tauxIs) / 1000) * 1000;

  const tauxMfp = 0.01; // CGI art. 120 (1% du CA HT)
  const mfpTheorique = Math.max(20_000, Math.round(input.chiffreAffairesHt * tauxMfp));

  const impotRetenu = isTheorique >= mfpTheorique ? "IS" : "MFP";
  const impotExigible = Math.max(isTheorique, mfpTheorique);

  const baseAcompte = input.impotExercicePrecedent ?? impotExigible;
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

// ─── 1.3 TPV (Taxe sur les Plus-Values) — CGI art. 82-90 ──────────────────────
export type TpvInput = {
  nature: "IMMEUBLE" | "ACTION" | "TITRE_MINIER";
  prixCession: number;
  prixAcquisition: number;
  fraisAcquisition?: number;
  dureeDetentionAnnees?: number;
};

export type TpvResult = {
  plusValueBrute: number;
  abattement: number;
  plusValueNette: number;
  tauxApplique: number;
  impotTpv: number;
  article: string;
};

export function calculateTogoTPV(input: TpvInput): TpvResult {
  const coutAcquisition = input.prixAcquisition + (input.fraisAcquisition || 0);
  const plusValueBrute = Math.max(0, input.prixCession - coutAcquisition);

  // Taux : 7% pour immeubles et actions, 15% pour titres miniers (CGI art. 90)
  const taux = input.nature === "TITRE_MINIER" ? 0.15 : 0.07;
  const article = input.nature === "TITRE_MINIER" ? "CGI art. 90 (15% Titres miniers)" : "CGI art. 90 (7% Immeubles / Actions)";

  // Abattement pour durée de détention sur immeubles (CGI art. 85-89)
  let abattementPct = 0;
  if (input.nature === "IMMEUBLE" && input.dureeDetentionAnnees) {
    if (input.dureeDetentionAnnees > 10) abattementPct = 0.50;
    else if (input.dureeDetentionAnnees > 5) abattementPct = 0.30;
    else if (input.dureeDetentionAnnees > 2) abattementPct = 0.15;
  }

  const abattement = Math.round(plusValueBrute * abattementPct);
  const plusValueNette = plusValueBrute - abattement;
  const impotTpv = Math.round(plusValueNette * taux);

  return {
    plusValueBrute,
    abattement,
    plusValueNette,
    tauxApplique: taux * 100,
    impotTpv,
    article,
  };
}

// ─── 1.4 TPU (Taxe Professionnelle Unique) — CGI art. 131-139 ─────────────────
export type TpuInput = {
  typeRegime: "FORFAITAIRE" | "DECLARATIF";
  secteur: "COMMERCE" | "SERVICES" | "PRODUCTION";
  chiffreAffairesHt: number;
  anneeActivite?: number; // Exonération 24 premiers mois si enregistré au CFE (CGI art. 128)
};

export type TpuResult = {
  chiffreAffairesHt: number;
  regime: string;
  tauxOuTarif: string;
  montantAnnuel: number;
  montantTrimestriel: number;
  exonerationAppliquee: boolean;
  repartition: { collectivites: number; otr: number };
  article: string;
};

export function calculateTogoTPU(input: TpuInput): TpuResult {
  const isExonere = (input.anneeActivite ?? 3) <= 2;

  let montantAnnuel = 0;
  let tauxOuTarif = "";

  if (input.typeRegime === "FORFAITAIRE" || input.chiffreAffairesHt <= 30_000_000) {
    // Régime forfaitaire : barème par tranche de secteur
    tauxOuTarif = "Barème forfaitaire sectoriel";
    if (input.chiffreAffairesHt <= 5_000_000) montantAnnuel = 30_000;
    else if (input.chiffreAffairesHt <= 15_000_000) montantAnnuel = 80_000;
    else montantAnnuel = 180_000;
  } else {
    // Régime déclaratif (30M < CA ≤ 60M) : 2% commerce, 8% services (CGI art. 134, minimum 20 000 FCFA)
    const taux = input.secteur === "COMMERCE" || input.secteur === "PRODUCTION" ? 0.02 : 0.08;
    tauxOuTarif = input.secteur === "COMMERCE" || input.secteur === "PRODUCTION" ? "2% (Commerce/Production)" : "8% (Services)";
    montantAnnuel = Math.max(20_000, Math.round(input.chiffreAffairesHt * taux));
  }

  if (isExonere) montantAnnuel = 0;

  const montantTrimestriel = Math.round(montantAnnuel / 4);

  return {
    chiffreAffairesHt: input.chiffreAffairesHt,
    regime: input.typeRegime,
    tauxOuTarif,
    montantAnnuel,
    montantTrimestriel,
    exonerationAppliquee: isExonere,
    repartition: {
      collectivites: Math.round(montantAnnuel * 0.90), // 90% collectivités (CGI art. 139)
      otr: Math.round(montantAnnuel * 0.10),          // 10% OTR
    },
    article: "CGI art. 131-139",
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. IMPÔTS SYNTHÉTIQUES ET LOCAUX
// ═════════════════════════════════════════════════════════════════════════════

// ─── 2.1 Droit de Patente — CGI art. 250-255 ──────────────────────────────────
export const BAREME_PATENTE_TOGO = [
  { max: 500_000_000, tauxMin: 0.0055, tauxMax: 0.0085, label: "≤ 500M FCFA : 0,55% à 0,85%" },
  { max: 10_000_000_000, tauxMin: 0.0060, tauxMax: 0.0095, label: "500M à 10 Mrds FCFA : 0,60% à 0,95%" },
  { max: 50_000_000_000, tauxMin: 0.0065, tauxMax: 0.0100, label: "10 Mrds à 50 Mrds FCFA : 0,65% à 1,00%" },
  { max: Infinity, tauxMin: 0.0070, tauxMax: 0.0120, label: "> 50 Mrds FCFA : 0,70% à 1,20%" },
] as const;

export type PatenteInput = {
  chiffreAffairesHt: number;
  secteur?: "COMMERCE" | "SERVICES" | "INDUSTRIE" | "REVENDEDEUR_TISSUS";
  anneeActivite?: number; // Exonération 24 premiers mois (CGI art. 253)
};

export type PatenteResult = {
  chiffreAffairesHt: number;
  tauxMoyen: number;
  montantBrut: number;
  reductionRevendeurTissus: number; // 60% réduction revendeurs tissus (CGI art. 254)
  montantNet: number;
  exonerationNouvelleEntite: boolean;
  repartition: {
    etat: number;           // 30%
    collectivites: number;  // 50%
    habitat: number;        // 5%
    apprentissage: number;  // 5%
    otr: number;            // 10%
  };
  article: string;
};

export function calculateTogoPatente(input: PatenteInput): PatenteResult {
  const isExonere = (input.anneeActivite ?? 3) <= 2;
  const ca = input.chiffreAffairesHt;

  let taux = 0.0070;
  if (ca <= 500_000_000) taux = 0.0070;
  else if (ca <= 10_000_000_000) taux = 0.0080;
  else if (ca <= 50_000_000_000) taux = 0.0090;
  else taux = 0.0100;

  let montantBrut = Math.round(ca * taux);
  let reduction = 0;
  if (input.secteur === "REVENDEDEUR_TISSUS") {
    reduction = Math.round(montantBrut * 0.60); // CGI art. 254
  }

  let montantNet = isExonere ? 0 : Math.max(0, montantBrut - reduction);

  return {
    chiffreAffairesHt: ca,
    tauxMoyen: taux * 100,
    montantBrut,
    reductionRevendeurTissus: reduction,
    montantNet,
    exonerationNouvelleEntite: isExonere,
    repartition: {
      etat: Math.round(montantNet * 0.30),
      collectivites: Math.round(montantNet * 0.50),
      habitat: Math.round(montantNet * 0.05),
      apprentissage: Math.round(montantNet * 0.05),
      otr: Math.round(montantNet * 0.10),
    },
    article: "CGI art. 250-255",
  };
}

// ─── 2.2 Taxes Foncières (TFPB & TFPNB) — CGI art. 258-276 ───────────────────
export type TaxesFoncieresInput = {
  typePropriete: "BATIE" | "NON_BATIE";
  valeurLocativeCadastrale?: number; // Pour bâti (VLC)
  valeurVenale?: number;             // Pour non bâti ou bâti inscrit bilan
  isHabitationPrincipaleUnique?: boolean; // Exonération (CGI art. 261)
  isConstructionNeuveAnnees?: number;     // Exonération 2 à 5 ans (CGI art. 262)
};

export type TaxesFoncieresResult = {
  type: string;
  baseImposable: number;
  abattementGestionFrais: number; // 50% déduction pour frais (CGI art. 270)
  tauxApplicable: number;         // 7,5% du net cadastral = 3,75% de VLC (TFPB), 0,5% valeur vénale (TFPNB)
  montantTaxe: number;
  exoneration: boolean;
  motifExoneration?: string;
  article: string;
};

export function calculateTaxesFoncieres(input: TaxesFoncieresInput): TaxesFoncieresResult {
  if (input.isHabitationPrincipaleUnique) {
    return {
      type: input.typePropriete === "BATIE" ? "TFPB (Propriété Bâtie)" : "TFPNB (Non Bâtie)",
      baseImposable: 0,
      abattementGestionFrais: 0,
      tauxApplicable: 0,
      montantTaxe: 0,
      exoneration: true,
      motifExoneration: "Habitation principale unique (CGI art. 261)",
      article: "CGI art. 261",
    };
  }

  if (input.isConstructionNeuveAnnees && input.isConstructionNeuveAnnees <= 5) {
    return {
      type: "TFPB (Construction nouvelle)",
      baseImposable: 0,
      abattementGestionFrais: 0,
      tauxApplicable: 0,
      montantTaxe: 0,
      exoneration: true,
      motifExoneration: `Construction neuve (${input.isConstructionNeuveAnnees} ans / max 5 ans) — CGI art. 262`,
      article: "CGI art. 262",
    };
  }

  if (input.typePropriete === "BATIE") {
    // TFPB : 7,5% × (50% × VLC) = 3,75% × VLC (CGI art. 270, 275)
    const vlc = input.valeurLocativeCadastrale ?? (input.valeurVenale ? input.valeurVenale * 0.06 : 0);
    const abattement = Math.round(vlc * 0.50);
    const netCadastral = vlc - abattement;
    const montant = Math.round(netCadastral * 0.075);
    return {
      type: "TFPB (Taxe Foncière Propriétés Bâties)",
      baseImposable: vlc,
      abattementGestionFrais: abattement,
      tauxApplicable: 7.5,
      montantTaxe: montant,
      exoneration: false,
      article: "CGI art. 258, 270, 275 (7,5% × 50% VLC = 3,75%)",
    };
  } else {
    // TFPNB : 0,5% de la valeur vénale (CGI art. 259, 276)
    const valVenale = input.valeurVenale || 0;
    const montant = Math.round(valVenale * 0.005);
    return {
      type: "TFPNB (Taxe Foncière Propriétés Non Bâties)",
      baseImposable: valVenale,
      abattementGestionFrais: 0,
      tauxApplicable: 0.5,
      montantTaxe: montant,
      exoneration: false,
      article: "CGI art. 259, 276 (0,5% valeur vénale)",
    };
  }
}

// ─── 2.3 Taxe d'Habitation — CGI art. 296 ─────────────────────────────────────
export const TARIFS_TAXE_HABITATION = [
  { type: "CONCESSION", label: "Concession (par ménage)", montant: 4_000 },
  { type: "STUDIO", label: "Studio (appartement 1 pièce)", montant: 2_000 },
  { type: "DEUX_PIECES", label: "Appartement 2 pièces", montant: 6_000 },
  { type: "TROIS_PIECES_PLUS", label: "Appartement 3 pièces et plus", montant: 9_000 },
  { type: "VILLA", label: "Villa (concession individuelle)", montant: 30_000 },
  { type: "ETAGE_1", label: "Étage à 1 niveau", montant: 40_000 },
  { type: "ETAGE_2", label: "Étage à 2 niveaux", montant: 75_000 },
  { type: "ETAGE_PLUS", label: "Étage +2 niveaux ou > 600 m²", montant: 100_000 },
] as const;

export function calculateTaxeHabitation(typeLogement: string, isExonere = false): number {
  if (isExonere) return 0; // Exonérations : < 18 ans, retraités 60 ans+, indigents (CGI art. 292)
  const tarif = TARIFS_TAXE_HABITATION.find((t) => t.type === typeLogement);
  return tarif ? tarif.montant : 4_000;
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. TAXES SUR LE CHIFFRE D'AFFAIRES
// ═════════════════════════════════════════════════════════════════════════════

// ─── 3.1 TVA (18%) & Précompte TVA 50% — CGI art. 172-201 ─────────────────────
export type TvaCalculationInput = {
  ventesTaxablesHt: number;
  ventesExonereesHt?: number;
  achatsImmoTva: number;
  achatsBiensServicesTva: number;
  creditReportePrecedent?: number;
  prorataDeductionPct?: number;
  marchesPublicsTvaFacturee?: number; // Pour précompte 50% marchés publics (CGI art. 201)
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
  precompteMarchesPublics: number; // 50% retenu à la source par l'État
  tvaNetteDue: number;
  creditReportable: number;
};

export function calculateTogoTva(input: TvaCalculationInput): TvaCalculationResult {
  const tauxTva = 0.18; // CGI art. 195
  const tvaCollectee = Math.round(input.ventesTaxablesHt * tauxTva);
  const tvaDeductibleImmo = Math.round(input.achatsImmoTva);
  const tvaDeductibleBiensServices = Math.round(input.achatsBiensServicesTva);
  const tvaDeductibleTotale = tvaDeductibleImmo + tvaDeductibleBiensServices;

  const prorata = input.prorataDeductionPct !== undefined ? input.prorataDeductionPct : 100;
  const tvaDeductibleApresProrata = Math.round((tvaDeductibleTotale * prorata) / 100);
  const creditReporte = input.creditReportePrecedent || 0;

  const precompte = input.marchesPublicsTvaFacturee ? Math.round(input.marchesPublicsTvaFacturee * 0.50) : 0;

  const totalDeductionsEtCredits = tvaDeductibleApresProrata + creditReporte + precompte;

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
    precompteMarchesPublics: precompte,
    tvaNetteDue,
    creditReportable,
  };
}

// ─── 3.2 TAF (Taxe sur les Activités Financières) — CGI art. 214-220 ──────────
export function calculateTogoTAF(profitsBrutsBancaires: number): { base: number; taux: number; montantTaf: number; article: string } {
  const taux = 0.10; // 10% CGI art. 220
  const montantTaf = Math.round(profitsBrutsBancaires * taux);
  return {
    base: profitsBrutsBancaires,
    taux: 10,
    montantTaf,
    article: "CGI art. 214, 220 (10% sur profits bancaires bruts)",
  };
}

// ─── 3.3 TCA (Taxe sur les Conventions d'Assurance) — CGI art. 222-228 ────────
export const TAUX_TCA_TOGO = {
  NAVIGATION: { taux: 0.05, label: "Risques maritimes, fluviaux, aériens (5%)" },
  INCENDIE_BIENS_PRO: { taux: 0.20, label: "Incendie biens professionnels / activités (20%)" },
  INCENDIE_AUTRES: { taux: 0.25, label: "Incendie autres biens (25%)" },
  VIE: { taux: 0.03, label: "Assurance vie hors épargne (3%)" },
  AUTRES_TRANSPORTS: { taux: 0.06, label: "Autres transports terrestres, etc. (6%)" },
  CREDIT_EXPORT: { taux: 0.0020, label: "Crédit export (0,20%)" },
} as const;

export function calculateTogoTCA(primesAssurance: number, categorie: keyof typeof TAUX_TCA_TOGO): { primes: number; tauxPct: number; montantTca: number; article: string } {
  const cat = TAUX_TCA_TOGO[categorie] || TAUX_TCA_TOGO.AUTRES_TRANSPORTS;
  const montantTca = Math.round(primesAssurance * cat.taux);
  return {
    primes: primesAssurance,
    tauxPct: cat.taux * 100,
    montantTca,
    article: "CGI art. 222, 228",
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. IMPÔTS SPÉCIFIQUES & ACCISES
// ═════════════════════════════════════════════════════════════════════════════

// ─── 4.1 TVM (Taxe sur les Véhicules à Moteur) — CGI art. 162-170 ─────────────
export const TARIFS_TVM_TOGO = [
  { type: "MOTO_SUP_125", label: "Motocyclette > 125 cm³", tarif: 15_000 },
  { type: "MOTO_3_ROUES", label: "Motocyclette 3 roues", tarif: 40_000 },
  { type: "AUTO_INF_5_CV", label: "Véhicule < 5 CV", tarif: 5_000 },
  { type: "AUTO_5_7_CV", label: "Véhicule 5 à 7 CV", tarif: 10_000 },
  { type: "AUTO_8_11_CV", label: "Véhicule 8 à 11 CV", tarif: 15_000 },
  { type: "AUTO_12_15_CV", label: "Véhicule 12 à 15 CV", tarif: 20_000 },
  { type: "AUTO_SUP_20_CV", label: "Véhicule > 20 CV", tarif: 40_000 },
] as const;

export function calculateTogoTVM(typeVehicule: string): { tarif: number; repartition: { safer: number; tresor: number; otr: number }; article: string } {
  const item = TARIFS_TVM_TOGO.find((t) => t.type === typeVehicule) || TARIFS_TVM_TOGO[3];
  return {
    tarif: item.tarif,
    repartition: {
      safer: Math.round(item.tarif * 0.78),  // 78% SAFER entretien routier (CGI art. 170)
      tresor: Math.round(item.tarif * 0.10), // 10% Trésor
      otr: Math.round(item.tarif * 0.12),    // 12% OTR
    },
    article: "CGI art. 162, 170",
  };
}

// ─── 4.2 TETTIC, TEBA & Jeux de Hasard ─────────────────────────────────────────
export function calculateTETTIC(caServicesMobilesHt: number) {
  // 5% CGI art. 171 bis-quater (admise en déduction de la base IS)
  return {
    base: caServicesMobilesHt,
    taux: 5,
    montant: Math.round(caServicesMobilesHt * 0.05),
    deductibleIs: true,
    article: "CGI art. 171 bis-quater",
  };
}

export function calculateTEBA(nombreBilletsAvion: number) {
  // 2 000 FCFA par billet (CGI art. 235, 238)
  return {
    nombreBillets: nombreBilletsAvion,
    tarifUnitaire: 2_000,
    montant: nombreBilletsAvion * 2_000,
    article: "CGI art. 235, 238",
  };
}

export function calculateJeuxHasard(recettesBrutesOuMarge: number) {
  // 7% sur recettes brutes ou marge brute (CGI art. 230, 233)
  return {
    base: recettesBrutesOuMarge,
    taux: 7,
    montant: Math.round(recettesBrutesOuMarge * 0.07),
    article: "CGI art. 230, 233",
  };
}

// ─── 4.3 Droits d'Accises — CGI art. 241, 243 ─────────────────────────────────
export const ACCISES_PRODUITS_TOGO = [
  { code: "BIERES", label: "Bières et boissons alcoolisées", tauxPct: 20, type: "POURCENTAGE" },
  { code: "AUTRES_ALCOOLS", label: "Autres alcools (vins, spiritueux)", tauxPct: 60, type: "POURCENTAGE" },
  { code: "TABACS", label: "Produits du tabac", tauxPct: 50, type: "POURCENTAGE" },
  { code: "COSMETIQUES", label: "Parfumerie et cosmétiques", tauxPct: 15, type: "POURCENTAGE" },
  { code: "VEHICULES_13CV", label: "Véhicules de tourisme ≥ 13 CV", tauxPct: 5, type: "POURCENTAGE" },
  { code: "SUPERCARBURANT", label: "Supercarburant (par litre)", tarifFcfa: 57.76, type: "SPECIFIQUE" },
  { code: "GASOIL", label: "Gas-oil (par litre)", tarifFcfa: 48.06, type: "SPECIFIQUE" },
  { code: "PETROLE_LAMPANT", label: "Pétrole lampant (domestique)", tarifFcfa: 0.0, type: "EXONERE" },
] as const;

// ═════════════════════════════════════════════════════════════════════════════
// 5. RETENUES À LA SOURCE ET PRÉLÈVEMENTS (LIVRE IV LPF / CGI)
// ═════════════════════════════════════════════════════════════════════════════

// ─── 5.1 Retenues sur Prestations de Services (RSR & RSNR) ────────────────────
export type RsrStatus = "AVEC_ATTESTATION" | "AVEC_NIF_SANS_ATTESTATION" | "SANS_NIF";

export function calculateRSR(montantBrutPrestation: number, statut: RsrStatus): { base: number; tauxPct: number; retenueRSR: number; article: string } {
  // LPF art. 99 : 3% avec attestation de régularité fiscale, 5% avec NIF sans attestation, 20% sans NIF
  let taux = 0.05;
  if (statut === "AVEC_ATTESTATION") taux = 0.03;
  if (statut === "SANS_NIF") taux = 0.20;

  return {
    base: montantBrutPrestation,
    tauxPct: taux * 100,
    retenueRSR: Math.round(montantBrutPrestation * taux),
    article: "LPF art. 99 (RSR)",
  };
}

export function calculateRSNR(montantBrutNonResident: number): { base: number; tauxPct: number; retenueRSNR: number; article: string } {
  // LPF art. 98 : 20% sur les sommes brutes versées aux non-résidents
  const taux = 0.20;
  return {
    base: montantBrutNonResident,
    tauxPct: 20,
    retenueRSNR: Math.round(montantBrutNonResident * taux),
    article: "LPF art. 98 (RSNR 20%)",
  };
}

// ─── 5.2 Retenue sur Revenus Locatifs — LPF art. 100 ──────────────────────────
export function calculateRetenueLoyers(montantLoyerBrut: number): { base: number; tauxPct: number; retenueTotale: number; ventilationTfpb: number; ventilationIrpp: number; article: string } {
  // LPF art. 100 : 8,75% sur le montant brut des loyers (ventilé en 3,75% TFPB + 5% IRPP)
  const total = Math.round(montantLoyerBrut * 0.0875);
  const partTfpb = Math.round(montantLoyerBrut * 0.0375);
  const partIrpp = total - partTfpb;

  return {
    base: montantLoyerBrut,
    tauxPct: 8.75,
    retenueTotale: total,
    ventilationTfpb: partTfpb,
    ventilationIrpp: partIrpp,
    article: "LPF art. 100 (Retenue loyers 8,75% : 3,75% TFPB + 5% IRPP)",
  };
}

// ─── 5.3 Prélèvement BIC Douanier & Achats en Gros — LPF art. 102, 103 ─────────
export function calculatePrelevementBIC(valeurCafOuAchatGros: number, statut: "CARTE_IMMATRICULATION" | "NIF_SEUL" | "SANS_NIF") {
  // LPF art. 103 : 1% carte en cours de validité, 5% avec NIF sans carte, 20% sans NIF
  let taux = 0.05;
  if (statut === "CARTE_IMMATRICULATION") taux = 0.01;
  if (statut === "SANS_NIF") taux = 0.20;

  return {
    base: valeurCafOuAchatGros,
    tauxPct: taux * 100,
    montantPrelevement: Math.round(valeurCafOuAchatGros * taux),
    article: "LPF art. 102, 103 (Prélèvement BIC 1%, 5%, 20%)",
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. SANCTIONS & DÉFAILLANTS (LIVRE V & XIV LPF)
// ═════════════════════════════════════════════════════════════════════════════
export function calculatePenalitesRetard(montantDu: number, moisDeRetard = 1, apresMiseEnDemeure = false) {
  // LPF art. 115 : 10% pour le 1er mois + 1% par mois suivant (minimum 1 000 FCFA)
  // LPF art. 116 : Majoration 10% si dans les 15j de mise en demeure, 20% au-delà
  const majorationMois1 = Math.round(montantDu * 0.10);
  const majorationMoisSuivants = Math.max(1_000, Math.round(montantDu * 0.01 * Math.max(0, moisDeRetard - 1)));
  const penaliteMiseEnDemeure = apresMiseEnDemeure ? Math.round(montantDu * 0.20) : 0;

  const totalPenalites = majorationMois1 + majorationMoisSuivants + penaliteMiseEnDemeure;
  return {
    montantPrincipal: montantDu,
    majoration10Pct: majorationMois1,
    interet1PctParMois: majorationMoisSuivants,
    penaliteMiseEnDemeure,
    totalPenalites,
    totalExigible: montantDu + totalPenalites,
    article: "LPF art. 115, 116",
  };
}
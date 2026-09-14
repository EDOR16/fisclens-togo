/**
 * LOI DE FINANCES 2026 — RÉPUBLIQUE TOGOLAISE
 * Loi n° 2025-002 du 31 décembre 2025 portant loi de finances, exercice 2026
 * ─────────────────────────────────────────────────────────────────────────────
 * Dispositions fiscales nouvelles ou reconduites applicables au 1er janvier 2026.
 * Source : Assemblée Nationale — 1ère Législature de la Vème République.
 *
 * Toutes les fonctions exposées calculent selon les articles officiels cités.
 * Aucune n'écrase les règles de droit commun (togo-rules.ts) — elles les complètent.
 */

// ═════════════════════════════════════════════════════════════════════════════
// ARTICLE 13 — PRÉCOMPTE / RETENUE À LA SOURCE DE LA TVA
// ═════════════════════════════════════════════════════════════════════════════
// Dès le 1er janvier 2026, l'acquéreur de biens ou le bénéficiaire de services
// opère une retenue à la source de la TVA lorsque le fournisseur est identifié
// par son NIF. La TVA précomptée est déclarée sur un imprimé distinct (art. 13-4).
// La TVA précomptée n'est déductible que si elle a été préalablement déclarée (13-7).
// Pénalité : amende égale au montant des retenues non effectuées (13-10).

export type PrecompteTvaStatut =
  | "FOURNISSEUR_NIF_VALIDE"     // Retenue opérée normalement
  | "FOURNISSEUR_SANS_NIF"       // Rejet du précompte (non applicable)
  | "ETAT_OU_COLLECTIVITE";     // Cas particulier art. 13-5

export interface PrecompteTvaInput {
  montantHT: number;
  tauxTVA?: number;              // 18 par défaut
  statut: PrecompteTvaStatut;
  tvaDejaFacturee?: number;      // Si déjà connue, évite le recalcul
}

export interface PrecompteTvaResult {
  montantHT: number;
  tauxTVA: number;
  tvaFacturee: number;
  tvaPrecomptee: number;         // Montant retenu à la source par l'acquéreur
  netAPayerFournisseur: number;  // HT + TVA − précompte
  obligationDeclarative: boolean;
  article: string;
}

export function calculatePrecompteTva(input: PrecompteTvaInput): PrecompteTvaResult {
  const taux = input.tauxTVA ?? 18;
  const tvaFacturee =
    input.tvaDejaFacturee !== undefined
      ? input.tvaDejaFacturee
      : Math.round((input.montantHT * taux) / 100);

  if (input.statut !== "FOURNISSEUR_NIF_VALIDE") {
    return {
      montantHT: input.montantHT,
      tauxTVA: taux,
      tvaFacturee,
      tvaPrecomptee: 0,
      netAPayerFournisseur: input.montantHT + tvaFacturee,
      obligationDeclarative: false,
      article: "LF 2026 art. 13 (précompte TVA non applicable)",
    };
  }

  const tvaPrecomptee = tvaFacturee;
  const netAPayerFournisseur = input.montantHT;

  return {
    montantHT: input.montantHT,
    tauxTVA: taux,
    tvaFacturee,
    tvaPrecomptee,
    netAPayerFournisseur,
    obligationDeclarative: true,
    article: "LF 2026 art. 13 (précompte TVA à la source)",
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ARTICLE 14 — SUSPENSION DE LA TVM POUR VÉHICULES COMMERCIAUX (2026)
// ═════════════════════════════════════════════════════════════════════════════
// Du 1er janvier au 31 décembre 2026, la TVM est suspendue pour les véhicules
// à usage commercial affectés au transport de marchandises et de personnes.
// Reconduction annuelle à surveiller — au-delà du 31/12/2026, la TVM de droit
// commun s'applique à nouveau.

export type UsageVehicule = "COMMERCIAL_TRANSPORT" | "PRIVE" | "MIXTE";

export interface TvmSuspensionInput {
  usage: UsageVehicule;
  anneeReference?: number;      // Année à tester (défaut : année courante)
}

export interface TvmSuspensionResult {
  suspendue: boolean;
  annee: number;
  motif?: string;
  article: string;
}

export function isTvmSuspendue(input: TvmSuspensionInput): TvmSuspensionResult {
  const annee = input.anneeReference ?? new Date().getFullYear();
  const dansFenetreLF2026 = annee === 2026;

  if (input.usage === "COMMERCIAL_TRANSPORT" && dansFenetreLF2026) {
    return {
      suspendue: true,
      annee,
      motif: "Véhicule à usage commercial affecté au transport de marchandises et de personnes",
      article: "LF 2026 art. 14 (suspension TVM 2026)",
    };
  }

  return {
    suspendue: false,
    annee,
    article:
      input.usage === "COMMERCIAL_TRANSPORT"
        ? "LF 2026 art. 14 (hors fenêtre 2026 — TVM de droit commun)"
        : "CGI art. 162-170 (TVM de droit commun)",
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ARTICLE 18 — EXONÉRATION TVA PROVENDES & PRODUITS ÉLEVAGE/PÊCHE LOCAUX
// ═════════════════════════════════════════════════════════════════════════════
// Du 1er janvier au 31 décembre 2026, sont exonérés de TVA :
//   - les provendes, aliments composés et compléments destinés à l'alimentation
//     des produits locaux de l'élevage et de la pêche ;
//   - les produits locaux de l'élevage et de la pêche transformés par des
//     exploitants dûment enregistrés auprès des autorités compétentes.

export type CategorieElevagePeche =
  | "PROVENDE"
  | "ALIMENT_COMPOSE"
  | "COMPLEMENT"
  | "PRODUIT_LOCAL_TRANSFORME"
  | "AUTRE";

export interface ExonerationElevagePecheInput {
  categorie: CategorieElevagePeche;
  exploitantEnregistre?: boolean;
  anneeReference?: number;
}

export interface ExonerationElevagePecheResult {
  exonere: boolean;
  annee: number;
  motif?: string;
  article: string;
}

export function isExonerationElevagePeche(
  input: ExonerationElevagePecheInput
): ExonerationElevagePecheResult {
  const annee = input.anneeReference ?? new Date().getFullYear();

  if (annee !== 2026) {
    return {
      exonere: false,
      annee,
      article: "LF 2026 art. 18 (hors fenêtre 2026)",
    };
  }

  if (
    input.categorie === "PROVENDE" ||
    input.categorie === "ALIMENT_COMPOSE" ||
    input.categorie === "COMPLEMENT"
  ) {
    return {
      exonere: true,
      annee,
      motif: `Exonération TVA sur ${input.categorie.toLowerCase()} pour alimentation produits locaux élevage/pêche`,
      article: "LF 2026 art. 18",
    };
  }

  if (
    input.categorie === "PRODUIT_LOCAL_TRANSFORME" &&
    input.exploitantEnregistre === true
  ) {
    return {
      exonere: true,
      annee,
      motif: "Produit local élevage/pêche transformé par exploitant dûment enregistré",
      article: "LF 2026 art. 18",
    };
  }

  return {
    exonere: false,
    annee,
    article: "LF 2026 art. 18 (conditions non remplies)",
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ARTICLE 20 — CRÉDIT D'IMPÔT EMPLOI HANDICAPÉ
// ═════════════════════════════════════════════════════════════════════════════
// Du 1er janvier au 31 décembre 2026, les entreprises qui recrutent des
// personnes en situation de handicap (attestation médecin du travail) pour un
// CDD ≥ 12 mois ou un CDI bénéficient d'un crédit d'impôt de 120 000 FCFA/an
// par salarié en situation de handicap.
// Crédit non remboursable, imputable sur l'IRPP/IS ou le minimum forfaitaire
// de perception. Reportable 5 ans si maintien du salarié.

export interface CreditImpotHandicapInput {
  nombreSalariesHandicapes: number;
  contratsValides: number;      // Nombre de contrats CDD ≥ 12 mois ou CDI
  anneeReference?: number;
}

export interface CreditImpotHandicapResult {
  creditTotal: number;
  creditImputable: number;
  montantUnitaire: number;
  nombreSalariesEligibles: number;
  reportable: boolean;
  dureeReportAnnees: number;
  article: string;
}

export function calculateCreditImpotHandicap(
  input: CreditImpotHandicapInput
): CreditImpotHandicapResult {
  const MONTANT_UNITAIRE = 120_000; // FCFA/an/salarié
  const annee = input.anneeReference ?? new Date().getFullYear();

  if (annee !== 2026) {
    return {
      creditTotal: 0,
      creditImputable: 0,
      montantUnitaire: MONTANT_UNITAIRE,
      nombreSalariesEligibles: 0,
      reportable: false,
      dureeReportAnnees: 0,
      article: "LF 2026 art. 20 (hors fenêtre 2026)",
    };
  }

  const eligibles = Math.min(
    input.nombreSalariesHandicapes,
    input.contratsValides
  );

  const creditTotal = eligibles * MONTANT_UNITAIRE;

  return {
    creditTotal,
    creditImputable: creditTotal,
    montantUnitaire: MONTANT_UNITAIRE,
    nombreSalariesEligibles: eligibles,
    reportable: true,
    dureeReportAnnees: 5,
    article: "LF 2026 art. 20 (crédit d'impôt handicap — 120 000 FCFA/salarié/an)",
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ARTICLE 62 LPF — FACTURE ÉLECTRONIQUE CERTIFIÉE
// ═════════════════════════════════════════════════════════════════════════════
// Tout redevable de la TVA qui livre des biens ou rend des services à un autre
// redevable doit lui délivrer une facture électronique certifiée.
// En attendant la mise en œuvre effective, la facture normalisée papier reste
// valable. La mention "NE FACTURE PAS LA TVA" est obligatoire pour les
// établissements sous le seuil d'assujettissement.

export type TypeFacture = "ELECTRONIQUE_CERTIFIEE" | "NORMALISEE_PAPIER";

export interface FactureConformiteInput {
  typeFacture: TypeFacture;
  estAssujettiTVA: boolean;
  contientVignette: boolean;
  numeroFacture: string;
  nifEmetteur?: string;
  tauxTVA?: number;
  mentionExonere?: boolean;
  destinataireAssujetti?: boolean;
}

export interface FactureConformiteResult {
  conforme: boolean;
  erreurs: string[];
  article: string;
}

export function verifierConformiteFacture(
  input: FactureConformiteInput
): FactureConformiteResult {
  const erreurs: string[] = [];

  if (!input.numeroFacture || input.numeroFacture.trim().length === 0) {
    erreurs.push("Numéro de facture manquant (art. 64 LPF)");
  }

  if (input.typeFacture === "NORMALISEE_PAPIER" && !input.contientVignette) {
    erreurs.push("Vignette obligatoire sur facture normalisée papier (art. 64 LPF)");
  }

  if (input.estAssujettiTVA && !input.tauxTVA) {
    erreurs.push("Taux de TVA manquant pour un assujetti (art. 62 LPF)");
  }

  if (
    input.destinataireAssujetti &&
    input.typeFacture === "NORMALISEE_PAPIER"
  ) {
    erreurs.push(
      "Facture électronique certifiée obligatoire entre redevables TVA (art. 62 LPF — LF 2026)"
    );
  }

  return {
    conforme: erreurs.length === 0,
    erreurs,
    article: "LF 2026 art. 62 LPF (facture électronique certifiée)",
  };
}
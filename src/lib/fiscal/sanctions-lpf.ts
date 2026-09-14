/**
 * SANCTIONS FISCALES — LIVRE DES PROCÉDURES FISCALES TOGO
 * ─────────────────────────────────────────────────────────────────────────────
 * Barèmes officiels des majorations, amendes et intérêts de retard
 * applicables en cas de contrôle ou redressement fiscal (LPF Titre IV).
 *
 * Ces calculs sont utilisés pour la simulation préventive : le contribuable
 * peut estimer son exposition avant un contrôle OTR.
 *
 * ⚠️ Ce module NE déclenche PAS de redressement — il calcule une exposition
 * théorique pour information. Toute décision relève de l'OTR.
 */

// ═════════════════════════════════════════════════════════════════════════════
// MAJORATIONS SUR DROITS RAPPELÉS
// ═════════════════════════════════════════════════════════════════════════════

export type TypeManquement =
  | "DECLARATION_INSUFFISANTE_BONNE_FOI"  // 25% si insuffisance ≥ 1/10
  | "DECLARATION_INSUFFISANTE_MAUVAISE_FOI" // 40% si mauvaise foi
  | "RETARD_PAIEMENT"                     // 10% + 1%/mois
  | "DEFAUT_DECLARATION"                  // Amende fixe selon catégorie
  | "REFUS_COMMUNICATION"                 // Amende 2M/4M FCFA
  | "PRETE_NOM"                           // 50% des sommes
  | "DEFAUT_REVERSEMENT_RAS"              // 100% des retenues
  | "BENEFICIAIRES_EFFECTIFS";            // 2M à 20M FCFA

export interface CalculSanctionInput {
  type: TypeManquement;
  baseDroitsRappeles: number;              // Droits éludés (FCFA)
  moisDeRetard?: number;                   // Nombre de mois (pour retard)
  apresMiseEnDemeure?: boolean;            // Majoration +10%
  insuffisancePct?: number;                // Pour déclaration insuffisante
  montantRetenuesNonEffectuees?: number;   // Pour défaut RAS
  dividendesVerses?: number;               // Pour bénéficiaires effectifs
}

export interface CalculSanctionResult {
  type: TypeManquement;
  baseImposable: number;
  majorationPct: number;
  majorationFcfa: number;
  amendeFixe: number;
  interetRetard: number;
  totalSanction: number;
  totalAvecDroits: number;
  article: string;
  commentaire: string;
}

const SEUIL_INSUFFISANCE_DIXIEME = 0.1; // 1/10 du bénéfice imposable
const MINIMUM_INTERET_MENSUEL = 1_000;  // FCFA

export function calculerSanction(input: CalculSanctionInput): CalculSanctionResult {
  const base = input.baseDroitsRappeles;

  switch (input.type) {
    case "DECLARATION_INSUFFISANTE_BONNE_FOI": {
      const estInsuffisanceMajeure =
        (input.insuffisancePct ?? 0) >= SEUIL_INSUFFISANCE_DIXIEME;
      const majorationPct = estInsuffisanceMajeure ? 25 : 0;
      const majoration = Math.round(base * (majorationPct / 100));
      return {
        type: input.type,
        baseImposable: base,
        majorationPct,
        majorationFcfa: majoration,
        amendeFixe: 0,
        interetRetard: 0,
        totalSanction: majoration,
        totalAvecDroits: base + majoration,
        article: "LPF art. 115 & 116",
        commentaire: estInsuffisanceMajeure
          ? "Insuffisance ≥ 1/10 du bénéfice imposable — majoration 25%"
          : "Insuffisance < 1/10 — pas de majoration",
      };
    }

    case "DECLARATION_INSUFFISANTE_MAUVAISE_FOI": {
      const majorationPct = 40;
      const majoration = Math.round(base * (majorationPct / 100));
      return {
        type: input.type,
        baseImposable: base,
        majorationPct,
        majorationFcfa: majoration,
        amendeFixe: 0,
        interetRetard: 0,
        totalSanction: majoration,
        totalAvecDroits: base + majoration,
        article: "LPF art. 117",
        commentaire: "Mauvaise foi établie — majoration 40%",
      };
    }

    case "RETARD_PAIEMENT": {
      const mois = input.moisDeRetard ?? 1;
      const majorationMois1 = Math.round(base * 0.10);
      const majorationMoisSuivants = Math.max(
        MINIMUM_INTERET_MENSUEL,
        Math.round(base * 0.01 * Math.max(0, mois - 1))
      );
      const majorationMED = input.apresMiseEnDemeure
        ? Math.round(base * 0.10)
        : 0;
      const total = majorationMois1 + majorationMoisSuivants + majorationMED;
      return {
        type: input.type,
        baseImposable: base,
        majorationPct: 10,
        majorationFcfa: majorationMois1,
        amendeFixe: 0,
        interetRetard: majorationMoisSuivants + majorationMED,
        totalSanction: total,
        totalAvecDroits: base + total,
        article: "LPF art. 115",
        commentaire: `Retard de ${mois} mois — 10% + 1%/mois${input.apresMiseEnDemeure ? " + 10% MED" : ""}`,
      };
    }

    case "DEFAUT_DECLARATION": {
      const amendeFixe = 150_000; // Direction des Grandes Entreprises
      return {
        type: input.type,
        baseImposable: base,
        majorationPct: 0,
        majorationFcfa: 0,
        amendeFixe,
        interetRetard: 0,
        totalSanction: amendeFixe,
        totalAvecDroits: base + amendeFixe,
        article: "LPF art. 113",
        commentaire:
          "Amende 25 000 à 150 000 FCFA selon catégorie (150 000 pour DGE)",
      };
    }

    case "REFUS_COMMUNICATION": {
      const amendeFixe = input.apresMiseEnDemeure ? 4_000_000 : 2_000_000;
      return {
        type: input.type,
        baseImposable: base,
        majorationPct: 0,
        majorationFcfa: 0,
        amendeFixe,
        interetRetard: 0,
        totalSanction: amendeFixe,
        totalAvecDroits: base + amendeFixe,
        article: "LPF art. 123",
        commentaire: input.apresMiseEnDemeure
          ? "Refus après mise en demeure 7 jours — 4M FCFA"
          : "Refus de communication — 2M FCFA",
      };
    }

    case "PRETE_NOM": {
      const majorationPct = 50;
      const majoration = Math.round(base * (majorationPct / 100));
      return {
        type: input.type,
        baseImposable: base,
        majorationPct,
        majorationFcfa: majoration,
        amendeFixe: 0,
        interetRetard: 0,
        totalSanction: majoration,
        totalAvecDroits: base + majoration,
        article: "LPF art. 125-1",
        commentaire: "Travestissement d'identité ou prête-nom — 50% des sommes",
      };
    }

    case "DEFAUT_REVERSEMENT_RAS": {
      const montantRetenues =
        input.montantRetenuesNonEffectuees ?? base;
      return {
        type: input.type,
        baseImposable: montantRetenues,
        majorationPct: 100,
        majorationFcfa: montantRetenues,
        amendeFixe: 0,
        interetRetard: 0,
        totalSanction: montantRetenues,
        totalAvecDroits: montantRetenues * 2,
        article: "LPF art. 131",
        commentaire:
          "Amende égale au montant des retenues non effectuées (100%)",
      };
    }

    case "BENEFICIAIRES_EFFECTIFS": {
      const dividendes = input.dividendesVerses ?? base;
      const amendeFixe = Math.min(
        20_000_000,
        Math.max(2_000_000, Math.round(dividendes * 0.05))
      );
      return {
        type: input.type,
        baseImposable: dividendes,
        majorationPct: 0,
        majorationFcfa: 0,
        amendeFixe,
        interetRetard: 0,
        totalSanction: amendeFixe,
        totalAvecDroits: dividendes + amendeFixe,
        article: "LPF art. 123",
        commentaire:
          "Défaut de déclaration des bénéficiaires effectifs — 2M à 20M FCFA",
      };
    }

    default: {
      return {
        type: input.type,
        baseImposable: base,
        majorationPct: 0,
        majorationFcfa: 0,
        amendeFixe: 0,
        interetRetard: 0,
        totalSanction: 0,
        totalAvecDroits: base,
        article: "LPF Titre IV",
        commentaire: "Type de manquement non reconnu",
      };
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SIMULATION GLOBALE — Exposition totale à un contrôle OTR
// ═════════════════════════════════════════════════════════════════════════════

export interface SimulationControleInput {
  droitsRappeles: number;
  moisDeRetard: number;
  apresMiseEnDemeure?: boolean;
  insuffisancePct?: number;
  mauvaiseFoi?: boolean;
  refusCommunication?: boolean;
  preteNom?: boolean;
  montantRetenuesNonEffectuees?: number;
  dividendesVerses?: number;
}

export interface SimulationControleResult {
  droitsRappeles: number;
  sanctions: CalculSanctionResult[];
  totalSanctions: number;
  totalExigible: number;
}

export function simulerControleOTR(
  input: SimulationControleInput
): SimulationControleResult {
  const sanctions: CalculSanctionResult[] = [];

  // 1. Majoration principale (insuffisance ou mauvaise foi)
  if (input.mauvaiseFoi) {
    sanctions.push(
      calculerSanction({
        type: "DECLARATION_INSUFFISANTE_MAUVAISE_FOI",
        baseDroitsRappeles: input.droitsRappeles,
      })
    );
  } else if (input.insuffisancePct && input.insuffisancePct >= 0.1) {
    sanctions.push(
      calculerSanction({
        type: "DECLARATION_INSUFFISANTE_BONNE_FOI",
        baseDroitsRappeles: input.droitsRappeles,
        insuffisancePct: input.insuffisancePct,
      })
    );
  }

  // 2. Retard de paiement
  sanctions.push(
    calculerSanction({
      type: "RETARD_PAIEMENT",
      baseDroitsRappeles: input.droitsRappeles,
      moisDeRetard: input.moisDeRetard,
      apresMiseEnDemeure: input.apresMiseEnDemeure,
    })
  );

  // 3. Refus de communication
  if (input.refusCommunication) {
    sanctions.push(
      calculerSanction({
        type: "REFUS_COMMUNICATION",
        baseDroitsRappeles: 0,
        apresMiseEnDemeure: input.apresMiseEnDemeure,
      })
    );
  }

  // 4. Prête-nom
  if (input.preteNom) {
    sanctions.push(
      calculerSanction({
        type: "PRETE_NOM",
        baseDroitsRappeles: input.droitsRappeles,
      })
    );
  }

  // 5. Défaut reversement RAS
  if (
    input.montantRetenuesNonEffectuees &&
    input.montantRetenuesNonEffectuees > 0
  ) {
    sanctions.push(
      calculerSanction({
        type: "DEFAUT_REVERSEMENT_RAS",
        baseDroitsRappeles: 0,
        montantRetenuesNonEffectuees: input.montantRetenuesNonEffectuees,
      })
    );
  }

  // 6. Bénéficiaires effectifs
  if (input.dividendesVerses && input.dividendesVerses > 0) {
    sanctions.push(
      calculerSanction({
        type: "BENEFICIAIRES_EFFECTIFS",
        baseDroitsRappeles: 0,
        dividendesVerses: input.dividendesVerses,
      })
    );
  }

  const totalSanctions = sanctions.reduce((s, x) => s + x.totalSanction, 0);

  return {
    droitsRappeles: input.droitsRappeles,
    sanctions,
    totalSanctions,
    totalExigible: input.droitsRappeles + totalSanctions,
  };
}
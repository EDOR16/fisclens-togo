/**
 * Moteur de Détection d'Anomalies FiscLens Togo
 * ─────────────────────────────────────────────────────────────────────────────
 * Référentiel réglementaire officiel :
 * - Livre des Procédures Fiscales du Togo (LPF) — Art. 124, 202 à 338 (Contrôle et sanctions)
 * - Code Général des Impôts du Togo (CGI) — Art. 113, 114, 120, 195 (IS, MFP, TVA, Acomptes)
 * - Acte Uniforme SYSCOHADA Révisé (Principe de la partie double et plan de comptes)
 */

import {
  TypeAnomalie,
  SeveriteAnomalie,
  StatutAnomalie,
} from "@prisma/client";

export interface RawEcritureForAudit {
  id: string;
  journal: string; // ACHATS, VENTES, BANQUE, CAISSE, OD, PAIE
  date: string; // YYYY-MM-DD
  piece: string;
  libelle?: string | null;
  status: string;
  documentUrl?: string | null;
  documentName?: string | null;
  lines: Array<{
    id?: string;
    accountCode: string;
    libelle: string;
    debit: number;
    credit: number;
  }>;
}

export interface RawSaleForAudit {
  id: string;
  date: string;
  refFacture: string;
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
  client?: {
    code: string;
    name: string;
  } | null;
}

export interface AnomalyReportItem {
  type: TypeAnomalie;
  severite: SeveriteAnomalie;
  description: string;
  ecritureId?: string;
  factureRef?: string;
  compteConcerne?: string;
  montantImpact?: number;
  metadata?: Record<string, any>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. MAPPING SYSCOHADA DES COMPTES AUTORISÉS PAR JOURNAL
// ─────────────────────────────────────────────────────────────────────────────

const JOURNAL_ACCOUNT_RULES: Record<
  string,
  {
    allowedPrefixes: string[];
    mandatoryPrefixes?: string[];
    label: string;
  }
> = {
  ACHATS: {
    label: "Journal des Achats & Frais généraux",
    allowedPrefixes: [
      "60", // Achats de marchandises et fournitures
      "61", // Transports
      "62", // Services extérieurs (loyers, entretien)
      "63", // Autres services (assurances, télécom)
      "64", // Impôts et taxes d'exploitation
      "65", // Autres charges
      "21", "22", "23", "24", // Immobilisations corporelles/incorporelles
      "401", "402", "404", "408", // Dettes fournisseurs
      "409", // Fournisseurs débiteurs / avances
      "442", "445", "447", // TVA déductible et retenues fiscales
      "471", "472", // Comptes d'attente
    ],
  },
  VENTES: {
    label: "Journal des Ventes & Facturation clients",
    allowedPrefixes: [
      "70", // Ventes de marchandises et services
      "71", "72", "75", "77", // Produits accessoires
      "411", "412", "416", "418", // Créances clients
      "419", // Clients créditeurs (avances reçues)
      "443", // État, TVA collectée sur ventes
      "471", "472", // Comptes d'attente
    ],
  },
  BANQUE: {
    label: "Journal de Banque (Règlements & Encaissements)",
    allowedPrefixes: [
      "52", // Comptes Banque (Ecobank, Orabank, etc.)
      "58", // Virements internes
      "401", "402", "404", // Règlements fournisseurs
      "411", "412", // Encaissements clients
      "421", "431", "447", // Règlements paie, CNSS, impôts
      "631", "67", // Frais bancaires et financiers
      "75", // Intérêts et produits financiers
      "471", "472",
    ],
    mandatoryPrefixes: ["52"],
  },
  CAISSE: {
    label: "Journal de Caisse (Espèces)",
    allowedPrefixes: [
      "57", // Caisse
      "58", // Virements internes
      "401", "411", "421", // Règlements comptant
      "604", "605", "62", "63", // Menues dépenses de bureau
      "471", "472",
    ],
    mandatoryPrefixes: ["57"],
  },
  PAIE: {
    label: "Journal des Salaires & Charges Sociales",
    allowedPrefixes: [
      "661", "662", "663", "664", // Rémunérations et charges patronales
      "421", "422", "428", // Personnel net à payer
      "431", "432", // CNSS & AMU Togo
      "447", // Retenue à la source IRPP salaires
      "471", "472",
    ],
  },
  OD: {
    label: "Journal des Opérations Diverses & Clôture",
    allowedPrefixes: [
      "1", "2", "3", "4", "5", "6", "7", "8", // Toutes classes admises en OD
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. FONCTIONS DE CONTRÔLE MÉTIER INDIVIDUELLES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Contrôle 1 : Équilibre strict de chaque écriture (Partie double SYSCOHADA)
 */
export function checkEcritureBalance(ec: RawEcritureForAudit): AnomalyReportItem | null {
  const totalDebit = ec.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = ec.lines.reduce((s, l) => s + l.credit, 0);

  if (totalDebit !== totalCredit || totalDebit <= 0) {
    const ecart = Math.abs(totalDebit - totalCredit);
    return {
      type: TypeAnomalie.ECRITURE_DESEQUILIBREE,
      severite: SeveriteAnomalie.BLOQUANT,
      description: `Écriture "${ec.piece}" (${ec.journal}) déséquilibrée : Total Débit (${totalDebit.toLocaleString("fr-FR")} FCFA) ≠ Total Crédit (${totalCredit.toLocaleString("fr-FR")} FCFA). Écart : ${ecart.toLocaleString("fr-FR")} FCFA.`,
      ecritureId: ec.id,
      factureRef: ec.piece,
      montantImpact: ecart,
      metadata: { totalDebit, totalCredit, ecart },
    };
  }
  return null;
}

/**
 * Contrôle 2 : Comptes SYSCOHADA hors mapping du journal
 */
export function checkJournalAccountMapping(ec: RawEcritureForAudit): AnomalyReportItem[] {
  const anomalies: AnomalyReportItem[] = [];
  const rule = JOURNAL_ACCOUNT_RULES[ec.journal];
  if (!rule) return anomalies;

  // Vérifier les préfixes interdits pour ce journal
  for (const line of ec.lines) {
    const isAllowed = rule.allowedPrefixes.some((prefix) =>
      line.accountCode.startsWith(prefix)
    );
    if (!isAllowed) {
      anomalies.push({
        type: TypeAnomalie.COMPTE_HORS_MAPPING_JOURNAL,
        severite: SeveriteAnomalie.AVERTISSEMENT,
        description: `Compte SYSCOHADA ${line.accountCode} (${line.libelle}) non autorisé dans le ${rule.label}. Risque de mauvaise imputation comptable.`,
        ecritureId: ec.id,
        factureRef: ec.piece,
        compteConcerne: line.accountCode,
        montantImpact: line.debit || line.credit,
        metadata: { accountCode: line.accountCode, journal: ec.journal },
      });
    }
  }

  // Vérifier la présence obligatoire d'un compte de trésorerie (ex: 521 en BANQUE, 571 en CAISSE)
  if (rule.mandatoryPrefixes) {
    const hasMandatory = ec.lines.some((line) =>
      rule.mandatoryPrefixes!.some((prefix) => line.accountCode.startsWith(prefix))
    );
    if (!hasMandatory) {
      anomalies.push({
        type: TypeAnomalie.COMPTE_HORS_MAPPING_JOURNAL,
        severite: SeveriteAnomalie.BLOQUANT,
        description: `L'écriture "${ec.piece}" dans le ${rule.label} ne mouvement aucun compte obligatoire (${rule.mandatoryPrefixes.join(", ")}).`,
        ecritureId: ec.id,
        factureRef: ec.piece,
        metadata: { mandatory: rule.mandatoryPrefixes, journal: ec.journal },
      });
    }
  }

  return anomalies;
}

/**
 * Contrôle 3 : Doublons de pièces justificatives ou factures (LPF art. 124)
 */
export function checkDuplicatePieces(
  ecritures: RawEcritureForAudit[]
): AnomalyReportItem[] {
  const anomalies: AnomalyReportItem[] = [];
  const pieceOccurrences = new Map<string, RawEcritureForAudit[]>();

  for (const ec of ecritures) {
    const key = ec.piece.trim().toUpperCase();
    if (!key || key === "—" || key === "SANS-PIECE") continue;
    const list = pieceOccurrences.get(key) || [];
    list.push(ec);
    pieceOccurrences.set(key, list);
  }

  for (const [piece, list] of pieceOccurrences.entries()) {
    if (list.length > 1) {
      // Une anomalie synthétique avec référence vers la première écriture dupliquée
      const ecDup = list[1]!;
      const totalDebit = ecDup.lines.reduce((s, l) => s + l.debit, 0);
      anomalies.push({
        type: TypeAnomalie.FACTURE_NUMERO_DUPLIQUE,
        severite: SeveriteAnomalie.BLOQUANT,
        description: `Numéro de pièce "${piece}" utilisé sur ${list.length} écritures distinctes. Risque majeur de double comptabilisation ou facturation de complaisance (art. 124 LPF).`,
        ecritureId: ecDup.id,
        factureRef: piece,
        montantImpact: totalDebit,
        metadata: {
          piece,
          occurrencesCount: list.length,
          ecritureIds: list.map((e) => e.id),
        },
      });
    }
  }

  return anomalies;
}

/**
 * Contrôle 4 : Trous de séquence dans la numérotation des pièces (LPF art. 124)
 */
export function checkSequenceGaps(
  ecritures: RawEcritureForAudit[]
): AnomalyReportItem[] {
  const anomalies: AnomalyReportItem[] = [];
  // Grouper par préfixe de numérotation (ex: FAC-ACH-2026, FAC-VTE-2026)
  const sequenceGroups = new Map<string, Array<{ num: number; piece: string; ecId: string }>>();

  for (const ec of ecritures) {
    // Reconnaître les formats standards : PREFIX-NUM (ex: FAC-VTE-2026-0801 ou FAC-001)
    const match = ec.piece.match(/^(.*?)(\d{3,6})$/);
    if (match) {
      const prefix = match[1]!;
      const num = parseInt(match[2]!, 10);
      const list = sequenceGroups.get(prefix) || [];
      list.push({ num, piece: ec.piece, ecId: ec.id });
      sequenceGroups.set(prefix, list);
    }
  }

  for (const [prefix, items] of sequenceGroups.entries()) {
    if (items.length < 2) continue;
    // Trier par numéro croissant
    items.sort((a, b) => a.num - b.num);

    for (let i = 0; i < items.length - 1; i++) {
      const current = items[i]!;
      const next = items[i + 1]!;
      const diff = next.num - current.num;
      if (diff > 1 && diff <= 10) {
        // Trou de séquence détecté
        anomalies.push({
          type: TypeAnomalie.NUMEROTATION_NON_CONTINUE,
          severite: SeveriteAnomalie.AVERTISSEMENT,
          description: `Rupture de séquence détectée dans la série ${prefix} : saut de ${current.piece} à ${next.piece} (${diff - 1} numéro(s) manquant(s)). Art. 124 LPF togolais.`,
          ecritureId: next.ecId,
          factureRef: next.piece,
          metadata: { prefix, previous: current.piece, current: next.piece, gap: diff - 1 },
        });
      }
    }
  }

  return anomalies;
}

/**
 * Contrôle 5 : Validité du NIF Togolais (Commissariat des Impôts OTR)
 */
export function validateTogoNIF(nif: string): boolean {
  if (!nif) return false;
  const cleaned = nif.replace(/[\s\-_]/g, "");
  // Format standard OTR Togo : 9 à 12 chiffres
  return /^\d{9,12}$/.test(cleaned);
}

/**
 * Contrôle 6 : Écart déclaratif TVA (Ventes réelles vs TVA Déclarée)
 */
export function checkEcartTva(
  totalTvaVentesReelles: number,
  totalTvaDeclaree: number
): AnomalyReportItem | null {
  const ecart = Math.abs(totalTvaVentesReelles - totalTvaDeclaree);
  if (ecart > 1000) {
    // Écart significatif (> 1000 FCFA)
    return {
      type: TypeAnomalie.ECART_TVA_DECLAREE_VS_COLLECTEE,
      severite: SeveriteAnomalie.BLOQUANT,
      description: `Écart déclaratif TVA détecté : TVA collectée en comptabilité (${totalTvaVentesReelles.toLocaleString("fr-FR")} FCFA) ≠ TVA reportée sur la déclaration OTR (${totalTvaDeclaree.toLocaleString("fr-FR")} FCFA). Écart : ${ecart.toLocaleString("fr-FR")} FCFA.`,
      montantImpact: ecart,
      metadata: { totalTvaVentesReelles, totalTvaDeclaree, ecart },
    };
  }
  return null;
}

/**
 * Contrôle 7 : Écritures enregistrées le week-end (samedi/dimanche)
 */
export function checkWeekendEntries(ecritures: RawEcritureForAudit[]): AnomalyReportItem[] {
  const anomalies: AnomalyReportItem[] = [];

  for (const ec of ecritures) {
    const d = new Date(ec.date);
    if (!isNaN(d.getTime())) {
      const day = d.getDay(); // 0 = Dimanche, 6 = Samedi
      if (day === 0 || day === 6) {
        const jourNom = day === 0 ? "Dimanche" : "Samedi";
        const montantTotal = ec.lines.reduce((s, l) => s + l.debit, 0);
        anomalies.push({
          type: TypeAnomalie.COMPTE_HORS_MAPPING_JOURNAL, // Catégorisé non-conformité opérationnelle
          severite: SeveriteAnomalie.INFO,
          description: `Écriture "${ec.piece}" enregistrée un ${jourNom} (${ec.date}) pour un montant de ${montantTotal.toLocaleString("fr-FR")} FCFA. À justifier lors d'un contrôle OTR.`,
          ecritureId: ec.id,
          factureRef: ec.piece,
          montantImpact: montantTotal,
          metadata: { date: ec.date, dayOfWeek: jourNom },
        });
      }
    }
  }

  return anomalies;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. AUDIT GLOBAL ET CONSOLIDATION
// ─────────────────────────────────────────────────────────────────────────────

export interface FullAuditResult {
  total: number;
  bloquantes: number;
  avertissements: number;
  infos: number;
  anomalies: AnomalyReportItem[];
  scoreConformite: number; // 0 à 100
}

export function runFullAnomalyDetection(
  ecritures: RawEcritureForAudit[],
  sales?: RawSaleForAudit[],
  declaredTvaAmount?: number
): FullAuditResult {
  const anomalies: AnomalyReportItem[] = [];

  // 1. Équilibre et mapping par écriture
  for (const ec of ecritures) {
    const unbal = checkEcritureBalance(ec);
    if (unbal) anomalies.push(unbal);

    const mappingIssues = checkJournalAccountMapping(ec);
    anomalies.push(...mappingIssues);
  }

  // 2. Doublons de pièces
  const dupes = checkDuplicatePieces(ecritures);
  anomalies.push(...dupes);

  // 3. Trous de séquence
  const gaps = checkSequenceGaps(ecritures);
  anomalies.push(...gaps);

  // 4. Écritures de week-end
  const weekend = checkWeekendEntries(ecritures);
  anomalies.push(...weekend);

  // 5. Rapprochement TVA si ventes disponibles
  if (sales && declaredTvaAmount !== undefined) {
    const totalTvaSales = sales.reduce((s, x) => s + x.montantTVA, 0);
    const tvaGap = checkEcartTva(totalTvaSales, declaredTvaAmount);
    if (tvaGap) anomalies.push(tvaGap);
  }

  const bloquantes = anomalies.filter(
    (a) => a.severite === SeveriteAnomalie.BLOQUANT
  ).length;
  const avertissements = anomalies.filter(
    (a) => a.severite === SeveriteAnomalie.AVERTISSEMENT
  ).length;
  const infos = anomalies.filter(
    (a) => a.severite === SeveriteAnomalie.INFO
  ).length;

  // Calcul d'un score de conformité pondéré (100 = parfait)
  // Chaque bloquant coûte 15 pts, chaque avertissement 5 pts, chaque info 1 pt
  const malus = bloquantes * 15 + avertissements * 5 + infos * 1;
  const scoreConformite = Math.max(0, 100 - malus);

  return {
    total: anomalies.length,
    bloquantes,
    avertissements,
    infos,
    anomalies,
    scoreConformite,
  };
}

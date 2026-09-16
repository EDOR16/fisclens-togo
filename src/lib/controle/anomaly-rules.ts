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
/**
 * Tokenisation robuste pour comparaison de noms de tiers.
 * Découpe AVANT normalisation pour préserver les frontières camelCase
 * et gérer les accents français (COMPAORÉ → compaore).
 */
function tokeniserNom(s: string): Set<string> {
  const brut = s
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[\s\-\.,&'\/]+/)
    .map((t) =>
      t.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
    )
    .filter((t) => t.length >= 3);
  return new Set(brut);
}
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

export interface RunFullAuditOptions {
  sales?: RawSaleForAudit[];
  declaredTvaAmount?: number;
  comptesValides?: Set<string>;
}

export function runFullAnomalyDetection(
  ecritures: RawEcritureForAudit[],
  sales?: RawSaleForAudit[],
  declaredTvaAmount?: number,
  comptesValides?: Set<string>
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

  // 6. Comptes SYSCOHADA inexistants (si plan fourni)
  if (comptesValides && comptesValides.size > 0) {
    const comptesAnom = checkComptesExistants(ecritures, comptesValides);
    anomalies.push(...comptesAnom);
  }

  // 7. Taux sociaux incorrects (CNSS/AMU)
  const tauxSociauxAnom = checkTauxSocial(ecritures);
  anomalies.push(...tauxSociauxAnom);

  // 8. Taux de retenue sur loyers incorrects
  const tauxLoyerAnom = checkTauxRetenueLoyer(ecritures);
  anomalies.push(...tauxLoyerAnom);

  // Calcul des compteurs APRES toutes les regles
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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — RÈGLES NIVEAU FACTURE/IMPORT (ajout post-CSP)
// ─────────────────────────────────────────────────────────────────────────────

export interface RawInvoiceForAudit {
  id: string;
  source: "SALE" | "PURCHASE" | "ECRITURE";
  numeroPiece: string;
  date: string;
  tiersNom: string;
  tiersNif?: string | null;
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
  articles?: Array<{
    designation: string;
    quantity: number;
    puHT: number;
    totalHT: number;
  }>;
  imageHash?: string | null;
  sourceOcr?: boolean;
}

const TVA_TAUX_LEGAL = 18;
const TOLERANCE_ARRONDI_FCFA = 5;
const SEUIL_Z_SCORE = 3.0;
const SEUIL_ECART_TVA_PCT = 1.0;

// ─── Règle 7.1 : TVA incohérente avec le taux légal ─────────────────────────
export function checkTvaCoherence(f: RawInvoiceForAudit): AnomalyReportItem | null {
  if (f.tauxTVA !== TVA_TAUX_LEGAL) return null;
  const tvaAttendue = Math.round((f.montantHT * TVA_TAUX_LEGAL) / 100);
  const ecart = Math.abs(tvaAttendue - f.montantTVA);
  const ecartPct = f.montantHT > 0 ? (ecart / f.montantHT) * 100 : 0;

  if (ecart > TOLERANCE_ARRONDI_FCFA && ecartPct > SEUIL_ECART_TVA_PCT) {
    return {
      type: TypeAnomalie.TVA_INCOHERENTE_AVEC_TAUX,
      severite: SeveriteAnomalie.BLOQUANT,
      description: `Facture ${f.numeroPiece} (${f.tiersNom}) : TVA extraite ${f.montantTVA.toLocaleString("fr-FR")} FCFA != 18% x HT (${tvaAttendue.toLocaleString("fr-FR")} FCFA). Ecart : ${ecart.toLocaleString("fr-FR")} FCFA (${ecartPct.toFixed(2)}%).`,
      factureRef: f.numeroPiece,
      montantImpact: ecart,
      metadata: { montantHT: f.montantHT, tauxTVA: f.tauxTVA, montantTVAExtrait: f.montantTVA, tvaAttendue },
    };
  }
  return null;
}

// ─── Règle 7.2 : Qté x PU != total ligne ────────────────────────────────────
export function checkLignesMontants(f: RawInvoiceForAudit): AnomalyReportItem[] {
  const anomalies: AnomalyReportItem[] = [];
  if (!f.articles?.length) return anomalies;

  for (let i = 0; i < f.articles.length; i++) {
    const a = f.articles[i]!;
    const totalCalcule = Math.round(a.quantity * a.puHT);
    const ecart = Math.abs(totalCalcule - a.totalHT);

    if (ecart > TOLERANCE_ARRONDI_FCFA) {
      anomalies.push({
        type: TypeAnomalie.LIGNE_MONTANT_INCOHERENT,
        severite: SeveriteAnomalie.AVERTISSEMENT,
        description: `Facture ${f.numeroPiece}, ligne ${i + 1} "${a.designation}" : quantite x PU = ${totalCalcule.toLocaleString("fr-FR")} FCFA != total HT extrait ${a.totalHT.toLocaleString("fr-FR")} FCFA.`,
        factureRef: f.numeroPiece,
        montantImpact: ecart,
        metadata: { ligne: i + 1, designation: a.designation, quantity: a.quantity, puHT: a.puHT, totalHT: a.totalHT },
      });
    }
  }
  return anomalies;
}

// ─── Règle 7.3 : Image déjà importée (hash SHA-256) ─────────────────────────
export function checkImageDupliquee(
  f: RawInvoiceForAudit,
  hashesExistants: Set<string>
): AnomalyReportItem | null {
  if (!f.imageHash) return null;
  if (hashesExistants.has(f.imageHash)) {
    return {
      type: TypeAnomalie.FACTURE_IMAGE_DUPLIQUEE,
      severite: SeveriteAnomalie.BLOQUANT,
      description: `L'image de la facture ${f.numeroPiece} (${f.tiersNom}) est un doublon exact (SHA-256) d'un import precedent. Risque de double comptabilisation meme si le numero de piece a ete mal lu par l'OCR.`,
      factureRef: f.numeroPiece,
      metadata: { imageHash: f.imageHash },
    };
  }
  return null;
}

// ─── Règle 7.4 : NIF extrait != NIF connu pour ce nom ───────────────────────
export function checkNifNomCoherence(
  f: RawInvoiceForAudit,
  nifToNomConnus: Map<string, string>
): AnomalyReportItem | null {
  if (!f.tiersNif) return null;
  const nomCanonique = nifToNomConnus.get(f.tiersNif);
  if (!nomCanonique) return null;

  const tokens1 = tokeniserNom(f.tiersNom);
  const tokens2 = tokeniserNom(nomCanonique);

  const intersection = [...tokens1].filter((t) => tokens2.has(t));
  const denominateur = Math.max(tokens1.size, tokens2.size);
  const tauxSimilarite = denominateur > 0 ? intersection.length / denominateur : 0;

  if (tauxSimilarite < 0.5) {
    return {
      type: TypeAnomalie.NIF_NOM_INCOHERENT,
      severite: SeveriteAnomalie.BLOQUANT,
      description: `NIF ${f.tiersNif} deja associe a "${nomCanonique}", mais la facture ${f.numeroPiece} mentionne "${f.tiersNom}". Similarite : ${(tauxSimilarite * 100).toFixed(0)}%.`,
      factureRef: f.numeroPiece,
      metadata: { nif: f.tiersNif, nomFacture: f.tiersNom, nomCanonique, tauxSimilarite },
    };
  }
  return null;
}

// ─── Règle 7.5 : Montant anormal vs historique (double critère) ─────────────
export function checkMontantAnormal(
  f: RawInvoiceForAudit,
  historiqueMontants: number[]
): AnomalyReportItem | null {
  if (historiqueMontants.length < 5) return null;

  const tries = [...historiqueMontants].sort((a, b) => a - b);
  const mediane = tries[Math.floor(tries.length / 2)]!;

  const moyenne = historiqueMontants.reduce((s, v) => s + v, 0) / historiqueMontants.length;
  const variance = historiqueMontants.reduce((s, v) => s + Math.pow(v - moyenne, 2), 0) / historiqueMontants.length;
  const ecartType = Math.sqrt(variance);

  if (ecartType === 0 || mediane === 0) return null;

  const zScore = (f.montantHT - moyenne) / ecartType;
  const ratioMediane = f.montantHT / mediane;

  const zAnormal = Math.abs(zScore) > SEUIL_Z_SCORE;
  const ratioAnormal = ratioMediane < 0.3 || ratioMediane > 3.0;

  if (zAnormal && ratioAnormal) {
    const sens = zScore > 0 ? "eleve" : "faible";
    return {
      type: TypeAnomalie.MONTANT_ANORMAL_VS_HISTORIQUE,
      severite: SeveriteAnomalie.INFO,
      description: `Facture ${f.numeroPiece} (${f.tiersNom}) : montant HT ${f.montantHT.toLocaleString("fr-FR")} FCFA anormalement ${sens} vs historique (mediane ${mediane.toLocaleString("fr-FR")} FCFA, ratio ${ratioMediane.toFixed(2)}x, z-score ${zScore.toFixed(2)}).`,
      factureRef: f.numeroPiece,
      montantImpact: Math.abs(f.montantHT - mediane),
      metadata: { zScore, moyenne, mediane, ratioMediane, nbHistorique: historiqueMontants.length },
    };
  }
  return null;
}

// ─── Orchestrateur niveau facture ───────────────────────────────────────────
export interface InvoiceLevelContext {
  hashesExistants?: Set<string>;
  nifToNomConnus?: Map<string, string>;
  historiqueParFournisseur?: Map<string, number[]>;
}

export function runInvoiceLevelDetection(
  factures: RawInvoiceForAudit[],
  context: InvoiceLevelContext = {}
): AnomalyReportItem[] {
  const anomalies: AnomalyReportItem[] = [];
  const hashes = context.hashesExistants ?? new Set<string>();
  const nifMap = context.nifToNomConnus ?? new Map<string, string>();
  const historique = context.historiqueParFournisseur ?? new Map<string, number[]>();

  for (const f of factures) {
    const tva = checkTvaCoherence(f);
    if (tva) anomalies.push(tva);

    anomalies.push(...checkLignesMontants(f));

    const dupImg = checkImageDupliquee(f, hashes);
    if (dupImg) anomalies.push(dupImg);

    const nifNom = checkNifNomCoherence(f, nifMap);
    if (nifNom) anomalies.push(nifNom);

    const hist = historique.get(f.tiersNom) ?? historique.get(f.tiersNif ?? "");
    if (hist) {
      const anormal = checkMontantAnormal(f, hist);
      if (anormal) anomalies.push(anormal);
    }
  }

  return anomalies;
}

// ─────────────────────────────────────────────────────────────────────────────
// RÈGLES APPROFONDIES — Existence comptes, taux sociaux, taux retenues
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Règle 8.1 : Compte SYSCOHADA inexistant dans le plan comptable du dossier.
 * Détecte les comptes inventés (281830, 445600, 681300 utilisés à tort, etc.).
 */
export function checkComptesExistants(
  ecritures: RawEcritureForAudit[],
  comptesValides: Set<string>
): AnomalyReportItem[] {
  if (comptesValides.size === 0) return []; // Pas de plan chargé → skip

  const anomalies: AnomalyReportItem[] = [];
  const compteDejaVus = new Set<string>();

  for (const ec of ecritures) {
    for (const line of ec.lines) {
      const code = line.accountCode;
      if (compteDejaVus.has(code)) continue;

      // Vérifier si le compte exact OU un parent existe
      let existe = comptesValides.has(code);
      if (!existe) {
        // Tester les préfixes progressifs (ex: 601100 → 6011 → 601 → 60)
        for (let len = code.length - 1; len >= 2; len--) {
          if (comptesValides.has(code.slice(0, len))) {
            existe = true;
            break;
          }
        }
      }

      if (!existe) {
        compteDejaVus.add(code);
        anomalies.push({
          type: TypeAnomalie.COMPTE_SYSCOHADA_INEXISTANT,
          severite: SeveriteAnomalie.BLOQUANT,
          description: `Compte ${code} (${line.libelle}) introuvable dans le plan comptable SYSCOHADA du dossier. Risque de rejet par l'OTR lors du dépôt de la liasse.`,
          ecritureId: ec.id,
          factureRef: ec.piece,
          compteConcerne: code,
          montantImpact: line.debit || line.credit,
          metadata: { accountCode: code, firstSeen: ec.piece },
        });
      }
    }
  }

  return anomalies;
}

/**
 * Règle 8.2 : Taux de cotisations sociales incorrect.
 * Vérifie que 664x / 661x = 22.5% (17.5% CNSS + 5% AMU) sur les écritures PAIE.
 * Tolérance : ±2 points (arrondis).
 */
const TAUX_PATRONAL_ATTENDU = 0.225;
const TOLERANCE_TAUX_SOCIAL = 0.02;

export function checkTauxSocial(
  ecritures: RawEcritureForAudit[]
): AnomalyReportItem[] {
  const anomalies: AnomalyReportItem[] = [];

  // Grouper les écritures PAIE par pièce
  const paieParPiece = new Map<string, RawEcritureForAudit[]>();
  for (const ec of ecritures) {
    if (ec.journal !== "PAIE") continue;
    const list = paieParPiece.get(ec.piece) ?? [];
    list.push(ec);
    paieParPiece.set(ec.piece, list);
  }

  for (const [piece, ecrituresPaie] of paieParPiece.entries()) {
    let totalBrut = 0;
    let totalChargesPatronales = 0;

    for (const ec of ecrituresPaie) {
      for (const line of ec.lines) {
        // Brut : comptes 661, 662
        if (line.accountCode.startsWith("661") || line.accountCode.startsWith("662")) {
          totalBrut += line.debit - line.credit;
        }
        // Charges patronales : comptes 664, 663
        if (line.accountCode.startsWith("664") || line.accountCode.startsWith("663")) {
          totalChargesPatronales += line.debit - line.credit;
        }
      }
    }

    if (totalBrut <= 0) continue;

    const tauxApplique = totalChargesPatronales / totalBrut;
    const ecart = Math.abs(tauxApplique - TAUX_PATRONAL_ATTENDU);

    if (ecart > TOLERANCE_TAUX_SOCIAL) {
      const attendu = Math.round(totalBrut * TAUX_PATRONAL_ATTENDU);
      anomalies.push({
        type: TypeAnomalie.TAUX_SOCIAL_INCORRECT,
        severite: SeveriteAnomalie.AVERTISSEMENT,
        description: `Paie "${piece}" : taux patronal appliqué ${(tauxApplique * 100).toFixed(2)}% ≠ 22.5% attendu (CNSS 17.5% + AMU 5%). Charges comptabilisées : ${totalChargesPatronales.toLocaleString("fr-FR")} FCFA vs ${attendu.toLocaleString("fr-FR")} FCFA attendu.`,
        factureRef: piece,
        montantImpact: Math.abs(attendu - totalChargesPatronales),
        metadata: { totalBrut, totalChargesPatronales, tauxApplique, tauxAttendu: TAUX_PATRONAL_ATTENDU },
      });
    }
  }

  return anomalies;
}

/**
 * Règle 8.3 : Taux de retenue sur loyers incorrect.
 * Vérifie que 442100 / (621x + 622x) = 8.75% (3.75% TFPB + 5% IRPP).
 * Tolérance : ±0.5 point.
 */
const TAUX_RETENUE_LOYER_ATTENDU = 0.0875;
const TOLERANCE_TAUX_RETENUE = 0.005;

export function checkTauxRetenueLoyer(
  ecritures: RawEcritureForAudit[]
): AnomalyReportItem[] {
  const anomalies: AnomalyReportItem[] = [];

  // Grouper par pièce
  const pieceMap = new Map<string, RawEcritureForAudit[]>();
  for (const ec of ecritures) {
    const list = pieceMap.get(ec.piece) ?? [];
    list.push(ec);
    pieceMap.set(ec.piece, list);
  }

  for (const [piece, ecrituresPiece] of pieceMap.entries()) {
    let totalLoyer = 0;
    let totalRetenue = 0;
    let contientLoyer = false;

    for (const ec of ecrituresPiece) {
      for (const line of ec.lines) {
        // Loyer : comptes 621, 622
        if (line.accountCode.startsWith("621") || line.accountCode.startsWith("622")) {
          totalLoyer += line.debit - line.credit;
        }
        // Retenue : compte 442100
        if (line.accountCode === "442100" || line.accountCode.startsWith("4421")) {
          totalRetenue += line.credit - line.debit;
          contientLoyer = true;
        }
      }
    }

    if (!contientLoyer || totalLoyer <= 0 || totalRetenue <= 0) continue;

    const tauxApplique = totalRetenue / totalLoyer;
    const ecart = Math.abs(tauxApplique - TAUX_RETENUE_LOYER_ATTENDU);

    if (ecart > TOLERANCE_TAUX_RETENUE) {
      const attendu = Math.round(totalLoyer * TAUX_RETENUE_LOYER_ATTENDU);
      anomalies.push({
        type: TypeAnomalie.TAUX_RETENUE_INCORRECT,
        severite: SeveriteAnomalie.BLOQUANT,
        description: `Retenue loyer "${piece}" : taux appliqué ${(tauxApplique * 100).toFixed(2)}% ≠ 8.75% (LPF art. 100). Retenue comptabilisée : ${totalRetenue.toLocaleString("fr-FR")} FCFA vs ${attendu.toLocaleString("fr-FR")} FCFA attendu.`,
        factureRef: piece,
        montantImpact: Math.abs(attendu - totalRetenue),
        metadata: { totalLoyer, totalRetenue, tauxApplique, tauxAttendu: TAUX_RETENUE_LOYER_ATTENDU },
      });
    }
  }

  return anomalies;
}

/**
 * Utilitaires pour l'import de fichiers Excel
 * Traite les 4 templates : ventes, achats, clients, produits
 * Valide, détecte doublons, retourne rapport de rejet ligne par ligne
 */

import { read, utils } from "xlsx";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImportValidationError {
  row: number;
  reason: string;
}

export interface ImportResult<T> {
  success: boolean;
  imported: T[];
  errors: ImportValidationError[];
  summary: {
    total: number;
    valid: number;
    rejected: number;
  };
}

// Ventes
export interface SaleImportRow {
  date: string;
  refFacture: string;
  codeClient: string;
  codeProduit: string;
  quantité: number;
  puHT: number;
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
}

// Achats
export interface PurchaseImportRow {
  date: string;
  refCommande: string;
  codeFournisseur: string;
  codeArticle: string;
  quantité: number;
  puHT: number;
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
}

// Clients
export interface ClientImportRow {
  code: string;
  nom: string;
  segment: string;
  zoneGeo: string;
  encoursAutorise: number;
}

// Produits
export interface ProductImportRow {
  code: string;
  désignation: string;
  catégorie: string;
  prixVenteHT: number;
  coûtAchatHT: number;
  margeCible: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseExcelFile(buffer: Buffer): Record<string, unknown>[] {
  const workbook = read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("Fichier Excel vide");
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error("Feuille Excel introuvable");
  return utils.sheet_to_json(sheet, { defval: "" });
}

function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function isPositiveNumber(value: unknown): boolean {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
}

// ---------------------------------------------------------------------------
// Import Ventes
// ---------------------------------------------------------------------------

export function validateSalesImport(
  buffer: Buffer
): ImportResult<SaleImportRow> {
  const rows = parseExcelFile(buffer);
  const imported: SaleImportRow[] = [];
  const errors: ImportValidationError[] = [];
  const seenFactures = new Set<string>();

  // Colonnes obligatoires
  const requiredColumns = [
    "date",
    "refFacture",
    "codeClient",
    "codeProduit",
    "quantité",
    "puHT",
    "montantHT",
    "tauxTVA",
    "montantTVA",
    "montantTTC",
  ];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // +2 car idx commence à 0 et ligne 1 est en-tête

    // Vérifier colonnes obligatoires
    for (const col of requiredColumns) {
      if (row[col] === undefined || row[col] === "") {
        errors.push({
          row: rowNum,
          reason: `Colonne obligatoire manquante: ${col}`,
        });
        return;
      }
    }

    // Valider types et formats
    if (!isValidDate(String(row.date))) {
      errors.push({
        row: rowNum,
        reason: `Date invalide: ${row.date} (format attendu: YYYY-MM-DD)`,
      });
      return;
    }

    const quantity = Number(row.quantité);
    const puHT = Number(row.puHT);
    const montantHT = Number(row.montantHT);
    const tauxTVA = Number(row.tauxTVA);
    const montantTVA = Number(row.montantTVA);
    const montantTTC = Number(row.montantTTC);

    if (
      ![quantity, puHT, montantHT, tauxTVA, montantTVA, montantTTC].every(
        (n) => !isNaN(n) && n >= 0
      )
    ) {
      errors.push({
        row: rowNum,
        reason: "Valeurs numériques invalides (doivent être positives)",
      });
      return;
    }

    // Vérifier cohérence HT × taux = TVA
    const calculatedTVA = Math.round((montantHT * tauxTVA) / 100);
    if (Math.abs(calculatedTVA - montantTVA) > 1) {
      // Tolérance 1 FCFA pour arrondi
      errors.push({
        row: rowNum,
        reason: `Incohérence TVA: HT ${montantHT} × ${tauxTVA}% ≠ ${montantTVA}`,
      });
      return;
    }

    // Vérifier TTC
    if (Math.abs(montantHT + montantTVA - montantTTC) > 1) {
      errors.push({
        row: rowNum,
        reason: `Incohérence TTC: HT ${montantHT} + TVA ${montantTVA} ≠ ${montantTTC}`,
      });
      return;
    }

    // Détection doublons (même facture)
    const key = `${row.refFacture}`;
    if (seenFactures.has(key)) {
      errors.push({
        row: rowNum,
        reason: `Doublon détecté: facture ${row.refFacture}`,
      });
      return;
    }
    seenFactures.add(key);

    imported.push({
      date: String(row.date),
      refFacture: String(row.refFacture),
      codeClient: String(row.codeClient),
      codeProduit: String(row.codeProduit),
      quantité: quantity,
      puHT,
      montantHT,
      tauxTVA,
      montantTVA,
      montantTTC,
    });
  });

  return {
    success: errors.length === 0,
    imported,
    errors,
    summary: {
      total: rows.length,
      valid: imported.length,
      rejected: errors.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Import Achats
// ---------------------------------------------------------------------------

export function validatePurchasesImport(
  buffer: Buffer
): ImportResult<PurchaseImportRow> {
  const rows = parseExcelFile(buffer);
  const imported: PurchaseImportRow[] = [];
  const errors: ImportValidationError[] = [];
  const seenCommandes = new Set<string>();

  const requiredColumns = [
    "date",
    "refCommande",
    "codeFournisseur",
    "codeArticle",
    "quantité",
    "puHT",
    "montantHT",
    "tauxTVA",
    "montantTVA",
    "montantTTC",
  ];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;

    for (const col of requiredColumns) {
      if (row[col] === undefined || row[col] === "") {
        errors.push({
          row: rowNum,
          reason: `Colonne obligatoire manquante: ${col}`,
        });
        return;
      }
    }

    if (!isValidDate(String(row.date))) {
      errors.push({
        row: rowNum,
        reason: `Date invalide: ${row.date}`,
      });
      return;
    }

    const quantity = Number(row.quantité);
    const puHT = Number(row.puHT);
    const montantHT = Number(row.montantHT);
    const tauxTVA = Number(row.tauxTVA);
    const montantTVA = Number(row.montantTVA);
    const montantTTC = Number(row.montantTTC);

    if (
      ![quantity, puHT, montantHT, tauxTVA, montantTVA, montantTTC].every(
        (n) => !isNaN(n) && n >= 0
      )
    ) {
      errors.push({
        row: rowNum,
        reason: "Valeurs numériques invalides",
      });
      return;
    }

    const calculatedTVA = Math.round((montantHT * tauxTVA) / 100);
    if (Math.abs(calculatedTVA - montantTVA) > 1) {
      errors.push({
        row: rowNum,
        reason: `Incohérence TVA`,
      });
      return;
    }

    if (Math.abs(montantHT + montantTVA - montantTTC) > 1) {
      errors.push({
        row: rowNum,
        reason: `Incohérence TTC`,
      });
      return;
    }

    const key = `${row.refCommande}`;
    if (seenCommandes.has(key)) {
      errors.push({
        row: rowNum,
        reason: `Doublon détecté: commande ${row.refCommande}`,
      });
      return;
    }
    seenCommandes.add(key);

    imported.push({
      date: String(row.date),
      refCommande: String(row.refCommande),
      codeFournisseur: String(row.codeFournisseur),
      codeArticle: String(row.codeArticle),
      quantité: quantity,
      puHT,
      montantHT,
      tauxTVA,
      montantTVA,
      montantTTC,
    });
  });

  return {
    success: errors.length === 0,
    imported,
    errors,
    summary: {
      total: rows.length,
      valid: imported.length,
      rejected: errors.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Import Clients
// ---------------------------------------------------------------------------

export function validateClientsImport(
  buffer: Buffer
): ImportResult<ClientImportRow> {
  const rows = parseExcelFile(buffer);
  const imported: ClientImportRow[] = [];
  const errors: ImportValidationError[] = [];
  const seenCodes = new Set<string>();

  const requiredColumns = ["code", "nom", "segment", "zoneGeo", "encours_autorisé"];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;

    for (const col of requiredColumns) {
      if (row[col] === undefined || row[col] === "") {
        errors.push({
          row: rowNum,
          reason: `Colonne obligatoire manquante: ${col}`,
        });
        return;
      }
    }

    if (!isPositiveNumber(row.encours_autorisé)) {
      errors.push({
        row: rowNum,
        reason: `Encours invalide: ${row.encours_autorisé}`,
      });
      return;
    }

    const code = String(row.code);
    if (seenCodes.has(code)) {
      errors.push({
        row: rowNum,
        reason: `Doublon détecté: code client ${code}`,
      });
      return;
    }
    seenCodes.add(code);

    imported.push({
      code,
      nom: String(row.nom),
      segment: String(row.segment),
      zoneGeo: String(row.zoneGeo),
      encoursAutorise: Number(row.encours_autorisé),
    });
  });

  return {
    success: errors.length === 0,
    imported,
    errors,
    summary: {
      total: rows.length,
      valid: imported.length,
      rejected: errors.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Import Produits
// ---------------------------------------------------------------------------

export function validateProductsImport(
  buffer: Buffer
): ImportResult<ProductImportRow> {
  const rows = parseExcelFile(buffer);
  const imported: ProductImportRow[] = [];
  const errors: ImportValidationError[] = [];
  const seenCodes = new Set<string>();

  const requiredColumns = [
    "code",
    "désignation",
    "catégorie",
    "prixVenteHT",
    "coûtAchatHT",
    "margeCible",
  ];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;

    for (const col of requiredColumns) {
      if (row[col] === undefined || row[col] === "") {
        errors.push({
          row: rowNum,
          reason: `Colonne obligatoire manquante: ${col}`,
        });
        return;
      }
    }

    if (
      ![
        row.prixVenteHT,
        row.coûtAchatHT,
        row.margeCible,
      ].every((v) => isPositiveNumber(v))
    ) {
      errors.push({
        row: rowNum,
        reason: "Valeurs numériques invalides",
      });
      return;
    }

    const code = String(row.code);
    if (seenCodes.has(code)) {
      errors.push({
        row: rowNum,
        reason: `Doublon détecté: code produit ${code}`,
      });
      return;
    }
    seenCodes.add(code);

    imported.push({
      code,
      désignation: String(row.désignation),
      catégorie: String(row.catégorie),
      prixVenteHT: Number(row.prixVenteHT),
      coûtAchatHT: Number(row.coûtAchatHT),
      margeCible: Number(row.margeCible),
    });
  });

  return {
    success: errors.length === 0,
    imported,
    errors,
    summary: {
      total: rows.length,
      valid: imported.length,
      rejected: errors.length,
    },
  };
}

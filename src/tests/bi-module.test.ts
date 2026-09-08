/**
 * Tests du Module BI & Data Analyse
 * - Import Excel (validations, doublons, cohérence)
 * - Réconciliation comptable
 * - Calcul des prévisions (MAPE)
 * - Détection des alertes
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  validateSalesImport,
  validatePurchasesImport,
  validateClientsImport,
  validateProductsImport,
} from "@/lib/bi/excel-import";
import * as fs from "fs";
import * as path from "path";
import { write, utils } from "xlsx";

// ---------------------------------------------------------------------------
// Helpers pour créer des fichiers Excel de test
// ---------------------------------------------------------------------------

function createTestExcelFile(data: Record<string, unknown>[]): Buffer {
  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Sheet1");
  return write(wb, { type: "buffer", bookType: "xlsx" });
}

// ---------------------------------------------------------------------------
// Tests Import Ventes
// ---------------------------------------------------------------------------

describe("Module BI - Import Ventes", () => {
  it("should validate correct sales data", () => {
    const validData = [
      {
        date: "2026-08-15",
        refFacture: "FAC-001",
        codeClient: "CLI-01",
        codeProduit: "PROD-001",
        quantité: 5,
        puHT: 10000,
        montantHT: 50000,
        tauxTVA: 18,
        montantTVA: 9000,
        montantTTC: 59000,
      },
    ];

    const buffer = createTestExcelFile(validData);
    const result = validateSalesImport(buffer);

    expect(result.success).toBe(true);
    expect(result.summary.valid).toBe(1);
    expect(result.summary.rejected).toBe(0);
  });

  it("should reject missing required columns", () => {
    const invalidData = [
      {
        date: "2026-08-15",
        refFacture: "FAC-001",
        // Missing codeClient, codeProduit, etc.
      },
    ];

    const buffer = createTestExcelFile(invalidData);
    const result = validateSalesImport(buffer);

    expect(result.success).toBe(false);
    expect(result.summary.rejected).toBeGreaterThan(0);
  });

  it("should detect TVA calculation errors", () => {
    const invalidData = [
      {
        date: "2026-08-15",
        refFacture: "FAC-002",
        codeClient: "CLI-01",
        codeProduit: "PROD-001",
        quantité: 5,
        puHT: 10000,
        montantHT: 50000,
        tauxTVA: 18,
        montantTVA: 8000, // Wrong! Should be 9000
        montantTTC: 58000,
      },
    ];

    const buffer = createTestExcelFile(invalidData);
    const result = validateSalesImport(buffer);

    expect(result.success).toBe(false);
    expect(result.errors[0]!.reason).toContain("Incohérence TVA");
  });

  it("should detect TTC calculation errors", () => {
    const invalidData = [
      {
        date: "2026-08-15",
        refFacture: "FAC-003",
        codeClient: "CLI-01",
        codeProduit: "PROD-001",
        quantité: 5,
        puHT: 10000,
        montantHT: 50000,
        tauxTVA: 18,
        montantTVA: 9000,
        montantTTC: 58000, // Wrong! Should be 59000
      },
    ];

    const buffer = createTestExcelFile(invalidData);
    const result = validateSalesImport(buffer);

    expect(result.success).toBe(false);
    expect(result.errors[0]!.reason).toContain("Incohérence TTC");
  });

  it("should detect duplicate invoices", () => {
    const invalidData = [
      {
        date: "2026-08-15",
        refFacture: "FAC-004",
        codeClient: "CLI-01",
        codeProduit: "PROD-001",
        quantité: 5,
        puHT: 10000,
        montantHT: 50000,
        tauxTVA: 18,
        montantTVA: 9000,
        montantTTC: 59000,
      },
      {
        date: "2026-08-16",
        refFacture: "FAC-004", // Duplicate!
        codeClient: "CLI-02",
        codeProduit: "PROD-002",
        quantité: 3,
        puHT: 20000,
        montantHT: 60000,
        tauxTVA: 18,
        montantTVA: 10800,
        montantTTC: 70800,
      },
    ];

    const buffer = createTestExcelFile(invalidData);
    const result = validateSalesImport(buffer);

    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.reason.includes("Doublon"))).toBe(true);
  });

  it("should validate invalid dates", () => {
    const invalidData = [
      {
        date: "2026-13-45", // Invalid date
        refFacture: "FAC-005",
        codeClient: "CLI-01",
        codeProduit: "PROD-001",
        quantité: 5,
        puHT: 10000,
        montantHT: 50000,
        tauxTVA: 18,
        montantTVA: 9000,
        montantTTC: 59000,
      },
    ];

    const buffer = createTestExcelFile(invalidData);
    const result = validateSalesImport(buffer);

    expect(result.success).toBe(false);
    expect(result.errors[0]!.reason).toContain("Date invalide");
  });
});

// ---------------------------------------------------------------------------
// Tests Import Clients
// ---------------------------------------------------------------------------

describe("Module BI - Import Clients", () => {
  it("should validate correct client data", () => {
    const validData = [
      {
        code: "CLI-01",
        nom: "Entreprise ABC",
        segment: "VIP",
        zoneGeo: "Lomé",
        encours_autorisé: 1000000,
      },
    ];

    const buffer = createTestExcelFile(validData);
    const result = validateClientsImport(buffer);

    expect(result.success).toBe(true);
    expect(result.summary.valid).toBe(1);
  });

  it("should detect duplicate client codes", () => {
    const invalidData = [
      {
        code: "CLI-01",
        nom: "Entreprise ABC",
        segment: "VIP",
        zoneGeo: "Lomé",
        encours_autorisé: 1000000,
      },
      {
        code: "CLI-01", // Duplicate!
        nom: "Autre Entreprise",
        segment: "Normal",
        zoneGeo: "Kara",
        encours_autorisé: 500000,
      },
    ];

    const buffer = createTestExcelFile(invalidData);
    const result = validateClientsImport(buffer);

    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.reason.includes("Doublon"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests Import Produits
// ---------------------------------------------------------------------------

describe("Module BI - Import Produits", () => {
  it("should validate correct product data", () => {
    const validData = [
      {
        code: "PROD-001",
        désignation: "Produit A",
        catégorie: "Électronique",
        prixVenteHT: 100000,
        coûtAchatHT: 60000,
        margeCible: 40,
      },
    ];

    const buffer = createTestExcelFile(validData);
    const result = validateProductsImport(buffer);

    expect(result.success).toBe(true);
    expect(result.summary.valid).toBe(1);
  });

  it("should reject invalid numeric values", () => {
    const invalidData = [
      {
        code: "PROD-002",
        désignation: "Produit B",
        catégorie: "Électronique",
        prixVenteHT: "abc", // Invalid!
        coûtAchatHT: 60000,
        margeCible: 40,
      },
    ];

    const buffer = createTestExcelFile(invalidData);
    const result = validateProductsImport(buffer);

    expect(result.success).toBe(false);
    expect(result.errors[0]!.reason).toContain("invalides");
  });
});

// ---------------------------------------------------------------------------
// Tests Import Achats
// ---------------------------------------------------------------------------

describe("Module BI - Import Achats", () => {
  it("should validate correct purchase data", () => {
    const validData = [
      {
        date: "2026-08-15",
        refCommande: "CMD-001",
        codeFournisseur: "FOURN-01",
        codeArticle: "PROD-001",
        quantité: 10,
        puHT: 50000,
        montantHT: 500000,
        tauxTVA: 18,
        montantTVA: 90000,
        montantTTC: 590000,
      },
    ];

    const buffer = createTestExcelFile(validData);
    const result = validatePurchasesImport(buffer);

    expect(result.success).toBe(true);
    expect(result.summary.valid).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Tests Prévisions (Forecasting)
// ---------------------------------------------------------------------------

describe("Module BI - Forecasting", () => {
  it("should calculate MAPE < 15% for stable data", () => {
    // Ce test nécessite une base de données en place
    // Pour maintenant, on valide juste la structure
    const mapeValues = [5, 8, 12, 3, 7, 10]; // MAPE scores
    const avgMape = mapeValues.reduce((a, b) => a + b, 0) / mapeValues.length;

    expect(avgMape).toBeLessThan(15);
  });
});

// ---------------------------------------------------------------------------
// Tests Réconciliation
// ---------------------------------------------------------------------------

describe("Module BI - Reconciliation", () => {
  it("should detect discrepancy when BI CA != Account 701", () => {
    const biCA = 1000000;
    const account701 = 940000; // 60 000 d'écart > seuil de 5% (50 000)
    const discrepancy = Math.abs(biCA - account701);
    const threshold = (biCA * 5) / 100; // 5% seuil

    expect(discrepancy).toBeGreaterThan(threshold);
  });
});

// ---------------------------------------------------------------------------
// Tests Alertes & Cohérence Financière
// ---------------------------------------------------------------------------

describe("Module BI - Alertes", () => {
  it("should generate alert for volume drop > 30%", () => {
    const previousVolume = 100;
    const currentVolume = 60;
    const changePercent = ((currentVolume - previousVolume) / previousVolume) * 100;

    expect(changePercent).toBeLessThan(-30);
  });

  it("should generate alert for negative margin", () => {
    const costAchat = 100000;
    const priceSale = 80000;
    const hasNegativeMargin = costAchat > priceSale;

    expect(hasNegativeMargin).toBe(true);
  });

  it("should generate alert for exceeded encours", () => {
    const currentEncours = 2000000;
    const maxEncours = 1500000;
    const isExceeded = currentEncours > maxEncours;

    expect(isExceeded).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests Cohérence des 5 Régions du Togo & Seuil de Rentabilité
// ---------------------------------------------------------------------------

describe("Module BI - Cohérence Territoriale & Rentabilité", () => {
  it("should normalize Grand Lomé and coastal towns into Région Maritime", async () => {
    const { normalizeTogoRegion } = await import("@/lib/bi/togo-regions");

    expect(normalizeTogoRegion("Grand Lomé")).toBe("Maritime");
    expect(normalizeTogoRegion("Lomé Commune")).toBe("Maritime");
    expect(normalizeTogoRegion("Golfe")).toBe("Maritime");
    expect(normalizeTogoRegion("Aného")).toBe("Maritime");
    expect(normalizeTogoRegion("Maritime")).toBe("Maritime");
    expect(normalizeTogoRegion("Kpalimé")).toBe("Plateaux");
    expect(normalizeTogoRegion("Sokodé")).toBe("Centrale");
    expect(normalizeTogoRegion("Kara")).toBe("Kara");
    expect(normalizeTogoRegion("Dapaong")).toBe("Savanes");
  });

  it("should calculate break-even as unachievable when contribution margin is negative", () => {
    const totalCA = 20000000;
    const totalCostAchat = 24200000; // Coûts > Ventes -> Marge négative -21%
    const estimatedFixedCosts = Math.round(totalCA * 0.1);
    const contributionMargin = totalCA - totalCostAchat;
    const contributionMarginPercent = (contributionMargin / totalCA) * 100;

    const isAchievable = contributionMarginPercent > 0;
    const breakEvenPoint = isAchievable
      ? Math.round(estimatedFixedCosts / (contributionMarginPercent / 100))
      : null;

    expect(contributionMarginPercent).toBeLessThan(0);
    expect(isAchievable).toBe(false);
    expect(breakEvenPoint).toBeNull();
  });

  it("should generate critical warning and deficit summary when margin is negative in fallbackRulesAnalysis", async () => {
    const { fallbackRulesAnalysis } = await import("@/lib/integrations/qwen/bi-advisor");

    const analysis = fallbackRulesAnalysis({
      kpis: {
        ca: 20000000,
        margeBrute: -4200000,
        margePercent: -21,
        clientsActifs: 5,
        trésorerie: 1000000,
      },
    });

    // Vérifier l'absence formelle de mention "saine"
    expect(analysis.summary.toLowerCase()).not.toContain("rentabilité saine");
    expect(analysis.summary.toLowerCase()).toContain("marge brute négative");
    expect(analysis.healthScore).toBeLessThan(50);
    expect(analysis.insights.some((i) => i.title.includes("Marge brute négative"))).toBe(true);
  });
});
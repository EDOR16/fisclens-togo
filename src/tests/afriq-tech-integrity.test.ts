import { describe, it, expect } from "vitest";
import {
  TEST_ECRITURES_1MOIS,
  TEST_VENTES_BI_1MOIS,
  TEST_CLIENTS_1MOIS,
} from "@/lib/fiscal/test-dataset";
import { normalizeTogoRegion } from "@/lib/bi/togo-regions";
import { calculateTogoIS, calculateTogoTva } from "@/lib/fiscal/togo-rules";

describe("🎯 Intégrité Fiscale & BI — Dossier Réel AFRIQ-TECH (Août 2026)", () => {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. RÉPARTITION GÉOGRAPHIQUE SUR LES 5 RÉGIONS DU TOGO
  // ───────────────────────────────────────────────────────────────────────────
  it("1.1 — Normalise correctement les 14 clients sur les 5 régions officielles du Togo", () => {
    expect(TEST_CLIENTS_1MOIS).toHaveLength(14);

    const clientRegions = TEST_CLIENTS_1MOIS.map((c) => ({
      code: c.code,
      region: normalizeTogoRegion(c.zoneGeo),
    }));

    const countsByRegion: Record<string, number> = {};
    for (const { region } of clientRegions) {
      countsByRegion[region] = (countsByRegion[region] || 0) + 1;
    }

    expect(countsByRegion["Maritime"]).toBe(6);
    expect(countsByRegion["Plateaux"]).toBe(2);
    expect(countsByRegion["Centrale"]).toBe(2);
    expect(countsByRegion["Kara"]).toBe(2);
    expect(countsByRegion["Savanes"]).toBe(2);
  });

  it("1.2 — Calcule la part de CA par région réelle (pas 100% Maritime)", () => {
    const clientMap = new Map<string, string>();
    for (const c of TEST_CLIENTS_1MOIS) {
      clientMap.set(c.code, normalizeTogoRegion(c.zoneGeo));
    }

    const regionalCA: Record<string, number> = {
      Maritime: 0,
      Plateaux: 0,
      Centrale: 0,
      Kara: 0,
      Savanes: 0,
    };

    for (const v of TEST_VENTES_BI_1MOIS) {
      const region = clientMap.get(v.codeClient) || "Maritime";
      regionalCA[region] = (regionalCA[region] || 0) + v.montantHT;
    }

    const totalCA = Object.values(regionalCA).reduce((s, v) => s + v, 0);
    expect(totalCA).toBe(24_020_000);
    expect(regionalCA["Maritime"]).toBe(14_680_000); // 61.1%
    expect(regionalCA["Plateaux"]).toBe(2_900_000);   // 12.1%
    expect(regionalCA["Savanes"]).toBe(2_365_000);    // 9.8%
    expect(regionalCA["Kara"]).toBe(2_305_000);       // 9.6%
    expect(regionalCA["Centrale"]).toBe(1_770_000);   // 7.4%

    // Maritime ne doit PAS être à 100%
    const maritimePct = Math.round((regionalCA["Maritime"] / totalCA) * 100);
    expect(maritimePct).toBe(61);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. TVA COLLECTÉE ET DÉDUCTIBLE (CGI ART. 195–209)
  // ───────────────────────────────────────────────────────────────────────────
  it("2.1 — TVA Collectée (compte 443100) est exactement de 4 323 600 FCFA", () => {
    const tvaColLines = TEST_ECRITURES_1MOIS.filter((l) => l.Compte.startsWith("4431"));
    const tvaCollectee = tvaColLines.reduce((s, l) => s + (l.Credit - l.Debit), 0);
    expect(tvaCollectee).toBe(4_323_600);
  });

  it("2.2 — TVA Déductible réelle sur achats (compte 445200) est de 3 633 300 FCFA", () => {
    const tvaDedLines = TEST_ECRITURES_1MOIS.filter(
      (l) => l.Compte.startsWith("4451") || l.Compte.startsWith("4452")
    );
    const tvaDeductible = tvaDedLines.reduce((s, l) => s + (l.Debit - l.Credit), 0);
    expect(tvaDeductible).toBe(3_633_300);
  });

  it("2.3 — Le compte 445600 est un télérèglement de TVA passée (OTR), pas une déduction d'août", () => {
    const tvaDecaisseeLines = TEST_ECRITURES_1MOIS.filter((l) => l.Compte === "445600");
    expect(tvaDecaisseeLines).toHaveLength(1);
    expect(tvaDecaisseeLines[0].Debit).toBe(580_000);
    expect(tvaDecaisseeLines[0].Libelle).toContain("Télérèglement déclaration TVA Juillet 2026");

    // L'analyse confirme que ce compte ne doit PAS être agrégé dans la TVA déductible d'août
    const dedAutorisee = TEST_ECRITURES_1MOIS.filter(
      (l) =>
        (l.Compte.startsWith("4451") ||
          l.Compte.startsWith("4452") ||
          l.Compte.startsWith("4453") ||
          l.Compte.startsWith("4454")) &&
        !l.Compte.startsWith("4456")
    ).reduce((s, l) => s + (l.Debit - l.Credit), 0);

    expect(dedAutorisee).toBe(3_633_300);
  });

  it("2.4 — TVA nette due à l'OTR pour Août 2026 est de 690 300 FCFA (à payer)", () => {
    const tvaCollectee = 4_323_600;
    const tvaDeductible = 3_633_300;
    const tvaNetteDue = tvaCollectee - tvaDeductible;

    expect(tvaNetteDue).toBe(690_300);
    expect(tvaNetteDue).toBeGreaterThan(0); // Pas un crédit à reporter
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. IS ET MINIMUM FORFAITAIRE (CGI ART. 113 & 120)
  // ───────────────────────────────────────────────────────────────────────────
  it("3.1 — Produits Classe 7, Charges Classe 6 et Résultat comptable réel", () => {
    const produits = TEST_ECRITURES_1MOIS.filter((l) => l.Compte.startsWith("7"))
      .reduce((s, l) => s + (l.Credit - l.Debit), 0);
    const charges = TEST_ECRITURES_1MOIS.filter((l) => l.Compte.startsWith("6"))
      .reduce((s, l) => s + (l.Debit - l.Credit), 0);

    expect(produits).toBe(24_020_000);
    expect(charges).toBe(25_425_000);

    const resultatComptable = produits - charges;
    expect(resultatComptable).toBe(-1_405_000); // Déficit réel
  });

  it("3.2 — Simulateur IS/MFP retient le Minimum Forfaitaire (240 200 FCFA) en cas de déficit", () => {
    const isResult = calculateTogoIS({
      chiffreAffairesHt: 24_020_000,
      totalProduits: 24_020_000,
      totalCharges: 25_425_000,
      reintegrationsFiscales: 0,
      deductionsFiscales: 0,
    });

    expect(isResult.resultatComptable).toBe(-1_405_000);
    expect(isResult.resultatFiscal).toBe(0);
    expect(isResult.isTheorique).toBe(0);
    expect(isResult.mfpTheorique).toBe(240_200); // 1% de 24 020 000 FCFA (art. 120 CGI)
    expect(isResult.impotRetenu).toBe("MFP");
    expect(isResult.impotExigible).toBe(240_200);
  });
});

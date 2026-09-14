import { describe, it, expect } from "vitest";
import { calculerSanction, simulerControleOTR } from "@/lib/fiscal/sanctions-lpf";

describe("Sanctions LPF Togo — Majorations et amendes", () => {
  describe("Déclaration insuffisante bonne foi", () => {
    it("applique 25% si insuffisance ≥ 1/10", () => {
      const r = calculerSanction({
        type: "DECLARATION_INSUFFISANTE_BONNE_FOI",
        baseDroitsRappeles: 1_000_000,
        insuffisancePct: 0.15,
      });
      expect(r.majorationPct).toBe(25);
      expect(r.majorationFcfa).toBe(250_000);
    });

    it("n'applique rien si insuffisance < 1/10", () => {
      const r = calculerSanction({
        type: "DECLARATION_INSUFFISANTE_BONNE_FOI",
        baseDroitsRappeles: 1_000_000,
        insuffisancePct: 0.05,
      });
      expect(r.majorationPct).toBe(0);
      expect(r.majorationFcfa).toBe(0);
    });
  });

  describe("Mauvaise foi", () => {
    it("applique 40% sur droits rappelés", () => {
      const r = calculerSanction({
        type: "DECLARATION_INSUFFISANTE_MAUVAISE_FOI",
        baseDroitsRappeles: 1_000_000,
      });
      expect(r.majorationPct).toBe(40);
      expect(r.majorationFcfa).toBe(400_000);
    });
  });

  describe("Retard de paiement", () => {
    it("applique 10% au 1er mois sans mise en demeure", () => {
      const r = calculerSanction({
        type: "RETARD_PAIEMENT",
        baseDroitsRappeles: 1_000_000,
        moisDeRetard: 1,
      });
      expect(r.majorationFcfa).toBe(100_000);
      expect(r.totalSanction).toBe(100_000 + 1_000); // 10% + minimum 1000 FCFA
    });

    it("calcule 10% + 1%/mois + minimum 1 000 FCFA pour 3 mois", () => {
      const r = calculerSanction({
        type: "RETARD_PAIEMENT",
        baseDroitsRappeles: 1_000_000,
        moisDeRetard: 3,
      });
      // 10% = 100 000 ; mois suivants 2×1% = 20 000
      expect(r.majorationFcfa).toBe(100_000);
      expect(r.interetRetard).toBe(20_000);
    });

    it("ajoute 10% MED si après mise en demeure", () => {
      const r = calculerSanction({
        type: "RETARD_PAIEMENT",
        baseDroitsRappeles: 1_000_000,
        moisDeRetard: 1,
        apresMiseEnDemeure: true,
      });
      expect(r.interetRetard).toBe(1_000 + 100_000); // min + 10% MED
    });

    it("applique le minimum 1 000 FCFA sur petits montants", () => {
      const r = calculerSanction({
        type: "RETARD_PAIEMENT",
        baseDroitsRappeles: 50_000,
        moisDeRetard: 3,
      });
      // 1% × 2 mois = 1 000 FCFA → min 1 000 FCFA conservé
      expect(r.interetRetard).toBe(1_000);
    });
  });

  describe("Refus de communication", () => {
    it("applique 2M FCFA sans mise en demeure", () => {
      const r = calculerSanction({
        type: "REFUS_COMMUNICATION",
        baseDroitsRappeles: 0,
      });
      expect(r.amendeFixe).toBe(2_000_000);
    });

    it("applique 4M FCFA après mise en demeure 7 jours", () => {
      const r = calculerSanction({
        type: "REFUS_COMMUNICATION",
        baseDroitsRappeles: 0,
        apresMiseEnDemeure: true,
      });
      expect(r.amendeFixe).toBe(4_000_000);
    });
  });

  describe("Prête-nom", () => {
    it("applique 50% des sommes versées", () => {
      const r = calculerSanction({
        type: "PRETE_NOM",
        baseDroitsRappeles: 2_000_000,
      });
      expect(r.majorationPct).toBe(50);
      expect(r.majorationFcfa).toBe(1_000_000);
    });
  });

  describe("Défaut reversement RAS", () => {
    it("applique 100% des retenues non effectuées", () => {
      const r = calculerSanction({
        type: "DEFAUT_REVERSEMENT_RAS",
        baseDroitsRappeles: 0,
        montantRetenuesNonEffectuees: 500_000,
      });
      expect(r.majorationPct).toBe(100);
      expect(r.totalSanction).toBe(500_000);
    });
  });

  describe("Bénéficiaires effectifs", () => {
    it("applique minimum 2M FCFA", () => {
      const r = calculerSanction({
        type: "BENEFICIAIRES_EFFECTIFS",
        baseDroitsRappeles: 0,
        dividendesVerses: 10_000_000,
      });
      expect(r.amendeFixe).toBe(2_000_000);
    });

    it("applique maximum 20M FCFA", () => {
      const r = calculerSanction({
        type: "BENEFICIAIRES_EFFECTIFS",
        baseDroitsRappeles: 0,
        dividendesVerses: 1_000_000_000,
      });
      expect(r.amendeFixe).toBe(20_000_000);
    });

    it("applique 5% des dividendes dans la fourchette", () => {
      const r = calculerSanction({
        type: "BENEFICIAIRES_EFFECTIFS",
        baseDroitsRappeles: 0,
        dividendesVerses: 100_000_000,
      });
      expect(r.amendeFixe).toBe(5_000_000); // 5% × 100M
    });
  });

  describe("Simulation globale d'un contrôle OTR", () => {
    it("agrège plusieurs sanctions pour un cas complexe", () => {
      const r = simulerControleOTR({
        droitsRappeles: 5_000_000,
        moisDeRetard: 3,
        mauvaiseFoi: true,
        refusCommunication: true,
        montantRetenuesNonEffectuees: 500_000,
      });

      // Mauvaise foi (40%) : 2 000 000
      // Retard 3 mois (10% + 2%) : 600 000
      // Refus communication : 2 000 000
      // Défaut RAS : 500 000
      expect(r.sanctions).toHaveLength(4);
      expect(r.totalSanctions).toBeGreaterThanOrEqual(5_000_000);
      expect(r.totalExigible).toBeGreaterThanOrEqual(10_000_000);
    });

    it("retourne un cas simple sans sanctions majeures", () => {
      const r = simulerControleOTR({
        droitsRappeles: 100_000,
        moisDeRetard: 1,
      });
      expect(r.sanctions).toHaveLength(1); // Seul le retard
      expect(r.totalExigible).toBeGreaterThan(100_000);
    });
  });
});
import { describe, it, expect } from "vitest";
import {
  calculatePrecompteTva,
  isTvmSuspendue,
  isExonerationElevagePeche,
  calculateCreditImpotHandicap,
  verifierConformiteFacture,
} from "@/lib/fiscal/loi-finances-2026";

describe("Loi de Finances 2026 — Dispositions fiscales Togo", () => {
  describe("Art. 13 — Précompte TVA à la source", () => {
    it("retient la TVA si le fournisseur a un NIF valide", () => {
      const r = calculatePrecompteTva({
        montantHT: 500_000,
        statut: "FOURNISSEUR_NIF_VALIDE",
      });
      expect(r.tvaFacturee).toBe(90_000);
      expect(r.tvaPrecomptee).toBe(90_000);
      expect(r.netAPayerFournisseur).toBe(500_000);
      expect(r.obligationDeclarative).toBe(true);
    });

    it("ne retient rien sans NIF valide", () => {
      const r = calculatePrecompteTva({
        montantHT: 500_000,
        statut: "FOURNISSEUR_SANS_NIF",
      });
      expect(r.tvaPrecomptee).toBe(0);
      expect(r.netAPayerFournisseur).toBe(590_000);
    });

    it("respecte un taux TVA personnalisé", () => {
      const r = calculatePrecompteTva({
        montantHT: 1_000_000,
        tauxTVA: 18,
        statut: "FOURNISSEUR_NIF_VALIDE",
      });
      expect(r.tvaPrecomptee).toBe(180_000);
    });
  });

  describe("Art. 14 — Suspension TVM véhicules commerciaux", () => {
    it("suspend la TVM pour véhicule commercial transport en 2026", () => {
      const r = isTvmSuspendue({
        usage: "COMMERCIAL_TRANSPORT",
        anneeReference: 2026,
      });
      expect(r.suspendue).toBe(true);
    });

    it("applique la TVM de droit commun aux véhicules privés", () => {
      const r = isTvmSuspendue({ usage: "PRIVE", anneeReference: 2026 });
      expect(r.suspendue).toBe(false);
    });

    it("n'applique pas la suspension hors 2026", () => {
      const r = isTvmSuspendue({
        usage: "COMMERCIAL_TRANSPORT",
        anneeReference: 2025,
      });
      expect(r.suspendue).toBe(false);
    });
  });

  describe("Art. 18 — Exonération TVA provendes et élevage", () => {
    it("exonère les provendes pour produits locaux en 2026", () => {
      const r = isExonerationElevagePeche({
        categorie: "PROVENDE",
        anneeReference: 2026,
      });
      expect(r.exonere).toBe(true);
    });

    it("exonère les produits transformés par exploitant enregistré", () => {
      const r = isExonerationElevagePeche({
        categorie: "PRODUIT_LOCAL_TRANSFORME",
        exploitantEnregistre: true,
        anneeReference: 2026,
      });
      expect(r.exonere).toBe(true);
    });

    it("n'exonère pas un produit transformé sans exploitant enregistré", () => {
      const r = isExonerationElevagePeche({
        categorie: "PRODUIT_LOCAL_TRANSFORME",
        exploitantEnregistre: false,
        anneeReference: 2026,
      });
      expect(r.exonere).toBe(false);
    });
  });

  describe("Art. 20 — Crédit d'impôt handicap", () => {
    it("calcule 120 000 FCFA × nombre de salariés éligibles", () => {
      const r = calculateCreditImpotHandicap({
        nombreSalariesHandicapes: 3,
        contratsValides: 3,
        anneeReference: 2026,
      });
      expect(r.creditTotal).toBe(360_000);
      expect(r.montantUnitaire).toBe(120_000);
      expect(r.reportable).toBe(true);
      expect(r.dureeReportAnnees).toBe(5);
    });

    it("limite au nombre de contrats valides", () => {
      const r = calculateCreditImpotHandicap({
        nombreSalariesHandicapes: 5,
        contratsValides: 2,
        anneeReference: 2026,
      });
      expect(r.nombreSalariesEligibles).toBe(2);
      expect(r.creditTotal).toBe(240_000);
    });

    it("retourne 0 hors fenêtre 2026", () => {
      const r = calculateCreditImpotHandicap({
        nombreSalariesHandicapes: 3,
        contratsValides: 3,
        anneeReference: 2025,
      });
      expect(r.creditTotal).toBe(0);
    });
  });

  describe("Art. 62 LPF — Conformité facture électronique", () => {
    it("valide une facture électronique certifiée conforme", () => {
      const r = verifierConformiteFacture({
        typeFacture: "ELECTRONIQUE_CERTIFIEE",
        estAssujettiTVA: true,
        contientVignette: false,
        numeroFacture: "FAC-2026-001",
        tauxTVA: 18,
        destinataireAssujetti: true,
      });
      expect(r.conforme).toBe(true);
      expect(r.erreurs).toHaveLength(0);
    });

    it("rejette une facture entre redevables TVA sans facture électronique", () => {
      const r = verifierConformiteFacture({
        typeFacture: "NORMALISEE_PAPIER",
        estAssujettiTVA: true,
        contientVignette: true,
        numeroFacture: "FAC-2026-001",
        tauxTVA: 18,
        destinataireAssujetti: true,
      });
      expect(r.conforme).toBe(false);
      expect(r.erreurs.some((e) => e.includes("électronique"))).toBe(true);
    });

    it("rejette une facture sans numéro", () => {
      const r = verifierConformiteFacture({
        typeFacture: "NORMALISEE_PAPIER",
        estAssujettiTVA: false,
        contientVignette: true,
        numeroFacture: "",
      });
      expect(r.conforme).toBe(false);
    });

    it("rejette une facture papier sans vignette", () => {
      const r = verifierConformiteFacture({
        typeFacture: "NORMALISEE_PAPIER",
        estAssujettiTVA: true,
        contientVignette: false,
        numeroFacture: "FAC-2026-001",
        tauxTVA: 18,
      });
      expect(r.conforme).toBe(false);
      expect(r.erreurs.some((e) => e.includes("Vignette"))).toBe(true);
    });
  });
});
import { describe, it, expect } from "vitest";
import {
  checkTvaCoherence,
  checkLignesMontants,
  checkImageDupliquee,
  checkNifNomCoherence,
  checkMontantAnormal,
  runInvoiceLevelDetection,
  RawInvoiceForAudit,
} from "@/lib/controle/anomaly-rules";

const baseInvoice: RawInvoiceForAudit = {
  id: "inv-1",
  source: "PURCHASE",
  numeroPiece: "FAC-2026-001",
  date: "2026-08-01",
  tiersNom: "ETS COMPAORE & FRERES",
  tiersNif: "1000492815",
  montantHT: 500000,
  tauxTVA: 18,
  montantTVA: 90000,
  montantTTC: 590000,
};

describe("Règles niveau facture (Section 7)", () => {
  it("7.1 - signale une TVA incohérente avec le taux 18%", () => {
    const f = { ...baseInvoice, montantTVA: 80000 };
    const a = checkTvaCoherence(f);
    expect(a).not.toBeNull();
    expect(a?.type).toBe("TVA_INCOHERENTE_AVEC_TAUX");
    expect(a?.montantImpact).toBe(10000);
  });

  it("7.1 - passe si TVA conforme à 18%", () => {
    expect(checkTvaCoherence(baseInvoice)).toBeNull();
  });

  it("7.2 - signale une ligne quantite x PU != total", () => {
    const f: RawInvoiceForAudit = {
      ...baseInvoice,
      articles: [
        { designation: "Riz 50kg", quantity: 20, puHT: 17500, totalHT: 300000 },
      ],
    };
    const anoms = checkLignesMontants(f);
    expect(anoms.length).toBe(1);
    expect(anoms[0]?.type).toBe("LIGNE_MONTANT_INCOHERENT");
    expect(anoms[0]?.montantImpact).toBe(50000);
  });

  it("7.2 - passe si ligne coherente", () => {
    const f: RawInvoiceForAudit = {
      ...baseInvoice,
      articles: [
        { designation: "Riz 50kg", quantity: 20, puHT: 17500, totalHT: 350000 },
      ],
    };
    expect(checkLignesMontants(f).length).toBe(0);
  });

  it("7.3 - signale une image deja importee", () => {
    const f = { ...baseInvoice, imageHash: "abc123" };
    const hashes = new Set(["abc123"]);
    const a = checkImageDupliquee(f, hashes);
    expect(a?.type).toBe("FACTURE_IMAGE_DUPLIQUEE");
  });

  it("7.3 - passe si image inedite ou absente", () => {
    expect(checkImageDupliquee(baseInvoice, new Set())).toBeNull();
  });

  it("7.4 - signale un NIF deja associe a un autre nom", () => {
    const f = { ...baseInvoice, tiersNom: "TOTALEMENT AUTRE NOM" };
    const map = new Map([["1000492815", "ETS COMPAORE & FRERES"]]);
    const a = checkNifNomCoherence(f, map);
    expect(a?.type).toBe("NIF_NOM_INCOHERENT");
  });

  it("7.4 - passe si le nom est similaire", () => {
    const f = { ...baseInvoice, tiersNom: "COMPAORE & FRERES" };
    const map = new Map([["1000492815", "ETS COMPAORE & FRERES"]]);
    expect(checkNifNomCoherence(f, map)).toBeNull();
  });

  it("7.5 - signale un montant anormal (z > 3 et ratio > 3)", () => {
    const f = { ...baseInvoice, montantHT: 5000000 };
    const historique = [500000, 480000, 520000, 490000, 510000, 505000];
    const a = checkMontantAnormal(f, historique);
    expect(a?.type).toBe("MONTANT_ANORMAL_VS_HISTORIQUE");
  });

  it("7.5 - passe si montant dans la norme", () => {
    const f = { ...baseInvoice, montantHT: 510000 };
    const historique = [500000, 480000, 520000, 490000, 510000, 505000];
    expect(checkMontantAnormal(f, historique)).toBeNull();
  });

  it("Orchestrateur - agrege plusieurs regles", () => {
    const factures: RawInvoiceForAudit[] = [
      { ...baseInvoice, id: "1", montantTVA: 80000 },
      { ...baseInvoice, id: "2", numeroPiece: "FAC-2026-002", imageHash: "xyz" },
    ];
    const hashes = new Set(["xyz"]);
    const anoms = runInvoiceLevelDetection(factures, { hashesExistants: hashes });
    expect(anoms.length).toBeGreaterThanOrEqual(2);
  });
});
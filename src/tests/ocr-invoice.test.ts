import { describe, it, expect } from "vitest";
import {
  validateTogoNif,
  generateSyscohadaProposal,
  parseInvoiceFromText,
  TOGO_SAMPLE_INVOICES,
} from "@/lib/server/ocr-invoice";

describe("🔍 Moteur OCR & Imputation SYSCOHADA (Togo / OTR)", () => {
  it("valide correctement les NIFs togolais conformes", () => {
    expect(validateTogoNif("1000492815")).toBe(true);
    expect(validateTogoNif("1000002134")).toBe(true);
    expect(validateTogoNif("1000883412")).toBe(true);
    expect(validateTogoNif("123")).toBe(false);
    expect(validateTogoNif("")).toBe(false);
    expect(validateTogoNif(undefined)).toBe(false);
  });

  it("génère une écriture d'ACHAT équilibrée avec TVA 18% (6011 / 4452 / 4011)", () => {
    const sample = TOGO_SAMPLE_INVOICES.SAMPLE_ACHAT_GROSSISTE;
    const proposal = generateSyscohadaProposal(sample);

    expect(proposal.isBalanced).toBe(true);
    expect(proposal.totalDebit).toBe(590000);
    expect(proposal.totalCredit).toBe(590000);
    expect(proposal.journal).toBe("ACHATS");

    // Lignes attendues
    const debit601 = proposal.lines.find((l) => l.accountCode === "601100");
    const debit4452 = proposal.lines.find((l) => l.accountCode === "445200");
    const credit401 = proposal.lines.find((l) => l.accountCode === "401100");

    expect(debit601?.debit).toBe(500000);
    expect(debit4452?.debit).toBe(90000);
    expect(credit401?.credit).toBe(590000);
  });

  it("génère une écriture de VENTE équilibrée avec TVA 18% (4111 / 7011 / 4431)", () => {
    const sample = TOGO_SAMPLE_INVOICES.SAMPLE_VENTE_CLIENT;
    const proposal = generateSyscohadaProposal(sample);

    expect(proposal.isBalanced).toBe(true);
    expect(proposal.totalDebit).toBe(1003000);
    expect(proposal.totalCredit).toBe(1003000);
    expect(proposal.journal).toBe("VENTES");

    const debit411 = proposal.lines.find((l) => l.accountCode === "521100"); // Banque car mode = BANQUE
    const credit701 = proposal.lines.find((l) => l.accountCode === "701100");
    const credit4431 = proposal.lines.find((l) => l.accountCode === "443100");

    expect(debit411?.debit).toBe(1003000);
    expect(credit701?.credit).toBe(850000);
    expect(credit4431?.credit).toBe(153000);
  });

  it("extrait correctement une facture textuelle brute et calcule les montants", () => {
    const rawText = `
      FACTURE N° FAC-2026-9912
      Date: 2026-09-05
      Fournisseur: ETS CEET CASH POWER LOME
      NIF: 1000002134
      Total HT: 50 000 FCFA
      TVA 18%: 9 000 FCFA
      Total TTC: 59 000 FCFA
      Règlement: Espèces
    `;

    const parsed = parseInvoiceFromText(rawText);
    expect(parsed.type).toBe("ACHAT");
    expect(parsed.natureAchat).toBe("ENERGIE");
    expect(parsed.isNifValid).toBe(true);
    expect(parsed.montantHT).toBe(50000);
    expect(parsed.montantTVA).toBe(9000);
    expect(parsed.montantTTC).toBe(59000);
    expect(parsed.modePaiement).toBe("ESPECES");

    const proposal = generateSyscohadaProposal(parsed);
    expect(proposal.isBalanced).toBe(true);
    // Doit imputer le compte 605100 (Énergie) et 571100 (Caisse)
    expect(proposal.lines.some((l) => l.accountCode === "605100")).toBe(true);
    expect(proposal.lines.some((l) => l.accountCode === "571100")).toBe(true);
  });
});

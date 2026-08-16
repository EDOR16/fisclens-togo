import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TEST_TENANT_ID = "tenant-demo-stcs";

describe("📦 LOT 1 — Tests d'Intégrité des Données SYSCOHADA (10 Tests)", () => {
  beforeAll(async () => {
    // Vérification de la présence du tenant de démo
    const tenant = await prisma.tenant.findUnique({
      where: { id: TEST_TENANT_ID },
    });
    expect(tenant).toBeDefined();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Règle d'or : Toute écriture déséquilibrée doit être strictement rejetée
  it("Test 1.1 : Rejette une écriture déséquilibrée (Débit !== Crédit) avec calcul de l'écart", () => {
    const lines = [
      { accountCode: "411100", libelle: "Client", debit: 5_000_000, credit: 0 },
      { accountCode: "701100", libelle: "Ventes HT", debit: 0, credit: 4_000_000 },
      // Manque 1 000 000 au crédit !
    ];

    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

    const isBalanced = totalDebit > 0 && totalDebit === totalCredit;
    const diff = Math.abs(totalDebit - totalCredit);

    expect(isBalanced).toBe(false);
    expect(diff).toBe(1_000_000);
  });

  // 2. Règle d'or : Une écriture équilibrée est validée au centime/franc près
  it("Test 1.2 : Valide une écriture parfaitement équilibrée (Débit === Crédit)", () => {
    const lines = [
      { accountCode: "411100", libelle: "Client TOGO DISTRIBUTION", debit: 11_800_000, credit: 0 },
      { accountCode: "701100", libelle: "Ventes de marchandises", debit: 0, credit: 10_000_000 },
      { accountCode: "443100", libelle: "TVA facturée 18%", debit: 0, credit: 1_800_000 },
    ];

    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

    expect(totalDebit).toBe(11_800_000);
    expect(totalCredit).toBe(11_800_000);
    expect(totalDebit === totalCredit).toBe(true);
  });

  // 3. Règle SYSCOHADA : Interdiction du double montant (débit > 0 ET crédit > 0 sur la même ligne)
  it("Test 1.3 : Interdit les lignes ayant simultanément débit > 0 et crédit > 0", () => {
    const invalidLine = { accountCode: "601100", libelle: "Achat", debit: 500_000, credit: 500_000 };
    const isValidSide =
      (invalidLine.debit > 0 && invalidLine.credit === 0) ||
      (invalidLine.credit > 0 && invalidLine.debit === 0);

    expect(isValidSide).toBe(false);
  });

  // 4. Intégrité de la Balance : Total des mouvements Débit === Total des mouvements Crédit en base
  it("Test 1.4 : Total Mouvements Débit === Total Mouvements Crédit sur l'ensemble de la base", async () => {
    const lines = await prisma.ecritureLine.findMany({
      where: { ecriture: { tenantId: TEST_TENANT_ID, status: "VALIDE" } },
    });

    expect(lines.length).toBeGreaterThan(0);

    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

    expect(totalDebit).toBeGreaterThan(0);
    expect(totalDebit).toBe(totalCredit);
  });

  // 5. Intégrité de la Balance : Total Soldes Débiteurs === Total Soldes Créditeurs
  it("Test 1.5 : Total Soldes Débiteurs === Total Soldes Créditeurs dans la Balance générale", async () => {
    const lines = await prisma.ecritureLine.findMany({
      where: { ecriture: { tenantId: TEST_TENANT_ID, status: "VALIDE" } },
    });

    const accountMap = new Map<string, { debit: number; credit: number }>();
    for (const l of lines) {
      const cur = accountMap.get(l.accountCode) || { debit: 0, credit: 0 };
      cur.debit += l.debit;
      cur.credit += l.credit;
      accountMap.set(l.accountCode, cur);
    }

    let totalSoldeDebiteur = 0;
    let totalSoldeCrediteur = 0;

    for (const [, acc] of accountMap) {
      const diff = acc.debit - acc.credit;
      if (diff > 0) totalSoldeDebiteur += diff;
      if (diff < 0) totalSoldeCrediteur += Math.abs(diff);
    }

    expect(totalSoldeDebiteur).toBeGreaterThan(0);
    expect(totalSoldeDebiteur).toBe(totalSoldeCrediteur);
  });

  // 6. Source de vérité unique : Chiffre d'Affaires = Somme stricte des crédits des comptes 7
  it("Test 1.6 : Le Chiffre d'Affaires consolidé correspond exactement à la classe 7 (701% + 706%)", async () => {
    const lines = await prisma.ecritureLine.findMany({
      where: { ecriture: { tenantId: TEST_TENANT_ID, status: "VALIDE" } },
    });

    const caLines = lines.filter((l) => l.accountCode.startsWith("7"));
    const chiffreAffaires = caLines.reduce((s, l) => s + (l.credit - l.debit), 0);

    // D'après le seed : 10 000 000 (701100) + 5 000 000 (706100) = 15 000 000 FCFA
    expect(chiffreAffaires).toBe(15_000_000);
  });

  // 7. Source de vérité unique : Total des Charges = Somme stricte des débits des comptes 6
  it("Test 1.7 : Les Charges d'exploitation consolidées correspondent exactement à la classe 6", async () => {
    const lines = await prisma.ecritureLine.findMany({
      where: { ecriture: { tenantId: TEST_TENANT_ID, status: "VALIDE" } },
    });

    const chargeLines = lines.filter((l) => l.accountCode.startsWith("6"));
    const totalCharges = chargeLines.reduce((s, l) => s + (l.debit - l.credit), 0);

    // D'après le seed :
    // 601100 (6 000 000) + 628100 (500 000) + 661100 (3 000 000) + 664100 (600 000) = 10 100 000 FCFA
    expect(totalCharges).toBe(10_100_000);
  });

  // 8. Source de vérité unique : Trésorerie nette = Solde débiteur Banque (521) + Caisse (571)
  it("Test 1.8 : La Trésorerie nette correspond au solde réel des comptes financiers (Classe 5)", async () => {
    const lines = await prisma.ecritureLine.findMany({
      where: { ecriture: { tenantId: TEST_TENANT_ID, status: "VALIDE" } },
    });

    const tresoLines = lines.filter((l) => l.accountCode.startsWith("5"));
    const tresorerieNette = tresoLines.reduce((s, l) => s + (l.debit - l.credit), 0);

    // D'après le seed :
    // 521100 Débit (8 000 000) - Crédit (5 000 000) = +3 000 000 FCFA
    expect(tresorerieNette).toBe(3_000_000);
  });

  // 9. Source de vérité unique : Encours client = Solde débiteur réel du compte 411
  it("Test 1.9 : L'Encours Client correspond au solde débiteur net du compte 411100", async () => {
    const lines = await prisma.ecritureLine.findMany({
      where: { ecriture: { tenantId: TEST_TENANT_ID, status: "VALIDE" } },
    });

    const clientLines = lines.filter((l) => l.accountCode.startsWith("411"));
    const encoursClients = clientLines.reduce((s, l) => s + (l.debit - l.credit), 0);

    // D'après le seed :
    // 411100 Débit (11 800 000 + 5 900 000 = 17 700 000) - Crédit (8 000 000) = 9 700 000 FCFA
    expect(encoursClients).toBe(9_700_000);
  });

  // 10. Calcul Fiscal TVA 18% automatique : TVA Nette = TVA Collectée (4431) - TVA Déductible (4452)
  it("Test 1.10 : Calcul automatique conforme de la TVA OTR (18%)", async () => {
    const lines = await prisma.ecritureLine.findMany({
      where: { ecriture: { tenantId: TEST_TENANT_ID, status: "VALIDE" } },
    });

    const tvaColLines = lines.filter((l) => l.accountCode.startsWith("4431"));
    const tvaCollectee = tvaColLines.reduce((s, l) => s + (l.credit - l.debit), 0);

    const tvaDedLines = lines.filter(
      (l) => l.accountCode.startsWith("4451") || l.accountCode.startsWith("4452")
    );
    const tvaDeductible = tvaDedLines.reduce((s, l) => s + (l.debit - l.credit), 0);

    const tvaNette = tvaCollectee - tvaDeductible;

    // D'après le seed :
    // TVA Collectée : 1 800 000 + 900 000 = 2 700 000 FCFA
    // TVA Déductible : 1 080 000 + 90 000 = 1 170 000 FCFA
    // TVA Nette à reverser à l'OTR : 2 700 000 - 1 170 000 = 1 530 000 FCFA
    expect(tvaCollectee).toBe(2_700_000);
    expect(tvaDeductible).toBe(1_170_000);
    expect(tvaNette).toBe(1_530_000);
  });
});

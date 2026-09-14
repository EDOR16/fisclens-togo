import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient, TypeAnomalie, SeveriteAnomalie } from "@prisma/client";
import {
  checkEcritureBalance,
  checkJournalAccountMapping,
  checkDuplicatePieces,
  checkSequenceGaps,
  checkEcartTva,
  checkWeekendEntries,
  validateTogoNIF,
  runFullAnomalyDetection,
  RawEcritureForAudit,
} from "@/lib/controle/anomaly-rules";
import { runCspEvaluation } from "@/lib/fiscal/csp-evaluation";

const prisma = new PrismaClient();
let testTenantId = "";

describe("🔍 Moteur de Détection d'Anomalies (LPF Togo / SYSCOHADA)", () => {
  const TEST_TENANT_NAME = "__TEST_ANOMALY_DETECTION__";

  beforeAll(async () => {
    // Tenant DÉDIÉ aux tests — ne touche pas aux dossiers clients
    let tenant = await prisma.tenant.findFirst({
      where: { name: TEST_TENANT_NAME },
    });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: TEST_TENANT_NAME,
          nif: "9999999999",
          rccm: "TG-TEST-0000-T-000",
          regime: "REEL_NORMAL",
          centreFiscal: "TEST",
        },
      });
    }
    testTenantId = tenant.id;
  });

  afterAll(async () => {
    // Nettoyage complet du tenant de test
    await prisma.anomalieDetectee.deleteMany({ where: { tenantId: testTenantId } });
    await prisma.tenant.deleteMany({ where: { name: TEST_TENANT_NAME } });
    await prisma.$disconnect();
  });

  // Test 1 : Contrôle de l'équilibre de l'écriture
  it("Test 1 : détecte une écriture déséquilibrée comme anomalie BLOQUANTE", () => {
    const unbalancedEc: RawEcritureForAudit = {
      id: "ec-unbal-1",
      journal: "ACHATS",
      date: "2026-08-01",
      piece: "FAC-TEST-001",
      status: "VALIDE",
      lines: [
        { accountCode: "601100", libelle: "Achat stock", debit: 500000, credit: 0 },
        { accountCode: "401100", libelle: "Fournisseur", debit: 0, credit: 450000 },
      ],
    };

    const result = checkEcritureBalance(unbalancedEc);
    expect(result).not.toBeNull();
    expect(result?.type).toBe(TypeAnomalie.ECRITURE_DESEQUILIBREE);
    expect(result?.severite).toBe(SeveriteAnomalie.BLOQUANT);
    expect(result?.montantImpact).toBe(50000);
  });

  it("Test 2 : valide une écriture équilibrée (Débit = Crédit)", () => {
    const balancedEc: RawEcritureForAudit = {
      id: "ec-bal-1",
      journal: "ACHATS",
      date: "2026-08-01",
      piece: "FAC-TEST-002",
      status: "VALIDE",
      lines: [
        { accountCode: "601100", libelle: "Achat stock", debit: 500000, credit: 0 },
        { accountCode: "401100", libelle: "Fournisseur", debit: 0, credit: 500000 },
      ],
    };

    const result = checkEcritureBalance(balancedEc);
    expect(result).toBeNull();
  });

  // Test 3 : Mapping comptes SYSCOHADA par journal
  it("Test 3 : signale un compte de vente (701) imputé dans le journal ACHATS", () => {
    const ec: RawEcritureForAudit = {
      id: "ec-map-1",
      journal: "ACHATS",
      date: "2026-08-02",
      piece: "FAC-TEST-003",
      status: "VALIDE",
      lines: [
        { accountCode: "701100", libelle: "Compte anormal en achats", debit: 100000, credit: 0 },
        { accountCode: "401100", libelle: "Fournisseur", debit: 0, credit: 100000 },
      ],
    };

    const issues = checkJournalAccountMapping(ec);
    expect(issues.length).toBeGreaterThanOrEqual(1);
    const mappingAnom = issues.find((i) => i.type === TypeAnomalie.COMPTE_HORS_MAPPING_JOURNAL);
    expect(mappingAnom).toBeDefined();
    expect(mappingAnom?.severite).toBe(SeveriteAnomalie.AVERTISSEMENT);
  });

  it("Test 4 : exige un compte de trésorerie 521 dans le journal BANQUE", () => {
    const ecSans521: RawEcritureForAudit = {
      id: "ec-bq-1",
      journal: "BANQUE",
      date: "2026-08-03",
      piece: "VIR-TEST-001",
      status: "VALIDE",
      lines: [
        { accountCode: "401100", libelle: "Fournisseur", debit: 200000, credit: 0 },
        { accountCode: "411100", libelle: "Client", debit: 0, credit: 200000 },
      ],
    };

    const issues = checkJournalAccountMapping(ecSans521);
    const mandatoryAnom = issues.find(
      (i) => i.severite === SeveriteAnomalie.BLOQUANT && i.type === TypeAnomalie.COMPTE_HORS_MAPPING_JOURNAL
    );
    expect(mandatoryAnom).toBeDefined();
    expect(mandatoryAnom?.description).toContain("52");
  });

  // Test 5 : Doublons de pièces justificatives (art. 124 LPF)
  it("Test 5 : détecte les numéros de pièces justificatives dupliqués", () => {
    const list: RawEcritureForAudit[] = [
      {
        id: "ec-d1",
        journal: "ACHATS",
        date: "2026-08-05",
        piece: "FAC-ACH-2026-888",
        status: "VALIDE",
        lines: [
          { accountCode: "601100", libelle: "Achats", debit: 1000000, credit: 0 },
          { accountCode: "401100", libelle: "Fournisseur", debit: 0, credit: 1000000 },
        ],
      },
      {
        id: "ec-d2",
        journal: "ACHATS",
        date: "2026-08-06",
        piece: "FAC-ACH-2026-888", // Doublon
        status: "VALIDE",
        lines: [
          { accountCode: "601100", libelle: "Achats", debit: 1000000, credit: 0 },
          { accountCode: "401100", libelle: "Fournisseur", debit: 0, credit: 1000000 },
        ],
      },
    ];

    const dupes = checkDuplicatePieces(list);
    expect(dupes.length).toBe(1);
    expect(dupes[0]?.type).toBe(TypeAnomalie.FACTURE_NUMERO_DUPLIQUE);
    expect(dupes[0]?.severite).toBe(SeveriteAnomalie.BLOQUANT);
    expect(dupes[0]?.factureRef).toBe("FAC-ACH-2026-888");
  });

  // Test 6 : Trous de séquence dans la numérotation
  it("Test 6 : détecte un trou de numérotation dans une séquence de facturation", () => {
    const list: RawEcritureForAudit[] = [
      { id: "e1", journal: "VENTES", date: "2026-08-01", piece: "FAC-VTE-2026-0101", status: "VALIDE", lines: [] },
      { id: "e2", journal: "VENTES", date: "2026-08-02", piece: "FAC-VTE-2026-0103", status: "VALIDE", lines: [] }, // Manque 0102
    ];

    const gaps = checkSequenceGaps(list);
    expect(gaps.length).toBe(1);
    expect(gaps[0]?.type).toBe(TypeAnomalie.NUMEROTATION_NON_CONTINUE);
    expect(gaps[0]?.severite).toBe(SeveriteAnomalie.AVERTISSEMENT);
  });

  // Test 7 : Validation du format NIF togolais
  it("Test 7 : valide le format officiel des NIF togolais (9 à 12 chiffres)", () => {
    expect(validateTogoNIF("1000845921")).toBe(true); // 10 chiffres (standard OTR)
    expect(validateTogoNIF("100123456789")).toBe(true); // 12 chiffres
    expect(validateTogoNIF("12345")).toBe(false); // Trop court
    expect(validateTogoNIF("NIF-INVALID-XYZ")).toBe(false);
  });

  // Test 8 : Écart déclaratif TVA
  it("Test 8 : signale un écart significatif entre TVA collectée et TVA déclarée", () => {
    const anom = checkEcartTva(1_500_000, 1_200_000); // Écart de 300 000 FCFA
    expect(anom).not.toBeNull();
    expect(anom?.type).toBe(TypeAnomalie.ECART_TVA_DECLAREE_VS_COLLECTEE);
    expect(anom?.severite).toBe(SeveriteAnomalie.BLOQUANT);
    expect(anom?.montantImpact).toBe(300_000);
  });

  // Test 9 : Détection d'écritures de week-end
  it("Test 9 : identifie les écritures saisies le samedi ou le dimanche", () => {
    const ecWeekend: RawEcritureForAudit = {
      id: "ec-we-1",
      journal: "CAISSE",
      date: "2026-08-02", // 02/08/2026 est un Dimanche
      piece: "PC-CAI-001",
      status: "VALIDE",
      lines: [
        { accountCode: "604700", libelle: "Fournitures", debit: 50000, credit: 0 },
        { accountCode: "571100", libelle: "Caisse", debit: 0, credit: 50000 },
      ],
    };

    const anoms = checkWeekendEntries([ecWeekend]);
    expect(anoms.length).toBe(1);
    expect(anoms[0]?.description).toContain("Dimanche");
  });

  // Test 10 : Audit global complet et impact sur la note de conformité
  it("Test 10 : calcule un score de conformité pondéré et isole les anomalies bloquantes", () => {
    const mixedEcritures: RawEcritureForAudit[] = [
      // 1. Écriture déséquilibrée (Bloquante)
      {
        id: "ec-mix-1",
        journal: "ACHATS",
        date: "2026-08-01",
        piece: "FAC-001",
        status: "VALIDE",
        lines: [
          { accountCode: "601100", libelle: "Achats", debit: 100000, credit: 0 },
          { accountCode: "401100", libelle: "Fournisseur", debit: 0, credit: 90000 },
        ],
      },
      // 2. Écriture équilibrée mais compte hors mapping (Avertissement)
      {
        id: "ec-mix-2",
        journal: "ACHATS",
        date: "2026-08-03",
        piece: "FAC-002",
        status: "VALIDE",
        lines: [
          { accountCode: "701100", libelle: "Ventes en achats", debit: 200000, credit: 0 },
          { accountCode: "401100", libelle: "Fournisseur", debit: 0, credit: 200000 },
        ],
      },
    ];

    const report = runFullAnomalyDetection(mixedEcritures);
    expect(report.total).toBeGreaterThanOrEqual(2);
    expect(report.bloquantes).toBeGreaterThanOrEqual(1);
    expect(report.avertissements).toBeGreaterThanOrEqual(1);
    expect(report.scoreConformite).toBeLessThan(100);
  });

  // Test 11 : Intégration CSP — Pas de 100/100 si anomalies bloquantes actives
  it("Test 11 : garantit que la revue CSP dégrade la note si des anomalies bloquantes sont actives", async () => {
    // Insérer temporairement une anomalie bloquante
    const createdAnom = await prisma.anomalieDetectee.create({
      data: {
        tenantId: testTenantId,
        type: TypeAnomalie.ECRITURE_DESEQUILIBREE,
        severite: SeveriteAnomalie.BLOQUANT,
        description: "Test d'anomalie bloquante pour vérification CSP",
        statut: "A_EXAMINER",
        factureRef: "FAC-TEST-BLOQUANT",
      },
    });

    try {
      const evaluation = await runCspEvaluation(testTenantId, "2026");
      // Le grade A doit être strictement interdit en présence d'anomalie bloquante active
      expect(evaluation.grade).not.toBe("A");
      expect(evaluation.statutGlobal).not.toBe("CONFORME");
      expect(evaluation.alertesBloquantes.length).toBeGreaterThan(0);
      expect(evaluation.scoreGlobal).toBeLessThanOrEqual(65);
    } finally {
      // Nettoyer l'anomalie de test
      await prisma.anomalieDetectee.delete({ where: { id: createdAnom.id } });
    }
  }, 30000);
});

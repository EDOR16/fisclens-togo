import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { runCspEvaluation, generateHash } from "@/lib/fiscal/csp-evaluation";

const prisma = new PrismaClient();
let testTenantId = "";

describe("🛡️ Revue Fiscale & CSP d'Auto-Évaluation (CGI Togo / LPF / SYSCOHADA)", { timeout: 30000 }, () => {
  beforeAll(async () => {
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: "Société STCS Togo SARL",
          nif: "1000123456",
          rccm: "TG-LFW-01-2023-B12-00123",
          regime: "REEL_NORMAL",
          centreFiscal: "DGE Lomé",
        },
      });
    }
    testTenantId = tenant.id;
    expect(testTenantId).toBeTruthy();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Test 1: Intégrité cryptographique SHA-256
  it("Test 1 : génère une empreinte SHA-256 déterministe et valide (64 caractères hex)", () => {
    const hash1 = generateHash("FiscLens-Togo-DSF-2025");
    const hash2 = generateHash("FiscLens-Togo-DSF-2025");
    const hash3 = generateHash("FiscLens-Togo-DSF-2026");

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(/^[0-9a-f]{64}$/.test(hash1)).toBe(true);
  });

  // Test 2: Audit complet des 7 piliers sur le dossier réel STCS Togo
  it("Test 2 : exécute l'audit complet des 7 piliers avec conformité réglementaire", async () => {
    const result = await runCspEvaluation(testTenantId, "2025");

    expect(result).toBeDefined();
    expect(result.tenantId).toBe(testTenantId);
    expect(result.exercice).toBe("2025");
    expect(result.scoreGlobal).toBeGreaterThanOrEqual(0);
    expect(result.scoreGlobal).toBeLessThanOrEqual(100);
    expect(["A", "B", "C"]).toContain(result.grade);
    expect(["CONFORME", "A_REGULARISER", "CRITIQUE"]).toContain(result.statutGlobal);
    expect(result.hashCertificat).toHaveLength(64);

    // Vérification des 7 Piliers OTR
    expect(result.piliers).toHaveLength(7);
    const pilierIds = result.piliers.map((p) => p.id);
    expect(pilierIds).toEqual(["p1", "p2", "p3", "p4", "p5", "p6", "p7"]);

    // Pilier 1 : Équilibre & Intégrité SYSCOHADA
    const p1 = result.piliers.find((p) => p.id === "p1");
    expect(p1?.titre).toContain("SYSCOHADA");
    expect(p1?.controles.length).toBeGreaterThanOrEqual(3);
    const c11 = p1?.controles.find((c) => c.id === "ctrl-1-1");
    expect(c11?.codeRef).toContain("OHADA");

    // Pilier 2 : Cohérence TVA 18% & CA3
    const p2 = result.piliers.find((p) => p.id === "p2");
    expect(p2?.titre).toContain("TVA");
    const c21 = p2?.controles.find((c) => c.id === "ctrl-2-1");
    expect(c21?.codeRef).toContain("195"); // CGI Togo art. 195 (taux normal 18%)

    // Pilier 3 : Déductibilité IS 27% & IMF 1%
    const p3 = result.piliers.find((p) => p.id === "p3");
    expect(p3?.titre).toContain("IS");
    const c32 = p3?.controles.find((c) => c.id === "ctrl-3-2");
    expect(c32?.titre).toContain("IS (27%) vs IMF (1%)");

    // Pilier 4 : Retenues à la Source (RAS)
    const p4 = result.piliers.find((p) => p.id === "p4");
    expect(p4?.titre).toContain("Retenues");
    const c41 = p4?.controles.find((c) => c.id === "ctrl-4-1");
    expect(c41?.titre).toContain("BIC (5%) et BNC (10%)");

    // Pilier 5 : Masse Salariale, CNSS & AMU
    const p5 = result.piliers.find((p) => p.id === "p5");
    expect(p5?.titre).toContain("CNSS");
    const c51 = p5?.controles.find((c) => c.id === "ctrl-5-1");
    expect(c51?.codeRef).toContain("74"); // CGI Togo art. 74

    // Pilier 6 : Plafonds Espèces & Traçabilité LPF art. 45
    const p6 = result.piliers.find((p) => p.id === "p6");
    expect(p6?.titre).toContain("Espèces");
    const c61 = p6?.controles.find((c) => c.id === "ctrl-6-1");
    expect(c61?.codeRef).toContain("LPF art. 45");
    expect(c61?.titre).toContain("500 000 FCFA");

    // Pilier 7 : Liasse DSF & Notes Annexes
    const p7 = result.piliers.find((p) => p.id === "p7");
    expect(p7?.titre).toContain("DSF");
  });

  // Test 3 : Cohérence arithmétique de la note et du statut global
  it("Test 3 : garantit que la note globale (A/B/C) correspond au score arithmétique", async () => {
    const result = await runCspEvaluation(testTenantId, "2025");

    if (result.scoreGlobal >= 85) {
      expect(result.grade).toBe("A");
      expect(result.statutGlobal).toBe("CONFORME");
    } else if (result.scoreGlobal >= 60) {
      expect(result.grade).toBe("B");
      expect(result.statutGlobal).toBe("A_REGULARISER");
    } else {
      expect(result.grade).toBe("C");
      expect(result.statutGlobal).toBe("CRITIQUE");
    }
  });

  // Test 4 : Présence des métadonnées du certificat et recommandations
  it("Test 4 : fournit des points forts, alertes ou recommandations exploitables", async () => {
    const result = await runCspEvaluation(testTenantId, "2025");

    expect(Array.isArray(result.pointsForts)).toBe(true);
    expect(Array.isArray(result.alertesBloquantes)).toBe(true);
    expect(Array.isArray(result.recommandationsPrioritaires)).toBe(true);
    expect(result.tenantName).toBeTruthy();
    expect(result.centreFiscal).toBeTruthy();
  });
});

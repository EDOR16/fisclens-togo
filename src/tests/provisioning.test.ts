import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { provisionTenant } from "@/lib/server/provisioning";

const prisma = new PrismaClient();

describe("📦 PROVISIONING RÉEL — Espace de Travail Vierge & Conforme", { timeout: 30000 }, () => {
  afterAll(async () => {
    // Nettoyage : supprimer tous les tenants et users créés par ce test
    const testTenants = await prisma.tenant.findMany({
      where: { name: 'CABINET ALPHA & ASSOCIÉS TOGO' },
      include: { userTenants: true }
    });

    for (const t of testTenants) {
      const userIds = t.userTenants.map(ut => ut.userId);
      await prisma.tenant.delete({ where: { id: t.id } });

      // Supprimer les users orphelins
      for (const userId of userIds) {
        const remaining = await prisma.userTenant.count({ where: { userId } });
        if (remaining === 0) {
          await prisma.user.delete({ where: { id: userId } }).catch(() => {});
        }
      }
    }

    console.log(`Nettoyage test : ${testTenants.length} tenant(s) supprimé(s)`);
    await prisma.$disconnect();
  });

  it("Provisionne un tenant réel, vide de toute écriture et prêt à l'emploi", async () => {
    const uniqueEmail = `cabinet.test.${Date.now()}@fisc-togo.tg`;

    // 1. Créer un utilisateur test unique
    const user = await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: "Cabinet Alpha Togo",
        passwordHash: "$2a$10$abcdefghijklmnopqrstuv",
        require2fa: false,
      },
    });

    // 2. Exécuter le provisioning
    const tenant = await provisionTenant({
      tenantName: "CABINET ALPHA & ASSOCIÉS TOGO",
      ownerUserId: user.id,
      regime: "REEL_NORMAL",
      role: "CABINET",
      ip: "127.0.0.1",
      userAgent: "Vitest-Test-Agent",
    });

    expect(tenant.id).toBeDefined();
    expect(tenant.name).toBe("CABINET ALPHA & ASSOCIÉS TOGO");

    // 3. Vérifier que le plan de comptes SYSCOHADA (Classes 1 à 8) est complet (> 40 comptes)
    const accountsCount = await prisma.comptePlan.count({
      where: { tenantId: tenant.id },
    });
    expect(accountsCount).toBeGreaterThan(40);

    // 4. Vérifier que l'espace est 100% VIERGE (0 écriture simulée)
    const ecrituresCount = await prisma.ecriture.count({
      where: { tenantId: tenant.id },
    });
    expect(ecrituresCount).toBe(0);

    // 5. Vérifier la génération du calendrier fiscal OTR Togo
    const obligations = await prisma.calendarObligation.findMany({
      where: { tenantId: tenant.id },
    });
    expect(obligations.length).toBeGreaterThan(10);

    const tvaObligations = obligations.filter((o) => o.key.startsWith("TVA-"));
    expect(tvaObligations.length).toBe(12); // 12 mois de TVA
    expect(tvaObligations.every((o) => o.dueDate.endsWith("-15"))).toBe(true); // Exigible au 15

    const hasPatente = obligations.some((o) => o.key.startsWith("PATENTE-"));
    expect(hasPatente).toBe(true);

    const hasLiasse = obligations.some((o) => o.key.startsWith("LIASSE-"));
    expect(hasLiasse).toBe(true);

    // 6. Vérifier les consentements actifs (Loi 2018-26)
    const consents = await prisma.consentRecord.findMany({
      where: { userId: user.id },
    });
    expect(consents.length).toBe(2); // CGU + CONFIDENTIALITE
    expect(consents.some((c) => c.type === "CGU")).toBe(true);
    expect(consents.some((c) => c.type === "CONFIDENTIALITE")).toBe(true);

    // 7. Vérifier que le rôle CABINET a activé le 2FA obligatoire
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(updatedUser?.require2fa).toBe(true);

    // 8. Vérifier la piste d'audit
    const audit = await prisma.auditLog.findFirst({
      where: { tenantId: tenant.id, action: "TENANT_PROVISIONED" },
    });
    expect(audit).toBeDefined();
  });
});

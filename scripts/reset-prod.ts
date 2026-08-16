/**
 * scripts/reset-prod.ts
 * 
 * Script de purge des données simulées et de préparation de l'environnement de production.
 * Exécution : npx tsx scripts/reset-prod.ts --i-am-sure
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const isConfirmed = process.argv.includes("--i-am-sure");

  if (!isConfirmed) {
    console.error("❌ Refusé : Vous devez fournir l'argument '--i-am-sure' pour confirmer la purge.");
    process.exit(1);
  }

  console.log("🧹 Début de la purge des données simulées...");

  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.ecritureLine.deleteMany(),
    prisma.ecriture.deleteMany(),
    prisma.calendarObligation.deleteMany(),
    prisma.consentRecord.deleteMany(),
    prisma.comptePlan.deleteMany(),
    prisma.userTenant.deleteMany(),
    prisma.user.deleteMany(),
    prisma.tenant.deleteMany(),
  ]);

  console.log("✨ Environnement PROD purgé avec succès. Zéro donnée simulée en base.");
  console.log("👉 Chaque nouvelle inscription créera un espace de travail réel, structuré et vide.");
}

main()
  .catch((e) => {
    console.error("Erreur lors de la purge :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

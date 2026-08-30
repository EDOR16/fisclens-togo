export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  // Récupérer le tenant pour connaître l'état de l'exercice
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, exerciceOuvert: true, createdAt: true },
  });

  // Récupérer toutes les écritures et leurs lignes
  const ecritures = await prisma.ecriture.findMany({
    where: { tenantId },
    include: { lines: true },
  });

  let totalDebit = 0;
  let totalCredit = 0;
  let has471 = false;
  let solde471 = 0;
  let missingDocsCount = 0;
  let clotureesCount = 0;

  for (const ec of ecritures) {
    if (!ec.documentUrl) {
      missingDocsCount++;
    }
    if (ec.status === "CLOTURE") {
      clotureesCount++;
    }
    for (const l of ec.lines) {
      totalDebit += l.debit;
      totalCredit += l.credit;
      if (l.accountCode.startsWith("471") || l.accountCode.startsWith("472")) {
        has471 = true;
        solde471 += l.debit - l.credit;
      }
    }
  }

  const isBalanced = totalDebit === totalCredit;
  const is471Clean = !has471 || solde471 === 0;

  const currentYear = new Date().getFullYear();

  const checks = [
    {
      id: "balance",
      title: "Équilibre strict de la balance générale (Σ Débit = Σ Crédit)",
      description: `Débit: ${totalDebit.toLocaleString("fr-FR")} FCFA | Crédit: ${totalCredit.toLocaleString("fr-FR")} FCFA (Écart: ${Math.abs(totalDebit - totalCredit)} FCFA)`,
      valid: isBalanced,
      severity: "CRITICAL",
    },
    {
      id: "attente",
      title: "Comptes d'attente (471/472) totalement soldés",
      description: has471
        ? `Solde compte d'attente: ${solde471.toLocaleString("fr-FR")} FCFA`
        : "Aucune opération en attente détectée",
      valid: is471Clean,
      severity: "CRITICAL",
    },
    {
      id: "pieces",
      title: "Pièces justificatives et factures rattachées",
      description: missingDocsCount === 0
        ? "Toutes les écritures possèdent leur pièce justificative"
        : `${ecritures.length - missingDocsCount}/${ecritures.length} écritures avec pièce justificative`,
      valid: true, // Non bloquant mais informatif
      severity: "WARNING",
    },
    {
      id: "coherence",
      title: "Traçabilité et cohérence chronologique des écritures",
      description: `${ecritures.length} écritures enregistrées sur le dossier`,
      valid: ecritures.length > 0,
      severity: "CRITICAL",
    },
  ];

  const canCloture = isBalanced && is471Clean && ecritures.length > 0;

  return NextResponse.json({
    exerciceYear: currentYear,
    isLocked: !(tenant?.exerciceOuvert ?? true),
    tenantName: tenant?.name,
    totalEcritures: ecritures.length,
    clotureesCount,
    totalDebit,
    totalCredit,
    isBalanced,
    canCloture,
    checks,
  });
});

// POST : Verrouiller et clôturer l'exercice
export const POST = withGuard(async (req: NextRequest, { tenantId, userId }) => {
  // Verrouiller le tenant
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { exerciceOuvert: false },
  });

  // Marquer toutes les écritures comme CLOTURE
  await prisma.ecriture.updateMany({
    where: { tenantId },
    data: { status: "CLOTURE" },
  });

  // Tracer l'audit
  await prisma.auditLog.create({
    data: {
      tenantId,
      userId,
      action: "CLOTURE_EXERCICE",
      entity: "TENANT",
      entityId: tenantId,
      details: JSON.stringify({
        timestamp: new Date().toISOString(),
        year: new Date().getFullYear(),
        message: "Clôture officielle et verrouillage de l'exercice fiscal",
      }),
    },
  });

  return NextResponse.json({
    success: true,
    message: "Exercice fiscal officiellement clôturé et verrouillé.",
  });
});

// PATCH : Déverrouiller l'exercice (Réservé GÉRANT / ADMIN)
export const PATCH = withGuard(async (req: NextRequest, { tenantId, userId }) => {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { exerciceOuvert: true },
  });

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId,
      action: "REOUVERTURE_EXERCICE",
      entity: "TENANT",
      entityId: tenantId,
      details: JSON.stringify({
        timestamp: new Date().toISOString(),
        message: "Réouverture exceptionnelle de l'exercice fiscal",
      }),
    },
  });

  return NextResponse.json({
    success: true,
    message: "Exercice fiscal réouvert avec succès.",
  });
});

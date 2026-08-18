import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";
import { ensureSyscohadaReferences } from "@/lib/server/provisioning";

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  // Mise à niveau non destructive des dossiers créés avant le référentiel central.
  await prisma.$transaction(async (tx) => {
    await ensureSyscohadaReferences(tx);
    const refs = await tx.syscohadaRef.findMany();
    const existing = await tx.comptePlan.findMany({ where: { tenantId }, select: { code: true } });
    const codes = new Set(existing.map((account) => account.code));
    const missing = refs.filter((ref) => !codes.has(ref.code));
    if (missing.length) await tx.comptePlan.createMany({
      data: missing.map((ref) => ({
        tenantId,
        code: ref.code,
        libelle: ref.libelle,
        classe: ref.classe,
        refCode: ref.code,
        postable: ref.postable,
        isRoot: !ref.postable || ref.code.length <= 2,
      })),
    });
  });
  const comptes = await prisma.comptePlan.findMany({
    where: { tenantId },
    orderBy: { code: "asc" },
  });

  return NextResponse.json({ comptes });
});

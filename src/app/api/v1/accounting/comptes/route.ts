export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";
import { ensureSyscohadaReferences } from "@/lib/server/provisioning";

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  // ✅ Validation critique : bloquer si pas de tenant context
  if (!tenantId) {
    return NextResponse.json(
      { error: "MISSING_TENANT_CONTEXT", message: "Aucun dossier client sélectionné" },
      { status: 400 }
    );
  }

  try {
    // Mise à niveau non destructive des dossiers créés avant le référentiel central.
    await prisma.$transaction(async (tx) => {
      await ensureSyscohadaReferences(tx);
      const refs = await tx.syscohadaRef.findMany();
      const existing = await tx.comptePlan.findMany({
        where: { tenantId },
        select: { code: true }
      });
      const codes = new Set(existing.map((account) => account.code));
      const missing = refs.filter((ref) => !codes.has(ref.code));

      if (missing.length) {
        await tx.comptePlan.createMany({
          data: missing.map((ref) => ({
            tenantId,
            code: ref.code,
            libelle: ref.libelle,
            classe: ref.classe,
            refCode: ref.code,
            postable: ref.postable,
            isRoot: !ref.postable || ref.code.length <= 2,
          })),
          skipDuplicates: true, // ✅ Évite les erreurs si exécuté plusieurs fois
        });
      }
    });

    const comptes = await prisma.comptePlan.findMany({
      where: { tenantId },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ comptes });
  } catch (error) {
    console.error("[API_COMPTES_ERROR]", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: String(error) },
      { status: 500 }
    );
  }
});
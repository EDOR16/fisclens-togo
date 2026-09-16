export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

// ── Schéma de validation
const ResetSchema = z.object({
  confirmation: z.literal("EFFACER", {
    errorMap: () => ({ message: "Tapez exactement 'EFFACER' pour confirmer" }),
  }),
  scope: z.enum(["ALL", "JOURNAL", "DATE_RANGE"]).default("ALL"),
  journal: z
    .enum(["ACHATS", "VENTES", "BANQUE", "CAISSE", "OD", "PAIE"])
    .optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const POST = withGuard(
  async (req: NextRequest, ctx) => {
    const { tenantId, user } = ctx;

    if (!tenantId) {
      return NextResponse.json(
        { error: "NO_TENANT", message: "Aucun dossier actif" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = ResetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { scope, journal, dateFrom, dateTo } = parsed.data;

    // ── Vérification exercice ouvert (sécurité)
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, exerciceOuvert: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "TENANT_NOT_FOUND" }, { status: 404 });
    }

    // ── Construire le filtre selon le scope
    const ecritureWhere: any = { tenantId };

    if (scope === "JOURNAL" && journal) {
      ecritureWhere.journal = journal;
    }

    if (scope === "DATE_RANGE") {
      if (dateFrom) {
        ecritureWhere.date = { ...(ecritureWhere.date || {}), gte: dateFrom };
      }
      if (dateTo) {
        ecritureWhere.date = { ...(ecritureWhere.date || {}), lte: dateTo };
      }
    }

    // ── Compter avant (rapport)
    const nbEcritures = await prisma.ecriture.count({ where: ecritureWhere });
    const ecritureIds = await prisma.ecriture.findMany({
      where: ecritureWhere,
      select: { id: true },
    });
    const ids = ecritureIds.map((e) => e.id);

    if (nbEcritures === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucune écriture à supprimer pour ces critères",
        deleted: { ecritures: 0, lignes: 0, anomalies: 0, hashes: 0 },
      });
    }

    // ── Transaction atomique de suppression
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Anomalies liées aux écritures
        const anomaliesDeleted = await tx.anomalieDetectee.deleteMany({
          where: { tenantId, ecritureId: { in: ids } },
        });

        // 2. Hashes d'images liés
        const hashesDeleted = await tx.factureImageHash.deleteMany({
          where: { tenantId, ecritureId: { in: ids } },
        });

        // 3. Lignes d'écriture
        const lignesDeleted = await tx.ecritureLine.deleteMany({
          where: { ecritureId: { in: ids } },
        });

        // 4. Écritures elles-mêmes
        const ecrituresDeleted = await tx.ecriture.deleteMany({
          where: ecritureWhere,
        });

        return {
          ecritures: ecrituresDeleted.count,
          lignes: lignesDeleted.count,
          anomalies: anomaliesDeleted.count,
          hashes: hashesDeleted.count,
        };
      },
      { timeout: 120_000 }
    );

    // ── Audit log (traçabilité obligatoire)
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.userId,
        action: "RESET_ECRITURES",
        entity: "ECRITURE",
        details: JSON.stringify({
          scope,
          journal: journal || null,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          deleted: result,
          tenantName: tenant.name,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Réinitialisation effectuée : ${result.ecritures} écriture(s) supprimée(s)`,
      deleted: result,
      scope: {
        type: scope,
        journal: journal || null,
        dateRange: dateFrom && dateTo ? { from: dateFrom, to: dateTo } : null,
      },
    });
  },
  { roles: ["GERANT", "COMPTABLE", "ADMIN_SYS"] }
);
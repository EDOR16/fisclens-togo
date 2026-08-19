export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/bi/import/clients
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { withTenantGuard } from "@/lib/server/with-guard";
import { validateClientsImport } from "@/lib/bi/excel-import";

export const POST = withTenantGuard(async (req: NextRequest, { tenantId }: { tenantId: string }) => {
  try {
    const body = await req.json() as { fileBuffer: string };
    const { fileBuffer } = body;

    if (!fileBuffer) {
      return NextResponse.json(
        { error: "Fichier manquant" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(fileBuffer, "base64");
    const validationResult = validateClientsImport(buffer);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation échouée",
          summary: validationResult.summary,
          errors: validationResult.errors,
        },
        { status: 400 }
      );
    }

    const imported = [];
    for (const row of validationResult.imported) {
      // Upsert client (créer ou mettre à jour)
      const client = await prisma.clientRef.upsert({
        where: {
          tenantId_code: {
            tenantId,
            code: row.code,
          },
        },
        update: {
          name: row.nom,
          segment: row.segment,
          zoneGeo: row.zoneGeo,
          encoursAutorise: row.encoursAutorise,
        },
        create: {
          tenantId,
          code: row.code,
          name: row.nom,
          segment: row.segment,
          zoneGeo: row.zoneGeo,
          encoursAutorise: row.encoursAutorise,
        },
      });
      imported.push(client);
    }

    return NextResponse.json({
      success: true,
      message: `${imported.length} clients importés/mis à jour`,
      imported: imported.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
      })),
    });
  } catch (error) {
    console.error("Erreur import clients:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
});

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/bi/import/products
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { withTenantGuard, GuardContext } from "@/lib/server/with-guard";
import { validateProductsImport } from "@/lib/bi/excel-import";

export const POST = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
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
    const validationResult = validateProductsImport(buffer);

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
      // Upsert produit
      const product = await prisma.productRef.upsert({
        where: {
          tenantId_code: {
            tenantId,
            code: row.code,
          },
        },
        update: {
          designation: row.désignation,
          category: row.catégorie,
          priceVentHT: row.prixVenteHT,
          costAchatHT: row.coûtAchatHT,
          margineCible: row.margeCible,
        },
        create: {
          tenantId,
          code: row.code,
          designation: row.désignation,
          category: row.catégorie,
          priceVentHT: row.prixVenteHT,
          costAchatHT: row.coûtAchatHT,
          margineCible: row.margeCible,
        },
      });
      imported.push(product);
    }

    return NextResponse.json({
      success: true,
      message: `${imported.length} produits importés/mis à jour`,
      imported: imported.map((p) => ({
        id: p.id,
        code: p.code,
        designation: p.designation,
      })),
    });
  } catch (error) {
    console.error("Erreur import produits:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
});
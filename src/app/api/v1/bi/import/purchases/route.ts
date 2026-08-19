/**
 * POST /api/v1/bi/import/purchases
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { withTenantGuard } from "@/lib/server/with-guard";
import { validatePurchasesImport } from "@/lib/bi/excel-import";

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
    const validationResult = validatePurchasesImport(buffer);

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
      const product = await prisma.productRef.findUnique({
        where: {
          tenantId_code: {
            tenantId,
            code: row.codeArticle,
          },
        },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Produit non trouvé: ${row.codeArticle}` },
          { status: 400 }
        );
      }

      const purchase = await prisma.purchase.create({
        data: {
          tenantId,
          date: row.date,
          refCommande: row.refCommande,
          supplierId: row.codeFournisseur,
          productId: product.id,
          quantity: row.quantité,
          puHT: row.puHT,
          montantHT: row.montantHT,
          tauxTVA: row.tauxTVA,
          montantTVA: row.montantTVA,
          montantTTC: row.montantTTC,
        },
      });
      imported.push(purchase);
    }

    return NextResponse.json({
      success: true,
      message: `${imported.length} achats importés`,
      imported: imported.map((p) => ({
        id: p.id,
        date: p.date,
        refCommande: p.refCommande,
        montantTTC: p.montantTTC,
      })),
    });
  } catch (error) {
    console.error("Erreur import achats:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
});

/**
 * POST /api/v1/bi/import/sales
 * Import des données de ventes depuis Excel
 * Validation, réconciliation, rapport de rejet
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { withTenantGuard } from "@/lib/server/with-guard";
import { validateSalesImport } from "@/lib/bi/excel-import";

interface ImportSalesRequest {
  fileName: string;
  fileBuffer: string; // base64 encoded
}

export const POST = withTenantGuard(async (req: NextRequest, { tenantId }: { tenantId: string }) => {
  try {
    const body = (await req.json()) as ImportSalesRequest;
    const { fileBuffer } = body;

    if (!fileBuffer) {
      return NextResponse.json(
        { error: "Fichier manquant" },
        { status: 400 }
      );
    }

    // Décoder base64
    const buffer = Buffer.from(fileBuffer, "base64");
    const validationResult = validateSalesImport(buffer);

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

    // Créer les ventes en base
    const imported = [];
    for (const row of validationResult.imported) {
      // Vérifier que le client existe
      const client = await prisma.clientRef.findUnique({
        where: {
          tenantId_code: {
            tenantId,
            code: row.codeClient,
          },
        },
      });

      if (!client) {
        return NextResponse.json(
          {
            error: `Client non trouvé: ${row.codeClient}`,
          },
          { status: 400 }
        );
      }

      // Vérifier que le produit existe
      const product = await prisma.productRef.findUnique({
        where: {
          tenantId_code: {
            tenantId,
            code: row.codeProduit,
          },
        },
      });

      if (!product) {
        return NextResponse.json(
          {
            error: `Produit non trouvé: ${row.codeProduit}`,
          },
          { status: 400 }
        );
      }

      const sale = await prisma.sale.create({
        data: {
          tenantId,
          date: row.date,
          refFacture: row.refFacture,
          clientId: client.id,
          productId: product.id,
          quantity: row.quantité,
          puHT: row.puHT,
          montantHT: row.montantHT,
          tauxTVA: row.tauxTVA,
          montantTVA: row.montantTVA,
          montantTTC: row.montantTTC,
        },
      });
      imported.push(sale);
    }

    // Triggerrer vérification de réconciliation comptable
    // (voir endpoint réconciliation)

    return NextResponse.json({
      success: true,
      message: `${imported.length} ventes importées`,
      imported: imported.map((s) => ({
        id: s.id,
        date: s.date,
        refFacture: s.refFacture,
        montantTTC: s.montantTTC,
      })),
    });
  } catch (error) {
    console.error("Erreur import ventes:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'import" },
      { status: 500 }
    );
  }
});

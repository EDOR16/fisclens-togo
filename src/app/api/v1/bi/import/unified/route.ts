export const dynamic = "force-dynamic";

/**
 * POST /api/v1/bi/import/unified
 * Point d'entrée unique d'importation Excel pour le Workspace BI
 * Accepte n'importe quel fichier Excel (ventes, achats, clients, produits ou classeur tout-en-un)
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, GuardContext } from "@/lib/server/with-guard";
import { processUnifiedExcel } from "@/lib/bi/unified-excel-import";

interface UnifiedImportRequest {
  fileName: string;
  fileBuffer: string; // Base64
}

export const POST = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    const body = (await req.json()) as UnifiedImportRequest;
    const { fileBuffer } = body;

    if (!fileBuffer) {
      return NextResponse.json(
        { error: "Veuillez sélectionner un fichier Excel (.xlsx ou .xls)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(fileBuffer, "base64");
    const result = await processUnifiedExcel(buffer, tenantId);

    return NextResponse.json({
      success: true,
      message: result.message,
      counts: result.counts,
      warnings: result.warnings,
    });
  } catch (error: any) {
    console.error("[BI] Erreur lors de l'import unifié:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors du traitement du fichier Excel" },
      { status: 400 }
    );
  }
});

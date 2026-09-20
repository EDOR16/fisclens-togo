export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const runtime = "nodejs";
export const fetchCache = "force-no-store";

/**
 * POST /api/v1/bi/import/unified
 * Recoit une URL de blob (upload direct navigateur -> Vercel Blob, hors
 * limite de 4,5 Mo des Vercel Functions), telecharge le fichier cote
 * serveur, puis le traite normalement.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, GuardContext } from "@/lib/server/with-guard";
import { processUnifiedExcel } from "@/lib/bi/unified-excel-import";

interface UnifiedImportRequest {
  blobUrl: string;
  fileName: string;
}

export const POST = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    const body = (await req.json()) as UnifiedImportRequest;
    const { blobUrl, fileName } = body;

    if (!blobUrl) {
      return NextResponse.json(
        { error: "URL du fichier manquante (blobUrl requis)" },
        { status: 400 }
      );
    }

    const blobResponse = await fetch(blobUrl);
    if (!blobResponse.ok) {
      return NextResponse.json(
        { error: `Impossible de telecharger le fichier depuis le stockage (${blobResponse.status})` },
        { status: 400 }
      );
    }

    const arrayBuffer = await blobResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await processUnifiedExcel(buffer, tenantId);

    return NextResponse.json({
      success: true,
      message: result.message,
      counts: result.counts,
      warnings: result.warnings,
    });
  } catch (error: any) {
    console.error("[BI] Erreur lors de l'import unifie:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors du traitement du fichier Excel" },
      { status: 400 }
    );
  }
});

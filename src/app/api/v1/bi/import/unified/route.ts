export const dynamic = "force-dynamic";
export const maxDuration = 300;      // Timeout 5 min (Vercel Pro)
export const runtime = "nodejs";     // Pas edge
export const fetchCache = "force-no-store";

/**
 * POST /api/v1/bi/import/unified
 * Point d'entrée unique d'importation Excel pour le Workspace BI
 * Accepte un fichier Excel via multipart/form-data (champ "file")
 * ─────────────────────────────────────────────────────────────────
 * Avantages vs Base64-JSON :
 *  • Pas d'encodage/décodage Base64 (+33 % de taille)
 *  • Next.js ne parse pas le body JSON entier en RAM
 *  • Aucune limite de taille côté Route Handler
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, GuardContext } from "@/lib/server/with-guard";
import { processUnifiedExcel } from "@/lib/bi/unified-excel-import";

export const POST = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    const formData = await req.formData();
    const fileField = formData.get("file");

    if (!fileField || typeof fileField === "string") {
      return NextResponse.json(
        { error: "Veuillez sélectionner un fichier Excel (.xlsx ou .xls) via le champ 'file'" },
        { status: 400 }
      );
    }

    const arrayBuffer = await (fileField as File).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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


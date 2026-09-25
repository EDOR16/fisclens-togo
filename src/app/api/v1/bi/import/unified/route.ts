export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const runtime = "nodejs";
export const fetchCache = "force-no-store";

/**
 * POST /api/v1/bi/import/unified
 * Reçoit un fichier Excel via FormData (upload direct navigateur → serveur),
 * puis le traite normalement via processUnifiedExcel.
 * Plus de dépendance Vercel Blob.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, GuardContext } from "@/lib/server/with-guard";
import { processUnifiedExcel } from "@/lib/bi/unified-excel-import";

export const POST = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    console.log("[BI] Début réception FormData...");
    const t0 = Date.now();

    const formData = await req.formData();
    console.log(`[BI] FormData reçu en ${((Date.now() - t0) / 1000).toFixed(1)}s`);

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni. Champ attendu : 'file'" }, { status: 400 });
    }

    console.log(`[BI] Fichier: ${file.name}, taille: ${(file.size / 1024 / 1024).toFixed(2)} Mo`);

    const fileName = file.name;
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return NextResponse.json({ error: "Format invalide." }, { status: 400 });
    }

    const t1 = Date.now();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`[BI] Buffer prêt en ${((Date.now() - t1) / 1000).toFixed(1)}s, lancement processUnifiedExcel...`);

    const t2 = Date.now();
    const result = await processUnifiedExcel(buffer, tenantId);
    console.log(`[BI] Traitement terminé en ${((Date.now() - t2) / 1000).toFixed(1)}s — ${result.message}`);

    return NextResponse.json({ success: true, message: result.message, counts: result.counts, warnings: result.warnings });
  } catch (error: any) {
    console.error("[BI] Erreur:", error);
    return NextResponse.json({ error: error?.message || "Erreur traitement Excel" }, { status: 400 });
  }
});
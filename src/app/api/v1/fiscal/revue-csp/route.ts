export const dynamic = "force-dynamic";

/**
 * API /api/v1/fiscal/revue-csp
 * Service de Revue Fiscale & Auto-Évaluation CSP (Conformité & Sécurité Partenariale OTR)
 * Gestion des auto-évaluations et des annexes justificatives du contribuable.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, GuardContext } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";
import { runCspEvaluation, generateHash } from "@/lib/fiscal/csp-evaluation";

// GET : Récupération de l'évaluation CSP et de la liste des pièces annexées
export const GET = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const exercice = searchParams.get("exercice") || String(new Date().getFullYear());

    // Calcul en temps réel de l'auto-évaluation CSP
    const evaluation = await runCspEvaluation(tenantId, exercice);

    // Récupération des pièces justificatives annexées par le contribuable
    const attachments = await prisma.cspAttachment.findMany({
      where: { tenantId },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        mimeType: true,
        fileSize: true,
        fileHash: true,
        notes: true,
        uploadedAt: true,
      },
    });

    // Dernier snapshot enregistré si existant
    const lastSaved = await prisma.cspEvaluation.findFirst({
      where: { tenantId, exercice },
      orderBy: { generatedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        evaluation,
        attachments,
        lastSaved: lastSaved
          ? {
              id: lastSaved.id,
              score: lastSaved.score,
              grade: lastSaved.grade,
              hashCertificat: lastSaved.hashCertificat,
              generatedAt: lastSaved.generatedAt,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("[CSP] Erreur GET /api/v1/fiscal/revue-csp:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la revue fiscale CSP" },
      { status: 500 }
    );
  }
});

// POST : Enregistrement d'un snapshot CSP ou téléversement d'une pièce justificative
export const POST = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    const body = await req.json();
    const { action } = body;

    // Action 1 : Annexion d'une pièce justificative par le contribuable
    if (action === "upload_attachment") {
      const { fileName, fileType, mimeType, fileSize, fileData, notes, evaluationId } = body;

      if (!fileName || !fileData) {
        return NextResponse.json(
          { error: "Le fichier et son contenu sont obligatoires pour l'annexion" },
          { status: 400 }
        );
      }

      const fileHash = generateHash(fileData);

      const created = await prisma.cspAttachment.create({
        data: {
          tenantId,
          evaluationId: evaluationId || undefined,
          fileName,
          fileType: fileType || "DSF",
          mimeType: mimeType || "application/pdf",
          fileSize: Number(fileSize) || fileData.length,
          fileData,
          fileHash,
          notes: notes || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Pièce "${fileName}" annexée avec succès. Empreinte SHA-256 certifiée.`,
        data: created,
      });
    }

    // Action 2 : Enregistrement officiel de l'évaluation CSP (génération du certificat)
    if (action === "save_evaluation") {
      const exercice = body.exercice || String(new Date().getFullYear());
      const evaluation = await runCspEvaluation(tenantId, exercice);

      const saved = await prisma.cspEvaluation.create({
        data: {
          tenantId,
          exercice,
          score: evaluation.scoreGlobal,
          grade: evaluation.grade,
          statut: evaluation.statutGlobal,
          hashCertificat: evaluation.hashCertificat,
          detailsJson: JSON.stringify(evaluation.piliers),
          recommendations: JSON.stringify(evaluation.recommandationsPrioritaires),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Certificat d'auto-évaluation CSP enregistré et certifié.",
        data: {
          id: saved.id,
          score: saved.score,
          grade: saved.grade,
          hashCertificat: saved.hashCertificat,
        },
      });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (error: any) {
    console.error("[CSP] Erreur POST /api/v1/fiscal/revue-csp:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors du traitement CSP" },
      { status: 500 }
    );
  }
});

// DELETE : Suppression d'une pièce justificative annexée
export const DELETE = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get("id");

    if (!attachmentId) {
      return NextResponse.json({ error: "ID de pièce manquant" }, { status: 400 });
    }

    await prisma.cspAttachment.deleteMany({
      where: { id: attachmentId, tenantId },
    });

    return NextResponse.json({
      success: true,
      message: "Pièce justificative retirée de l'annexe.",
    });
  } catch (error: any) {
    console.error("[CSP] Erreur DELETE /api/v1/fiscal/revue-csp:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
});

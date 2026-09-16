export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";
import crypto from "crypto";

const LineSchema = z
  .object({
    accountCode: z
      .string()
      .regex(/^\d{3,8}$/, "Code compte SYSCOHADA (3-8 chiffres)"),
    libelle: z.string().min(1, "Libellé requis"),
    debit: z.coerce.number().int().nonnegative(),
    credit: z.coerce.number().int().nonnegative(),
  })
  .refine(
    (l) =>
      (l.debit > 0 && l.credit === 0) || (l.credit > 0 && l.debit === 0),
    {
      message:
        "Une ligne doit comporter soit un débit, soit un crédit, mais pas les deux",
    }
  );

const EntrySchema = z.object({
  journal: z.enum(["ACHATS", "VENTES", "BANQUE", "CAISSE", "OD", "PAIE"]),
  date: z.string().min(1, "Date requise"),
  piece: z.string().min(1, "N° de pièce requis"),
  libelle: z.string().optional(),
  lines: z.array(LineSchema).min(2, "Minimum 2 lignes par écriture"),
});

const BatchImportSchema = z.object({
  entries: z.array(EntrySchema).min(1, "Au moins une écriture est requise"),
  overwrite: z.boolean().optional().default(true),
});

export const POST = withGuard(async (req: NextRequest, { tenantId, user }) => {
  const body = await req.json();
  const parsed = BatchImportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const { entries, overwrite } = parsed.data;

  // 1. Vérifier si l'exercice du tenant est ouvert
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || !tenant.exerciceOuvert) {
    return NextResponse.json(
      {
        error: "EXERCICE_LOCKED",
        message: "L'exercice comptable est clôturé ou verrouillé",
      },
      { status: 423 }
    );
  }

  // 2. Valider l'équilibre strict Débit = Crédit de chaque écriture AVANT toute insertion
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const totalDebit = entry.lines.reduce((acc, l) => acc + l.debit, 0);
    const totalCredit = entry.lines.reduce((acc, l) => acc + l.credit, 0);

    if (totalDebit <= 0 || totalDebit !== totalCredit) {
      return NextResponse.json(
        {
          error: "UNBALANCED_ENTRY",
          message: `Écriture N° "${entry.piece}" (position ${i + 1}) déséquilibrée : Débit ${totalDebit.toLocaleString("fr-FR")} FCFA ≠ Crédit ${totalCredit.toLocaleString("fr-FR")} FCFA`,
          piece: entry.piece,
        },
        { status: 422 }
      );
    }
  }

  // 3. Détection préventive des doublons existants en base pour ce dossier
  const pieces = entries.map((e) => e.piece.trim());
  const existingEcritures = await prisma.ecriture.findMany({
    where: {
      tenantId,
      piece: { in: pieces },
    },
    select: { piece: true },
  });
  const existingPieceSet = new Set(
    existingEcritures.map((e) => e.piece.toUpperCase())
  );

  // 4. Insertion atomique sous transaction Prisma unique
  try {
    await prisma.$transaction(
      async (tx) => {
        // En mode idempotent / remplacement : supprimer les doublons antérieurs pour éviter la prolifération
        if (existingPieceSet.size > 0 && overwrite) {
          const duplicatePieces = Array.from(existingPieceSet);
          await tx.ecritureLine.deleteMany({
            where: {
              ecriture: {
                tenantId,
                piece: { in: duplicatePieces },
              },
            },
          });
          await tx.ecriture.deleteMany({
            where: {
              tenantId,
              piece: { in: duplicatePieces },
            },
          });
        }

        // ── Optimisation : 2 createMany séparés (écritures puis lignes)
        // Beaucoup plus rapide que create() en boucle sur gros volumes.

        // 1. Créer toutes les écritures en bulk
        const ecritureIds = entries.map(() => crypto.randomUUID());
        const ecritureData = entries.map((entry, i) => ({
          id: ecritureIds[i],
          tenantId,
          journal: entry.journal,
          date: entry.date,
          piece: entry.piece,
          libelle:
            entry.libelle ||
            entry.lines[0]?.libelle ||
            `Écriture ${entry.piece}`,
          status: "VALIDE",
        }));

        await tx.ecriture.createMany({
          data: ecritureData,
          skipDuplicates: false,
        });

        // 2. Créer toutes les lignes en bulk
        const allLines = entries.flatMap((entry, i) =>
          entry.lines.map((l) => ({
            ecritureId: ecritureIds[i],
            accountCode: l.accountCode,
            libelle: l.libelle,
            debit: l.debit,
            credit: l.credit,
          }))
        );

        await tx.ecritureLine.createMany({
          data: allLines,
          skipDuplicates: false,
        });
      },
      { timeout: 180000 }
    );
  } catch (err: any) {
    console.error("[BATCH_IMPORT_ERROR]", err);
    return NextResponse.json(
      {
        error: "IMPORT_FAILED",
        message: `Échec de l'import atomique : ${err?.message || "Erreur base de données"}`,
      },
      { status: 500 }
    );
  }

  // 5. Audit log non-bloquant
  prisma.auditLog
    .create({
      data: {
        tenantId,
        userId: user.id,
        action: "IMPORT_ECRITURE_BATCH",
        entity: "ECRITURE",
        details: JSON.stringify({
          total: entries.length,
          remplacedCount: existingPieceSet.size,
          journals: [...new Set(entries.map((e) => e.journal))],
        }),
      },
    })
    .catch((e) => console.warn("[BATCH_AUDIT_WARN]", e));

  return NextResponse.json(
    {
      success: true,
      count: entries.length,
      updatedCount: existingPieceSet.size,
      message: `${entries.length} écriture(s) importée(s) avec succès (${existingPieceSet.size} mise(s) à jour).`,
    },
    { status: 201 }
  );
});

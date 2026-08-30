export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

const LineSchema = z.object({
  accountCode: z.string().regex(/^\d{3,8}$/, "Code compte SYSCOHADA (3-8 chiffres)"),
  libelle: z.string().min(1, "Libellé requis"),
  debit: z.coerce.number().int().nonnegative(),
  credit: z.coerce.number().int().nonnegative(),
}).refine(
  (l) => (l.debit > 0 && l.credit === 0) || (l.credit > 0 && l.debit === 0),
  { message: "Une ligne doit comporter soit un débit, soit un crédit, mais pas les deux" }
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

  const { entries } = parsed.data;

  // 1. Vérifier si l'exercice du tenant est ouvert
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant || !tenant.exerciceOuvert) {
    return NextResponse.json(
      { error: "EXERCICE_LOCKED", message: "L'exercice comptable est clôturé ou verrouillé" },
      { status: 423 }
    );
  }

  // 2. Valider l'équilibre de chaque écriture
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const totalDebit = entry.lines.reduce((acc, l) => acc + l.debit, 0);
    const totalCredit = entry.lines.reduce((acc, l) => acc + l.credit, 0);

    if (totalDebit <= 0 || totalDebit !== totalCredit) {
      return NextResponse.json(
        {
          error: "UNBALANCED_ENTRY",
          message: `L'écriture N° pièce "${entry.piece}" (ligne ${i + 1}) est déséquilibrée : Débit (${totalDebit}) ≠ Crédit (${totalCredit})`,
          piece: entry.piece,
        },
        { status: 422 }
      );
    }
  }

  // 3. Enregistrer l'ensemble des écritures dans une transaction
  const createdEntries = await prisma.$transaction(async (tx) => {
    const results = [];

    for (const entry of entries) {
      const totalDebit = entry.lines.reduce((acc, l) => acc + l.debit, 0);

      const created = await tx.ecriture.create({
        data: {
          tenantId,
          journal: entry.journal,
          date: entry.date,
          piece: entry.piece,
          libelle: entry.libelle || entry.lines[0]?.libelle || `Écriture ${entry.piece}`,
          status: "VALIDE",
          lines: {
            create: entry.lines.map((l) => ({
              accountCode: l.accountCode,
              libelle: l.libelle,
              debit: l.debit,
              credit: l.credit,
            })),
          },
        },
        include: {
          lines: true,
        },
      });

      // Audit log pour chaque écriture importée
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: user.userId,
          action: "IMPORT_ECRITURE_BATCH",
          entity: "ECRITURE",
          details: JSON.stringify({
            piece: entry.piece,
            journal: entry.journal,
            date: entry.date,
            montantTotal: totalDebit,
          }),
        },
      });

      results.push(created);
    }

    return results;
  });

  return NextResponse.json(
    {
      success: true,
      count: createdEntries.length,
      entries: createdEntries,
    },
    { status: 201 }
  );
});

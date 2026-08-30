export const dynamic = 'force-dynamic';

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

const EntryFormSchema = z.object({
  journal: z.enum(["ACHATS", "VENTES", "BANQUE", "CAISSE", "OD", "PAIE"]),
  date: z.string().min(1, "Date requise"),
  piece: z.string().min(1, "N° de pièce requis"),
  documentUrl: z.string().optional(),
  documentName: z.string().optional(),
  lines: z.array(LineSchema).min(2, "Minimum 2 lignes"),
});

// GET: Récupérer les écritures du tenant
export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  const ecritures = await prisma.ecriture.findMany({
    where: { tenantId },
    include: {
      lines: true,
    },
    orderBy: {
      date: "desc",
    },
    take: 100,
  });

  return NextResponse.json({ ecritures });
});

// POST: Enregistrer une nouvelle écriture comptable SYSCOHADA
export const POST = withGuard(async (req: NextRequest, { tenantId, user }) => {
  const body = await req.json();
  const parsed = EntryFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const { journal, date, piece, documentUrl, documentName, lines } = parsed.data;

  // 1. Contrôle strict d'équilibre comptable SYSCOHADA : Σ Débit === Σ Crédit
  const totalDebit = lines.reduce((acc, l) => acc + l.debit, 0);
  const totalCredit = lines.reduce((acc, l) => acc + l.credit, 0);

  if (totalDebit <= 0 || totalDebit !== totalCredit) {
    return NextResponse.json(
      {
        error: "UNBALANCED_ENTRY",
        message: `Écriture comptable déséquilibrée : Total Débit (${totalDebit} FCFA) ≠ Total Crédit (${totalCredit} FCFA). Écart : ${Math.abs(totalDebit - totalCredit)} FCFA`,
        totalDebit,
        totalCredit,
        diff: Math.abs(totalDebit - totalCredit),
      },
      { status: 422 }
    );
  }

  // 2. Vérifier si l'exercice du tenant est ouvert
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant || !tenant.exerciceOuvert) {
    return NextResponse.json(
      { error: "EXERCICE_LOCKED", message: "L'exercice comptable est clôturé ou verrouillé" },
      { status: 423 }
    );
  }

  // 3. Un compte doit appartenir au tenant, ne pas être archivé et être saisissable.
  const accountCodes = [...new Set(lines.map((line) => line.accountCode))];
  const accounts = await prisma.comptePlan.findMany({
    where: { tenantId, code: { in: accountCodes } },
    select: { code: true, postable: true, archived: true },
  });
  const byCode = new Map(accounts.map((account) => [account.code, account]));
  const unavailable = accountCodes.find((code) => !byCode.has(code) || byCode.get(code)?.archived);
  if (unavailable) {
    return NextResponse.json({ error: "COMPTE_INDISPONIBLE", message: `Compte ${unavailable} introuvable ou archivé` }, { status: 422 });
  }
  const root = accountCodes.find((code) => !byCode.get(code)?.postable);
  if (root) {
    return NextResponse.json({ error: "COMPTE_NON_POSTABLE", message: `Le compte racine ${root} ne peut pas recevoir d'écriture` }, { status: 422 });
  }

  // 4. Enregistrer l'écriture et ses lignes dans une transaction
  const ecriture = await prisma.$transaction(async (tx) => {
    const created = await tx.ecriture.create({
      data: {
        tenantId,
        journal,
        date,
        piece,
        libelle: lines[0]?.libelle ?? `Écriture ${piece}`,
        documentUrl: documentUrl || null,
        documentName: documentName || null,
        status: "VALIDE",
        lines: {
          create: lines.map((l) => ({
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

    // Audit log
    await tx.auditLog.create({
      data: {
        tenantId,
        userId: user.userId,
        action: "CREATE_ECRITURE",
        entity: "ECRITURE",
        details: JSON.stringify({
          piece,
          journal,
          date,
          montantTotal: totalDebit,
        }),
      },
    });

    return created;
  });

  return NextResponse.json(ecriture, { status: 201 });
});

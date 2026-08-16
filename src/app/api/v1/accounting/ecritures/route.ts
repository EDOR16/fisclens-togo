import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

const LineSchema = z.object({
  accountCode: z.string().regex(/^\d{3,8}$/, "Code compte SYSCOHADA (3-8 chiffres)"),
  libelle: z.string().min(1, "Libellé requis"),
  debit: z.coerce.number().int().nonnegative(),
  credit: z.coerce.number().int().nonnegative(),
});

const EntryFormSchema = z.object({
  journal: z.enum(["ACHATS", "VENTES", "BANQUE", "CAISSE", "OD", "PAIE"]),
  date: z.string().min(1, "Date requise"),
  piece: z.string().min(1, "N° de pièce requis"),
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
      createdAt: "desc",
    },
    take: 50,
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

  const { journal, date, piece, lines } = parsed.data;

  // 1. Contrôle d'équilibre comptable SYSCOHADA : Σ Débit = Σ Crédit
  const totalDebit = lines.reduce((acc, l) => acc + l.debit, 0);
  const totalCredit = lines.reduce((acc, l) => acc + l.credit, 0);

  if (totalDebit <= 0 || totalDebit !== totalCredit) {
    return NextResponse.json(
      {
        error: "UNBALANCED_ENTRY",
        message: `L'écriture n'est pas équilibrée : Débit (${totalDebit}) ≠ Crédit (${totalCredit})`,
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

  // 3. Enregistrer l'écriture et ses lignes dans une transaction
  const ecriture = await prisma.$transaction(async (tx) => {
    const created = await tx.ecriture.create({
      data: {
        tenantId,
        journal,
        date,
        piece,
        libelle: lines[0]?.libelle ?? `Écriture ${piece}`,
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

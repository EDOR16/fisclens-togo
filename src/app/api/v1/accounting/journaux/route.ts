export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  const url = new URL(req.url);
  const journal = url.searchParams.get("journal");
  const periode = url.searchParams.get("periode");

  const whereClause: {
    tenantId: string;
    journal?: string;
    date?: { startsWith: string };
  } = { tenantId };

  if (journal) {
    whereClause.journal = journal;
  }
  if (periode) {
    whereClause.date = { startsWith: periode };
  }

  const ecritures = await prisma.ecriture.findMany({
    where: whereClause,
    include: { lines: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  // ✅ Conversion explicite BigInt → Number pour éviter "Do not know how to serialize a BigInt"
  const safeEcritures = ecritures.map((e) => ({
    id: e.id,
    journal: e.journal,
    date: e.date,
    piece: e.piece,
    libelle: e.libelle,
    status: e.status,
    documentUrl: e.documentUrl,
    documentName: e.documentName,
    lines: e.lines.map((l) => ({
      id: l.id,
      accountCode: l.accountCode,
      libelle: l.libelle,
      debit: Number(l.debit),
      credit: Number(l.credit),
    })),
  }));

  const flatRows = safeEcritures.flatMap((e) =>
    e.lines.map((l) => ({
      id: l.id,
      ecritureId: e.id,
      date: e.date,
      piece: e.piece,
      journal: e.journal,
      documentUrl: e.documentUrl,
      documentName: e.documentName,
      accountCode: l.accountCode,
      libelle: l.libelle,
      debit: l.debit,
      credit: l.credit,
    }))
  );

  const totalDebit = flatRows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = flatRows.reduce((s, r) => s + r.credit, 0);

  return NextResponse.json({
    journal: journal || "ALL",
    periode: periode || "ALL",
    ecritures: safeEcritures,
    rows: flatRows,
    totals: { totalDebit, totalCredit },
  });
});
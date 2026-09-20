export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  const url = new URL(req.url);
  const accountCode = url.searchParams.get("accountCode");
  const exercice = url.searchParams.get("exercice");
  const includeBrouillons = url.searchParams.get("brouillon") === "true";

  const statusFilter = includeBrouillons ? {} : { status: { in: ["VALIDE", "CLOTURE"] } };
  const dateFilter = exercice ? { date: { startsWith: exercice } } : {};

  // Récupérer la liste des comptes mouvementés
  const distinctAccounts = await prisma.ecritureLine.findMany({
    where: {
      ecriture: {
        tenantId,
        ...statusFilter,
        ...dateFilter,
      },
    },
    select: {
      accountCode: true,
    },
    distinct: ["accountCode"],
  });

  const availableAccountCodes = distinctAccounts.map((a) => a.accountCode).sort();

  // Si aucun compte spécifié, prendre le premier disponible ou 411000
  const selectedAccount = accountCode || availableAccountCodes[0] || "411000";

  // Récupérer les lignes de ce compte avec les informations de l'écriture
  const lines = await prisma.ecritureLine.findMany({
    where: {
      accountCode: selectedAccount,
      ecriture: {
        tenantId,
        ...statusFilter,
        ...dateFilter,
      },
    },
    include: {
      ecriture: true,
    },
    orderBy: [
      { ecriture: { date: "asc" } },
      { createdAt: "asc" },
    ],
  });

  // Récupérer l'intitulé du compte
  const compteDb = await prisma.comptePlan.findUnique({
    where: {
      tenantId_code: {
        tenantId,
        code: selectedAccount,
      },
    },
  });

  // Calcul du solde progressif
  let cumulative = 0;
  const computedLines = lines.map((l) => {
    // ✅ Conversion explicite BigInt -> Number pour le calcul du solde progressif
    cumulative += Number(l.debit) - Number(l.credit);
    return {
      id: l.id,
      date: l.ecriture.date,
      piece: l.ecriture.piece,
      journal: l.ecriture.journal,
      libelle: l.libelle,
      debit: Number(l.debit),
      credit: Number(l.credit),
      balance: cumulative,
    };
  });

  // ✅ Conversion explicite BigInt -> Number pour les totaux
  const totalDebit = lines.reduce((s, l) => s + Number(l.debit), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit), 0);
  const finalBalance = totalDebit - totalCredit;

  return NextResponse.json({
    accountCode: selectedAccount,
    accountName: compteDb?.libelle || lines[0]?.libelle || `Compte ${selectedAccount}`,
    availableAccounts: availableAccountCodes,
    lines: computedLines,
    totals: {
      totalDebit,
      totalCredit,
      finalBalance,
    },
  });
});
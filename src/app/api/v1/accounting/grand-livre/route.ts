import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  const url = new URL(req.url);
  const accountCode = url.searchParams.get("accountCode");

  // Récupérer la liste des comptes mouvementés
  const distinctAccounts = await prisma.ecritureLine.findMany({
    where: {
      ecriture: { tenantId },
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
      ecriture: { tenantId },
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
    cumulative += l.debit - l.credit;
    return {
      id: l.id,
      date: l.ecriture.date,
      piece: l.ecriture.piece,
      journal: l.ecriture.journal,
      libelle: l.libelle,
      debit: l.debit,
      credit: l.credit,
      balance: cumulative,
    };
  });

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
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

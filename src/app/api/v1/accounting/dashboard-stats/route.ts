import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  // Récupérer toutes les lignes du tenant
  const lines = await prisma.ecritureLine.findMany({
    where: {
      ecriture: { tenantId },
    },
    include: {
      ecriture: true,
    },
  });

  // Calcul du Chiffre d'affaires (Comptes Classe 70 : Crédit - Débit)
  const caLines = lines.filter((l) => l.accountCode.startsWith("70"));
  const chiffreAffaires = caLines.reduce((s, l) => s + (l.credit - l.debit), 0);

  // Calcul des Charges (Comptes Classe 6 : Débit - Crédit)
  const chargeLines = lines.filter((l) => l.accountCode.startsWith("6"));
  const totalCharges = chargeLines.reduce((s, l) => s + (l.debit - l.credit), 0);

  // TVA Collectée (4431)
  const tvaColLines = lines.filter((l) => l.accountCode.startsWith("4431"));
  const tvaCollectee = tvaColLines.reduce((s, l) => s + (l.credit - l.debit), 0);

  // TVA Déductible (4451, 4452)
  const tvaDedLines = lines.filter(
    (l) => l.accountCode.startsWith("4451") || l.accountCode.startsWith("4452")
  );
  const tvaDeductible = tvaDedLines.reduce((s, l) => s + (l.debit - l.credit), 0);
  const tvaADeclarer = Math.max(0, tvaCollectee - tvaDeductible);

  // Dernières écritures
  const recentEcritures = await prisma.ecriture.findMany({
    where: { tenantId },
    include: {
      lines: true,
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 5,
  });

  const formattedRecent = recentEcritures.map((e) => {
    const debit = e.lines.reduce((s, l) => s + l.debit, 0);
    const credit = e.lines.reduce((s, l) => s + l.credit, 0);
    return {
      date: e.date,
      piece: e.piece,
      journal: e.journal,
      libelle: e.libelle || e.lines[0]?.libelle || `Écriture ${e.piece}`,
      debit,
      credit,
    };
  });

  return NextResponse.json({
    chiffreAffaires: Math.max(0, chiffreAffaires),
    totalCharges: Math.max(0, totalCharges),
    tvaADeclarer,
    totalEcrituresCount: recentEcritures.length,
    recentEntries: formattedRecent,
  });
});

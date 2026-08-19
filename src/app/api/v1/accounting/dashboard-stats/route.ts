export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  // 1. Récupérer toutes les lignes du tenant
  const lines = await prisma.ecritureLine.findMany({
    where: {
      ecriture: { tenantId, status: "VALIDE" },
    },
    include: {
      ecriture: true,
    },
  });

  // 2. Chiffre d'affaires (Comptes Classe 7 : Crédit - Débit)
  const caLines = lines.filter((l) => l.accountCode.startsWith("7"));
  const chiffreAffaires = caLines.reduce((s, l) => s + (l.credit - l.debit), 0);

  // 3. Charges d'exploitation (Comptes Classe 6 : Débit - Crédit)
  const chargeLines = lines.filter((l) => l.accountCode.startsWith("6"));
  const totalCharges = chargeLines.reduce((s, l) => s + (l.debit - l.credit), 0);

  // 4. Trésorerie nette (Comptes Classe 5 : 521 Banque + 571 Caisse)
  const tresorerieLines = lines.filter((l) => l.accountCode.startsWith("5"));
  const tresorerie = tresorerieLines.reduce((s, l) => s + (l.debit - l.credit), 0);

  // 5. Encours Clients (Compte 411 : Débit - Crédit)
  const clientLines = lines.filter((l) => l.accountCode.startsWith("411"));
  const encoursClients = Math.max(0, clientLines.reduce((s, l) => s + (l.debit - l.credit), 0));

  // 6. Encours Fournisseurs (Compte 401 : Crédit - Débit)
  const fournisseurLines = lines.filter((l) => l.accountCode.startsWith("401"));
  const encoursFournisseurs = Math.max(0, fournisseurLines.reduce((s, l) => s + (l.credit - l.debit), 0));

  // 7. TVA Collectée (4431) & TVA Déductible (4451, 4452)
  const tvaColLines = lines.filter((l) => l.accountCode.startsWith("4431"));
  const tvaCollectee = tvaColLines.reduce((s, l) => s + (l.credit - l.debit), 0);

  const tvaDedLines = lines.filter(
    (l) => l.accountCode.startsWith("4451") || l.accountCode.startsWith("4452")
  );
  const tvaDeductible = tvaDedLines.reduce((s, l) => s + (l.debit - l.credit), 0);
  const tvaADeclarer = Math.max(0, tvaCollectee - tvaDeductible);
  const creditTva = Math.max(0, tvaDeductible - tvaCollectee);

  // 8. Dernières écritures enregistrées
  const recentEcritures = await prisma.ecriture.findMany({
    where: { tenantId },
    include: {
      lines: true,
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 10,
  });

  const formattedRecent = recentEcritures.map((e) => {
    const debit = e.lines.reduce((s, l) => s + l.debit, 0);
    const credit = e.lines.reduce((s, l) => s + l.credit, 0);
    return {
      id: e.id,
      date: e.date,
      piece: e.piece,
      journal: e.journal,
      libelle: e.libelle || e.lines[0]?.libelle || `Écriture ${e.piece}`,
      debit,
      credit,
      status: e.status,
    };
  });

  // Total des écritures
  const totalEcrituresCount = await prisma.ecriture.count({
    where: { tenantId },
  });

  return NextResponse.json({
    chiffreAffaires,
    totalCharges,
    resultatNet: chiffreAffaires - totalCharges,
    tresorerie,
    encoursClients,
    encoursFournisseurs,
    tvaCollectee,
    tvaDeductible,
    tvaADeclarer,
    creditTva,
    totalEcrituresCount,
    recentEntries: formattedRecent,
  });
});

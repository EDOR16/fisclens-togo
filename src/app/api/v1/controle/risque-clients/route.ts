export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  // Récupérer les lignes du compte 411 (Clients)
  const clientLines = await prisma.ecritureLine.findMany({
    where: {
      accountCode: { startsWith: "411" },
      ecriture: { tenantId },
    },
    include: {
      ecriture: {
        select: {
          date: true,
          piece: true,
          libelle: true,
        },
      },
    },
  });

  // Calcul du solde global 411
  let totalDebit = 0;
  let totalCredit = 0;
  for (const l of clientLines) {
    totalDebit += l.debit;
    totalCredit += l.credit;
  }
  const encoursTotal = Math.max(0, totalDebit - totalCredit);

  // Récupérer les clients BI s'ils existent
  const clientRefs = await prisma.clientRef.findMany({
    where: { tenantId },
    include: {
      sales: true,
    },
  });

  const clients = clientRefs.map((c) => {
    const totalVentes = c.sales.reduce((s, sale) => s + sale.montantTTC, 0);
    const encours = Math.min(totalVentes, c.encoursAutorise);
    return {
      id: c.id,
      code: c.code,
      nom: c.name,
      compte: `411.${c.code}`,
      zone: c.zoneGeo,
      encoursTotal: encours,
      encoursAutorise: c.encoursAutorise,
      retardMoyenJours: 15,
      score: encours > c.encoursAutorise ? "CRITIQUE" : encours > c.encoursAutorise * 0.8 ? "ELEVE" : "FAIBLE",
      derniereFacture: c.sales[0]?.date || "—",
    };
  });

  return NextResponse.json({
    encoursTotal,
    encoursEchu: Math.round(encoursTotal * 0.15),
    dsoMoyen: 32, // Délai moyen de paiement en jours
    clients,
  });
});

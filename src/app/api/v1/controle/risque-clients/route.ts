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

  // Calcul du solde global 411 avec conversion BigInt → number
  let totalDebit = 0;
  let totalCredit = 0;
  for (const l of clientLines) {
    totalDebit += Number(l.debit);
    totalCredit += Number(l.credit);
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
    const totalVentes = c.sales.reduce(
      (s, sale) => s + Number(sale.montantTTC),
      0
    );
    const encoursAutorise = Number(c.encoursAutorise);
    const encours = Math.min(totalVentes, encoursAutorise);
    return {
      id: c.id,
      code: c.code,
      nom: c.name,
      compte: `411.${c.code}`,
      zone: c.zoneGeo,
      encoursTotal: encours,
      encoursAutorise: encoursAutorise,
      retardMoyenJours: 15,
      score:
        encours > encoursAutorise
          ? ("CRITIQUE" as const)
          : encours > encoursAutorise * 0.8
            ? ("ELEVE" as const)
            : ("FAIBLE" as const),
      derniereFacture: c.sales[0]?.date || "—",
    };
  });

  return NextResponse.json({
    encoursTotal,
    encoursEchu: Math.round(encoursTotal * 0.15),
    dsoMoyen: 32,
    clients,
  });
});
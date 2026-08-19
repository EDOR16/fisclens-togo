export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";
import { calculateTogoIS } from "@/lib/fiscal/togo-rules";

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  const url = new URL(req.url);
  const exercice = url.searchParams.get("exercice") || "2025";

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  // Récupérer toutes les écritures de l'exercice
  const lines = await prisma.ecritureLine.findMany({
    where: {
      ecriture: {
        tenantId,
        date: { startsWith: exercice },
      },
    },
  });

  // Produits (Classe 7) : Crédit - Débit
  const produitsLines = lines.filter((l) => l.accountCode.startsWith("7"));
  const totalProduits = produitsLines.reduce((s, l) => s + (l.credit - l.debit), 0);

  // Ventes pures (70)
  const ventesLines = lines.filter((l) => l.accountCode.startsWith("70"));
  const chiffreAffaires = ventesLines.reduce((s, l) => s + (l.credit - l.debit), 0);

  // Charges (Classe 6) : Débit - Crédit
  const chargesLines = lines.filter((l) => l.accountCode.startsWith("6"));
  const totalCharges = chargesLines.reduce((s, l) => s + (l.debit - l.credit), 0);

  // Calcul IS vs IMF
  const isResult = calculateTogoIS({
    chiffreAffairesHt: Math.max(0, chiffreAffaires),
    totalProduits: Math.max(0, totalProduits),
    totalCharges: Math.max(0, totalCharges),
    reintegrationsFiscales: 0,
    deductionsFiscales: 0,
  });

  return NextResponse.json({
    tenant: {
      name: tenant?.name || "Entreprise",
      nif: tenant?.nif || "",
      regime: tenant?.regime || "REEL_NORMAL",
    },
    exercice,
    calculation: isResult,
  });
});

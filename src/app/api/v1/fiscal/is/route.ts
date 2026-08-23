export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";
import { calculateTogoIS } from "@/lib/fiscal/togo-rules";

/**
 * Calcule le chiffre d'affaires, les produits et les charges d'un exercice
 * donné à partir des écritures comptables (classes 6 et 7 SYSCOHADA).
 */
async function computeExerciceBase(tenantId: string, exercice: string) {
  const lines = await prisma.ecritureLine.findMany({
    where: {
      ecriture: {
        tenantId,
        date: { startsWith: exercice },
      },
    },
  });

  const produitsLines = lines.filter((l) => l.accountCode.startsWith("7"));
  const totalProduits = produitsLines.reduce((s, l) => s + (l.credit - l.debit), 0);

  const ventesLines = lines.filter((l) => l.accountCode.startsWith("70"));
  const chiffreAffaires = ventesLines.reduce((s, l) => s + (l.credit - l.debit), 0);

  const chargesLines = lines.filter((l) => l.accountCode.startsWith("6"));
  const totalCharges = chargesLines.reduce((s, l) => s + (l.debit - l.credit), 0);

  return {
    chiffreAffairesHt: Math.max(0, chiffreAffaires),
    totalProduits: Math.max(0, totalProduits),
    totalCharges: Math.max(0, totalCharges),
    hasEcritures: lines.length > 0,
  };
}

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  const url = new URL(req.url);
  const exercice = url.searchParams.get("exercice") || "2025";
  const exercicePrecedent = String(Number(exercice) - 1);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  // Exercice courant
  const base = await computeExerciceBase(tenantId, exercice);

  // Exercice précédent — sert uniquement à déterminer la base des 4 acomptes
  // provisionnels [Art. 114 CGI : quart des cotisations du dernier exercice clos]
  const basePrecedente = await computeExerciceBase(tenantId, exercicePrecedent);

  let impotExercicePrecedent: number | undefined;
  if (basePrecedente.hasEcritures) {
    const resultatPrecedent = calculateTogoIS({
      chiffreAffairesHt: basePrecedente.chiffreAffairesHt,
      totalProduits: basePrecedente.totalProduits,
      totalCharges: basePrecedente.totalCharges,
      reintegrationsFiscales: 0,
      deductionsFiscales: 0,
    });
    impotExercicePrecedent = resultatPrecedent.impotExigible;
  }
  // Si aucune écriture sur l'exercice précédent (entreprise nouvelle ou premier
  // exercice suivi dans FiscLens), les acomptes restent à 0 — l'utilisateur devra
  // les saisir manuellement le temps d'avoir un historique, ou ils seront exemptés
  // au titre des 12 premiers mois d'exploitation [Art. 121, pour le MFP].

  const isResult = calculateTogoIS({
    chiffreAffairesHt: base.chiffreAffairesHt,
    totalProduits: base.totalProduits,
    totalCharges: base.totalCharges,
    reintegrationsFiscales: 0,
    deductionsFiscales: 0,
    impotExercicePrecedent,
  });

  return NextResponse.json({
    tenant: {
      name: tenant?.name || "Entreprise",
      nif: tenant?.nif || "",
      regime: tenant?.regime || "REEL_NORMAL",
    },
    exercice,
    exercicePrecedentDisponible: basePrecedente.hasEcritures,
    calculation: isResult,
  });
});
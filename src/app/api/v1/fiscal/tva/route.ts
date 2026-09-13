export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";
import { calculateTogoTva } from "@/lib/fiscal/togo-rules";

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  const url = new URL(req.url);
  const periode = url.searchParams.get("periode"); // YYYY-MM

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  // Filtrer les écritures
  const dateFilter = periode ? { startsWith: periode } : undefined;

  const lines = await prisma.ecritureLine.findMany({
    where: {
      ecriture: {
        tenantId,
        ...(dateFilter ? { date: dateFilter } : {}),
      },
    },
  });

  // Calculs sur base des écritures réelles
  const ventesLines = lines.filter((l) => l.accountCode.startsWith("70"));
  const ventesHt = ventesLines.reduce((s, l) => s + (l.credit - l.debit), 0);

  // TVA Collectée (compte 4431 / 443x)
  const tvaColLines = lines.filter((l) => l.accountCode.startsWith("4431") || l.accountCode.startsWith("443"));
  const tvaCollecteeComptabilisee = tvaColLines.reduce((s, l) => s + (l.credit - l.debit), 0);

  // TVA Déductible sur immobilisations (compte 4451)
  const tvaImmoLines = lines.filter((l) => l.accountCode.startsWith("4451"));
  const tvaImmo = tvaImmoLines.reduce((s, l) => s + (l.debit - l.credit), 0);

  // TVA Déductible sur achats & services (comptes 4452, 4453, 4454 — exclusion stricte de 4456 TVA à décaisser)
  const tvaServicesLines = lines.filter(
    (l) =>
      l.accountCode.startsWith("4452") ||
      l.accountCode.startsWith("4453") ||
      l.accountCode.startsWith("4454")
  );
  const tvaServices = tvaServicesLines.reduce((s, l) => s + (l.debit - l.credit), 0);

  const ventesTaxablesHt = Math.max(0, ventesHt);
  const result = calculateTogoTva({
    ventesTaxablesHt,
    achatsImmoTva: Math.max(0, tvaImmo),
    achatsBiensServicesTva: Math.max(0, tvaServices),
    creditReportePrecedent: 0,
    prorataDeductionPct: 100,
  });

  const tvaCollectee = tvaColLines.length > 0 ? Math.max(0, tvaCollecteeComptabilisee) : result.tvaCollectee;
  const totalDeductions = result.tvaDeductibleApresProrata;
  const tvaNetteDue = Math.max(0, tvaCollectee - totalDeductions);
  const creditReportable = Math.max(0, totalDeductions - tvaCollectee);

  return NextResponse.json({
    tenant: {
      name: tenant?.name || "Entreprise",
      nif: tenant?.nif || "",
      regime: tenant?.regime || "REEL_NORMAL",
    },
    periode: periode || new Date().toISOString().slice(0, 7),
    calculation: {
      ...result,
      ventesTaxablesHt,
      tvaCollectee,
      tvaNetteDue,
      creditReportable,
    },
  });
});

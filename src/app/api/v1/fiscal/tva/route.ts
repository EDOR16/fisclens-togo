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

  const tvaImmoLines = lines.filter((l) => l.accountCode.startsWith("4451"));
  const tvaImmo = tvaImmoLines.reduce((s, l) => s + (l.debit - l.credit), 0);

  const tvaServicesLines = lines.filter((l) => l.accountCode.startsWith("4452"));
  const tvaServices = tvaServicesLines.reduce((s, l) => s + (l.debit - l.credit), 0);

  const result = calculateTogoTva({
    ventesTaxablesHt: Math.max(0, ventesHt),
    achatsImmoTva: Math.max(0, tvaImmo),
    achatsBiensServicesTva: Math.max(0, tvaServices),
    creditReportePrecedent: 0,
    prorataDeductionPct: 100,
  });

  return NextResponse.json({
    tenant: {
      name: tenant?.name || "Entreprise",
      nif: tenant?.nif || "",
      regime: tenant?.regime || "REEL_NORMAL",
    },
    periode: periode || new Date().toISOString().slice(0, 7),
    calculation: result,
  });
});

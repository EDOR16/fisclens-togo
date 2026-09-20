export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";
import { calculateTogoPayroll } from "@/lib/fiscal/togo-rules";

const PayrollInputSchema = z.object({
  salaireBrut: z.coerce.number().int().positive("Le salaire brut doit être supérieur à 0"),
  nombreChargesFamille: z.coerce.number().int().min(0).max(6).optional().default(0),
});

export const POST = withGuard(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = PayrollInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const result = calculateTogoPayroll({
    salaireBrut: parsed.data.salaireBrut,
    nombreChargesFamille: parsed.data.nombreChargesFamille,
  });

  return NextResponse.json(result);
});

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  const url = new URL(req.url);
  const exercice = url.searchParams.get("exercice") || new Date().getFullYear().toString();
  const periode = url.searchParams.get("periode"); // Optionnel YYYY-MM

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  // Filtrer les écritures sur l'exercice ou la période
  const dateFilter = periode
    ? { startsWith: periode }
    : { startsWith: exercice };

  const lines = await prisma.ecritureLine.findMany({
    where: {
      ecriture: {
        tenantId,
        date: dateFilter,
      },
    },
    include: {
      ecriture: {
        select: {
          date: true,
          journal: true,
          piece: true,
          libelle: true,
        },
      },
    },
  });

  // 1. Salaires bruts (Compte 661xxx)
  const brutLines = lines.filter((l) => l.accountCode.startsWith("661") || l.accountCode.startsWith("662") || l.accountCode.startsWith("663"));
  const totalBrut = brutLines.reduce((s, l) => s + (Number(l.debit) - Number(l.credit)), 0);

  // 2. Charges patronales CNSS & AMU (Compte 664xxx)
  const patronalesLines = lines.filter((l) => l.accountCode.startsWith("664"));
  const totalCnssPatronale = patronalesLines.reduce((s, l) => s + (Number(l.debit) - Number(l.credit)), 0);

  // 3. IRPP retenu à la source (Compte 4471xxx / 447xxx)
  const irppLines = lines.filter((l) => l.accountCode.startsWith("4471") || l.accountCode.startsWith("447"));
  const totalIrpp = irppLines.reduce((s, l) => s + (Number(l.credit) - Number(l.debit)), 0);

  // 4. Sécurité sociale CNSS globale (Compte 431xxx)
  const cnssLines = lines.filter((l) => l.accountCode.startsWith("431") || l.accountCode.startsWith("438"));
  const totalCnss = cnssLines.reduce((s, l) => s + (Number(l.credit) - Number(l.debit)), 0);
  // CNSS salariale estimée = Total CNSS due - CNSS patronale (ou estimation 4% sur brut)
  const totalCnssSalariale = Math.max(0, totalCnss - totalCnssPatronale) || Math.round(totalBrut * 0.04);

  // 5. Salaires nets versés (Compte 421xxx)
  const netLines = lines.filter((l) => l.accountCode.startsWith("421"));
  // Paiements réels effectués (débit du compte 421 = sorties de trésorerie vers le personnel).
  // Ne pas utiliser (credit - debit) ni l'opérateur || : si le solde net du compte est
  // légitimement 0 (accrual et paiement soldés sur la même période), le fallback
  // Math.max(0, totalBrut - totalCnssSalariale - totalIrpp) écrasait ce résultat correct
  // par une estimation potentiellement fausse en cas de paiement partiel ou différé.
  const totalNet = netLines.reduce((s, l) => s + Number(l.debit), 0);

  // Regroupement par mois pour l'historique
  const monthlyMap = new Map<string, {
    mois: string;
    brut: number;
    cnssPatronale: number;
    irpp: number;
    net: number;
    nbEcritures: number;
  }>();

  for (const l of lines) {
    const mois = l.ecriture.date.slice(0, 7);
    const existing = monthlyMap.get(mois) || {
      mois,
      brut: 0,
      cnssPatronale: 0,
      irpp: 0,
      net: 0,
      nbEcritures: 0,
    };

    if (l.accountCode.startsWith("661") || l.accountCode.startsWith("662")) {
      existing.brut += (Number(l.debit) - Number(l.credit));
    }
    if (l.accountCode.startsWith("664")) {
      existing.cnssPatronale += (Number(l.debit) - Number(l.credit));
    }
    if (l.accountCode.startsWith("4471") || l.accountCode.startsWith("447")) {
      existing.irpp += (Number(l.credit) - Number(l.debit));
    }
    if (l.accountCode.startsWith("421")) {
      existing.net += Number(l.debit);
    }
    existing.nbEcritures += 1;
    monthlyMap.set(mois, existing);
  }

  const monthlyHistory = Array.from(monthlyMap.values()).sort((a, b) => b.mois.localeCompare(a.mois));

  return NextResponse.json({
    tenant: {
      name: tenant?.name || "Entreprise",
      nif: tenant?.nif || "",
      regime: tenant?.regime || "REEL_NORMAL",
    },
    exercice,
    periode: periode || null,
    hasEcritures: lines.length > 0,
    hasPayrollEcritures: (totalBrut > 0 || totalIrpp > 0 || totalCnss > 0),
    totals: {
      totalBrut: Math.max(0, totalBrut),
      totalCnssSalariale: Math.max(0, totalCnssSalariale),
      totalCnssPatronale: Math.max(0, totalCnssPatronale),
      totalIrpp: Math.max(0, totalIrpp),
      totalNet: Math.max(0, totalNet),
      coutTotalEmployeur: Math.max(0, totalBrut + totalCnssPatronale),
      nbEcritures: lines.length,
    },
    monthlyHistory,
  });
});

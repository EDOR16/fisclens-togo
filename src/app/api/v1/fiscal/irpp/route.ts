export const dynamic = 'force-dynamic';

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
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  const employees: Array<{ nom: string; poste: string; payroll: ReturnType<typeof calculateTogoPayroll> }> = [];

  const totalBrut = 0;
  const totalCnssSalariale = 0;
  const totalCnssPatronale = 0;
  const totalIrpp = 0;
  const totalNet = 0;

  return NextResponse.json({
    tenant: {
      name: tenant?.name || "Entreprise",
      nif: tenant?.nif || "",
    },
    employees,
    totals: {
      totalBrut,
      totalCnssSalariale,
      totalCnssPatronale,
      totalIrpp,
      totalNet,
      nbEmployees: 0,
    },
  });
});

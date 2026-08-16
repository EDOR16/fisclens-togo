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

  // Exemple d'effectif standard pour le tenant
  const defaultEmployees = [
    { nom: "Kofi Mensah", poste: "Directeur Général", salaireBrut: 1_200_000, charges: 3 },
    { nom: "Afi Delali", poste: "Responsable Comptable", salaireBrut: 650_000, charges: 2 },
    { nom: "Komla Agbeko", poste: "Commercial Senior", salaireBrut: 450_000, charges: 1 },
    { nom: "Kodjo Tossou", poste: "Assistant Administratif", salaireBrut: 250_000, charges: 0 },
  ];

  const processedEmployees = defaultEmployees.map((e) => ({
    nom: e.nom,
    poste: e.poste,
    payroll: calculateTogoPayroll({
      salaireBrut: e.salaireBrut,
      nombreChargesFamille: e.charges,
    }),
  }));

  const totalBrut = processedEmployees.reduce((s, e) => s + e.payroll.salaireBrut, 0);
  const totalCnssSalariale = processedEmployees.reduce((s, e) => s + e.payroll.cnssSalariale, 0);
  const totalCnssPatronale = processedEmployees.reduce((s, e) => s + e.payroll.cnssPatronale, 0);
  const totalIrpp = processedEmployees.reduce((s, e) => s + e.payroll.irppNet, 0);
  const totalNet = processedEmployees.reduce((s, e) => s + e.payroll.netAPayer, 0);

  return NextResponse.json({
    tenant: {
      name: tenant?.name || "Entreprise",
      nif: tenant?.nif || "",
    },
    employees: processedEmployees,
    totals: {
      totalBrut,
      totalCnssSalariale,
      totalCnssPatronale,
      totalIrpp,
      totalNet,
      nbEmployees: processedEmployees.length,
    },
  });
});

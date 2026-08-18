/**
 * GET /api/v1/bi/dashboard/overview
 * Vue d'ensemble : KPIs clés
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard } from "@/lib/server/with-guard";
import { calculateGlobalKPIs } from "@/lib/bi/aggregates";

export const GET = withTenantGuard(async (req: NextRequest, tenantId: string) => {
  try {
    const kpis = await calculateGlobalKPIs(tenantId);

    return NextResponse.json({
      success: true,
      data: {
        ca: kpis.ca,
        margeBrute: kpis.margeBrute,
        margePercent: kpis.margePercent,
        trésorerie: kpis.trésorerie,
        clientsActifs: kpis.clientsActifs,
        tendanceVsN1: kpis.tendanceVsN1,
      },
    });
  } catch (error) {
    console.error("Erreur dashboard overview:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
});

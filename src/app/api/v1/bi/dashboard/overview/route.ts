export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/bi/dashboard/overview
 * Vue d'ensemble : KPIs clés
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, GuardContext } from "@/lib/server/with-guard";
import { calculateGlobalKPIs, getRealCaTrend, getDatasetSqlIntegrity } from "@/lib/bi/aggregates";

export const GET = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    const [kpis, trendCA, sqlIntegrity] = await Promise.all([
      calculateGlobalKPIs(tenantId),
      getRealCaTrend(tenantId),
      getDatasetSqlIntegrity(tenantId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ca: kpis.ca,
        margeBrute: kpis.margeBrute,
        margePercent: kpis.margePercent,
        trésorerie: kpis.trésorerie,
        clientsActifs: kpis.clientsActifs,
        tendanceVsN1: kpis.tendanceVsN1,
        trendCA,
        sqlIntegrity,
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

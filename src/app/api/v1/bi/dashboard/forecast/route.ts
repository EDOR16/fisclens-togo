export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/bi/dashboard/forecast
 * Dashboard Prévisions : CA projeté, trésorerie 90j, simulateur what-if
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard } from "@/lib/server/with-guard";
import {
  forecastCA,
  forecastTreasury,
  simulateWhatIf,
} from "@/lib/bi/forecasting";

export const GET = withTenantGuard(async (req: NextRequest, { tenantId }: { tenantId: string }) => {
  try {
    // Prévisions CA 30 jours
    const caForecast = await forecastCA(tenantId, 30);

    // Prévisions trésorerie 90 jours
    const treasuryForecast = await forecastTreasury(tenantId, 90);

    // Scénarios what-if
    const scenarios = [
      await simulateWhatIf(tenantId, { name: "Scénario base", priceChange: 0, volumeChange: 0 }),
      await simulateWhatIf(tenantId, {
        name: "+10% volume",
        volumeChange: 10,
      }),
      await simulateWhatIf(tenantId, {
        name: "-5% prix",
        priceChange: -5,
      }),
      await simulateWhatIf(tenantId, {
        name: "-15% churn",
        customerChurn: 15,
      }),
    ];

    return NextResponse.json({
      success: true,
      data: {
        caForecast: {
          projections: caForecast.projections.slice(0, 30),
          mape: caForecast.mape,
        },
        treasuryForecast: {
          projections: treasuryForecast.projections.slice(0, 90),
          breakEvenDate: treasuryForecast.breakEvenDate,
        },
        scenarios,
      },
    });
  } catch (error) {
    console.error("Erreur dashboard prévisions:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
});

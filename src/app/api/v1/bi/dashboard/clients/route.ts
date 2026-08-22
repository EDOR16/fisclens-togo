export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/bi/dashboard/clients
 * Dashboard Clients : segmentation RFM, Pareto 80/20, top 20, score de risque
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, GuardContext } from "@/lib/server/with-guard";
import { getRFMSegmentation, getTopClients } from "@/lib/bi/aggregates";

export const GET = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    // Segmentation RFM
    const rfmSegmentation = await getRFMSegmentation(tenantId);

    // Top 20 clients (Pareto 80/20)
    const topClients = await getTopClients(tenantId, 20);

    // Répartition par segment RFM
    const segmentCount = new Map<string, number>();
    for (const seg of rfmSegmentation) {
      segmentCount.set(seg.rfmScore, (segmentCount.get(seg.rfmScore) || 0) + 1);
    }

    const rfmDistribution = Array.from(segmentCount.entries()).map(
      ([segment, count]) => ({
        segment,
        count,
        percentage: Math.round((count / rfmSegmentation.length) * 100),
      })
    );

    // Score de risque (clients avec recency > 90j)
    const atRiskClients = rfmSegmentation.filter((s) => s.recency > 90).slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        rfmSegmentation: rfmSegmentation.slice(0, 20), // Top 20
        topClients,
        rfmDistribution,
        atRiskClients,
      },
    });
  } catch (error) {
    console.error("Erreur dashboard clients:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
});
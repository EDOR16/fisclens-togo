export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/bi/dashboard/sales
 * Dashboard Ventes : top produits, zones géo, saisonnalité, matrice BCG
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, GuardContext } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";
import { getTopProducts } from "@/lib/bi/aggregates";

import { normalizeTogoRegion } from "@/lib/bi/togo-regions";

export const GET = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    // Top 10 produits par marge
    const topProducts = await getTopProducts(tenantId, 10);

    // 2. Ventes par zone géographique calculées via agrégation SQL
    const [rawZones, rawMonthly] = await Promise.all([
      prisma.$queryRaw<Array<{ zone: string | null; ca: bigint }>>`
        SELECT
          c."zoneGeo" AS zone,
          COALESCE(SUM(s."montantHT"), 0)::bigint AS ca
        FROM sales s
        LEFT JOIN client_refs c ON s."clientId" = c.id
        WHERE s."tenantId" = ${tenantId}
        GROUP BY c."zoneGeo"
      `,
      prisma.$queryRaw<Array<{ month: string; ca: bigint }>>`
        SELECT
          SUBSTRING(s.date, 1, 7) AS month,
          COALESCE(SUM(s."montantHT"), 0)::bigint AS ca
        FROM sales s
        WHERE s."tenantId" = ${tenantId}
        GROUP BY SUBSTRING(s.date, 1, 7)
        ORDER BY month ASC
      `,
    ]);

    const zoneAgg = new Map<string, number>();
    for (const r of rawZones) {
      const region = normalizeTogoRegion(r.zone);
      zoneAgg.set(region, (zoneAgg.get(region) || 0) + Number(r.ca));
    }

    const zones = Array.from(zoneAgg.entries())
      .map(([zone, ca]) => ({ zone, ca }))
      .sort((a, b) => b.ca - a.ca);

    // 3. Saisonnalité (12 derniers mois ou mois historiques)
    const monthlyMap = new Map<string, number>();
    for (const r of rawMonthly) {
      if (r.month) monthlyMap.set(r.month, Number(r.ca));
    }

    const seasonality = Array.from(monthlyMap.entries()).map(([month, ca]) => ({
      month,
      ca,
    }));

    // Matrice BCG simple (volume vs marge)
    const bcgMatrix = topProducts.map((p) => ({
      product: p.designation,
      volume: p.volume,
      marge: p.marge,
      margePercent: p.margePercent,
      quadrant:
        p.volume > 100 && p.margePercent > 20
          ? "Star"
          : p.volume > 100 && p.margePercent <= 20
            ? "Cash Cow"
            : p.volume <= 100 && p.margePercent > 20
              ? "Question Mark"
              : "Dog",
    }));

    return NextResponse.json({
      success: true,
      data: {
        topProducts,
        zones,
        seasonality,
        bcgMatrix,
      },
    });
  } catch (error) {
    console.error("Erreur dashboard sales:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
});

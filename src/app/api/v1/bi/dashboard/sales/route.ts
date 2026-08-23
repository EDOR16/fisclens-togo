export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/bi/dashboard/sales
 * Dashboard Ventes : top produits, zones géo, saisonnalité, matrice BCG
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, GuardContext } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";
import { getTopProducts } from "@/lib/bi/aggregates";

export const GET = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    // Top 10 produits par marge
    const topProducts = await getTopProducts(tenantId, 10);

    // Ventes par zone géographique
    const salesByZone = await prisma.sale.findMany({
      where: { tenantId },
      include: { client: true },
    });

    const zoneAgg = new Map<string, number>();
    for (const sale of salesByZone) {
      const zone = sale.client.zoneGeo;
      zoneAgg.set(zone, (zoneAgg.get(zone) || 0) + sale.montantHT);
    }

    const zones = Array.from(zoneAgg.entries())
      .map(([zone, ca]) => ({ zone, ca }))
      .sort((a, b) => b.ca - a.ca);

    // Saisonnalité (12 derniers mois)
    const monthlySales = new Map<string, number>();
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const month = date.toISOString().substring(0, 7); // YYYY-MM
      monthlySales.set(month, 0);
    }

    for (const sale of salesByZone) {
      const month = sale.date.substring(0, 7);
      if (monthlySales.has(month)) {
        monthlySales.set(month, (monthlySales.get(month) || 0) + sale.montantHT);
      }
    }

    const seasonality = Array.from(monthlySales.entries())
      .reverse()
      .map(([month, ca]) => ({ month, ca }));

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

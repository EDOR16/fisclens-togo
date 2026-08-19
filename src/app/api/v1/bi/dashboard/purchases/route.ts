export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/bi/dashboard/purchases
 * Dashboard Achats : top fournisseurs, évolution prix, concentration
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";
import { getTopSuppliers } from "@/lib/bi/aggregates";

export const GET = withTenantGuard(async (req: NextRequest, { tenantId }: { tenantId: string }) => {
  try {
    // Top fournisseurs
    const topSuppliers = await getTopSuppliers(tenantId, 10);

    // Évolution des prix d'achat (tendance inflation)
    const purchases = await prisma.purchase.findMany({
      where: { tenantId },
      include: { product: true },
      orderBy: { date: "asc" },
    });

    const priceEvolution = new Map<string, { dates: string[]; prices: number[] }>();

    for (const purchase of purchases) {
      const productCode = purchase.product.code;
      if (!priceEvolution.has(productCode)) {
        priceEvolution.set(productCode, { dates: [], prices: [] });
      }
      const evo = priceEvolution.get(productCode)!;
      evo.dates.push(purchase.date);
      evo.prices.push(purchase.puHT);
    }

    const inflationTrends = Array.from(priceEvolution.entries())
      .map(([productCode, data]) => {
        const firstPrice = data.prices[0];
        const lastPrice = data.prices[data.prices.length - 1];
        const inflationPercent = firstPrice > 0 
          ? Math.round(((lastPrice - firstPrice) / firstPrice) * 100)
          : 0;
        return {
          productCode,
          firstPrice,
          lastPrice,
          inflationPercent,
        };
      })
      .filter((t) => t.inflationPercent !== 0)
      .sort((a, b) => b.inflationPercent - a.inflationPercent)
      .slice(0, 10);

    // Concentration (Herfindahl index)
    const totalPurchases = topSuppliers.reduce((sum, s) => sum + s.totalAmount, 0);
    const supplierShares = topSuppliers.map((s) => s.totalAmount / totalPurchases);
    const herfindahlIndex = supplierShares.reduce((sum, share) => sum + share * share, 0);
    const concentration =
      herfindahlIndex > 0.25 ? "Élevée" : herfindahlIndex > 0.15 ? "Moyenne" : "Faible";

    return NextResponse.json({
      success: true,
      data: {
        topSuppliers,
        inflationTrends,
        concentration,
        herfindahlIndex: Math.round(herfindahlIndex * 10000) / 10000,
      },
    });
  } catch (error) {
    console.error("Erreur dashboard achats:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
});

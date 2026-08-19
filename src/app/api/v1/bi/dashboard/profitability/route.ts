/**
 * GET /api/v1/bi/dashboard/profitability
 * Dashboard Rentabilité : marges par produit/catégorie, point mort
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";
import { getProfitabilityByCategory } from "@/lib/bi/aggregates";

export const GET = withTenantGuard(async (req: NextRequest, { tenantId }: { tenantId: string }) => {
  try {
    // Marges par catégorie
    const profitabilityByCategory = await getProfitabilityByCategory(tenantId);

    // Marges par produit (tous)
    const sales = await prisma.sale.findMany({
      where: { tenantId },
      include: { product: true },
    });

    const purchases = await prisma.purchase.findMany({
      where: { tenantId },
    });

    const productMargins = new Map<
      string,
      {
        productCode: string;
        productName: string;
        ca: number;
        costAchat: number;
        margin: number;
        marginPercent: number;
      }
    >();

    // Agrégation ventes par produit
    for (const sale of sales) {
      const key = sale.productId;
      if (!productMargins.has(key)) {
        productMargins.set(key, {
          productCode: sale.product.code,
          productName: sale.product.designation,
          ca: 0,
          costAchat: 0,
          margin: 0,
          marginPercent: 0,
        });
      }
      const pm = productMargins.get(key)!;
      pm.ca += sale.montantHT;
      pm.costAchat += sale.product.costAchatHT * sale.quantity;
    }

    // Calcul marges
    const productMarginsList = Array.from(productMargins.values()).map((pm) => {
      pm.margin = pm.ca - pm.costAchat;
      pm.marginPercent = pm.ca > 0 ? Math.round((pm.margin / pm.ca) * 100) : 0;
      return pm;
    });

    // Point mort (Seuil de rentabilité)
    const totalCA = sales.reduce((sum, s) => sum + s.montantHT, 0);
    const totalCostAchat = purchases.reduce((sum, p) => sum + p.montantHT, 0);

    // Frais fixes estimés (10% du CA pour simplification)
    const estimatedFixedCosts = Math.round(totalCA * 0.1);
    const contributionMargin = totalCA - totalCostAchat;
    const contributionMarginPercent =
      totalCA > 0 ? (contributionMargin / totalCA) * 100 : 0;

    const breakEvenPoint =
      contributionMarginPercent > 0
        ? Math.round(estimatedFixedCosts / (contributionMarginPercent / 100))
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        profitabilityByCategory,
        productMargins: productMarginsList.sort((a, b) => b.margin - a.margin),
        breakEvenAnalysis: {
          totalCA,
          totalCostAchat,
          estimatedFixedCosts,
          contributionMargin,
          contributionMarginPercent: Math.round(contributionMarginPercent),
          breakEvenPoint,
        },
      },
    });
  } catch (error) {
    console.error("Erreur dashboard rentabilité:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
});

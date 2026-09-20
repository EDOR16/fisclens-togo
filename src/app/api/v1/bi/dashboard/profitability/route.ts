export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/bi/dashboard/profitability
 * Dashboard Rentabilité : marges par produit/catégorie, point mort
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, GuardContext } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";
import { getProfitabilityByCategory } from "@/lib/bi/aggregates";

export const GET = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    // 1. Marges par catégorie (requête SQL optimisée)
    const profitabilityByCategory = await getProfitabilityByCategory(tenantId);

    // 2. Marges par produit calculées directement en SQL
    const [rawProductMargins, salesTotalRow, purchasesTotalRow] = await Promise.all([
      prisma.$queryRaw<Array<{
        productCode: string;
        productName: string;
        ca: bigint;
        costAchat: bigint;
        margin: bigint;
        marginPercent: number;
      }>>`
        SELECT
          pr.code AS "productCode",
          pr.designation AS "productName",
          COALESCE(SUM(s."montantHT"), 0)::bigint AS ca,
          COALESCE(SUM(s.quantity * pr."costAchatHT"), 0)::bigint AS "costAchat",
          COALESCE(SUM(s."montantHT") - SUM(s.quantity * pr."costAchatHT"), 0)::bigint AS margin,
          CASE WHEN SUM(s."montantHT") > 0
            THEN ROUND(
              (SUM(s."montantHT") - SUM(s.quantity * pr."costAchatHT"))::numeric
              / SUM(s."montantHT")::numeric * 100
            )::int
            ELSE 0
          END AS "marginPercent"
        FROM sales s
        JOIN product_refs pr ON s."productId" = pr.id
        WHERE s."tenantId" = ${tenantId}
        GROUP BY pr.id, pr.code, pr.designation
        ORDER BY margin DESC
      `,
      prisma.$queryRaw<Array<{ totalCA: bigint }>>`
        SELECT COALESCE(SUM("montantHT"), 0)::bigint AS "totalCA"
        FROM sales
        WHERE "tenantId" = ${tenantId}
      `,
      prisma.$queryRaw<Array<{ totalCostAchat: bigint }>>`
        SELECT COALESCE(SUM("montantHT"), 0)::bigint AS "totalCostAchat"
        FROM purchases
        WHERE "tenantId" = ${tenantId}
      `,
    ]);

    const productMarginsList = rawProductMargins.map((pm) => ({
      productCode: pm.productCode,
      productName: pm.productName,
      ca: Number(pm.ca),
      costAchat: Number(pm.costAchat),
      margin: Number(pm.margin),
      marginPercent: Number(pm.marginPercent),
    }));

    // 3. Point mort (Seuil de rentabilité)
    const totalCA = Number(salesTotalRow[0]?.totalCA || 0);
    let totalCostAchat = Number(purchasesTotalRow[0]?.totalCostAchat || 0);

    // Si pas de table achats mais des coûts produits
    if (totalCostAchat === 0 && productMarginsList.length > 0) {
      totalCostAchat = productMarginsList.reduce((sum, p) => sum + p.costAchat, 0);
    }

    // Frais fixes estimés (10% du CA pour simplification)
    const estimatedFixedCosts = Math.round(totalCA * 0.1);
    const contributionMargin = totalCA - totalCostAchat;
    const contributionMarginPercent =
      totalCA > 0 ? (contributionMargin / totalCA) * 100 : 0;

    // Si la marge contributive est négative ou nulle, le seuil de rentabilité est strictement non atteignable
    const isAchievable = contributionMarginPercent > 0;
    const breakEvenPoint = isAchievable
      ? Math.round(estimatedFixedCosts / (contributionMarginPercent / 100))
      : null;

    return NextResponse.json({
      success: true,
      data: {
        profitabilityByCategory,
        categoryProfitability: profitabilityByCategory,
        productMargins: productMarginsList.sort((a, b) => b.margin - a.margin),
        breakEvenAnalysis: {
          totalCA,
          totalCostAchat,
          estimatedFixedCosts,
          contributionMargin,
          contributionMarginPercent: Math.round(contributionMarginPercent),
          breakEvenPoint,
          isAchievable,
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

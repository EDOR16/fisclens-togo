export const dynamic = "force-dynamic";

/**
 * GET /api/v1/bi/dashboard/ai-analysis
 * Analyse IA des données BI via Qwen API (Alibaba DashScope)
 * Fallback sur le moteur de règles local si la clé Qwen n'est pas configurée
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, GuardContext } from "@/lib/server/with-guard";
import { calculateGlobalKPIs, getTopProducts, getProfitabilityByCategory } from "@/lib/bi/aggregates";
import { forecastCA } from "@/lib/bi/forecasting";
import {
  analyzeBusinessData,
  fallbackRulesAnalysis,
  type BIDataContext,
} from "@/lib/integrations/qwen/bi-advisor";
import { prisma } from "@/lib/server/prisma";

export const GET = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    // ── 1. Récupérer toutes les données BI en parallèle ──────────────────────
    const [kpis, topProducts, categories, forecast, sales] = await Promise.all([
      calculateGlobalKPIs(tenantId).catch(() => ({
        ca: 0,
        margeBrute: 0,
        margePercent: 0,
        trésorerie: 0,
        clientsActifs: 0,
        tendanceVsN1: 0,
      })),
      getTopProducts(tenantId, 5).catch(() => []),
      getProfitabilityByCategory(tenantId).catch(() => []),
      forecastCA(tenantId, 30).catch(() => ({ projections: [], totalForecast: 0, mape: 5 })),
      prisma.sale
        .findMany({
          where: { tenantId },
          include: { client: true },
        })
        .catch(() => []),
    ]);

    // ── 2. Calculer la concentration du 1er client ───────────────────────────
    const clientTotals = new Map<string, number>();
    for (const sale of sales) {
      const code = sale.client?.code ?? "unknown";
      clientTotals.set(code, (clientTotals.get(code) ?? 0) + sale.montantHT);
    }
    const topClientAmount = Math.max(...Array.from(clientTotals.values()), 0);
    const topClientShare =
      kpis.ca > 0 ? Math.round((topClientAmount / kpis.ca) * 100) : 0;

    // ── 3. Estimer la tendance des ventes ─────────────────────────────────────
    let forecastTotal = 0;
    for (const p of forecast.projections ?? []) {
      forecastTotal += (p as any).value ?? 0;
    }
    const salesTrend: "hausse" | "baisse" | "stable" =
      forecastTotal > kpis.ca * 0.05
        ? "hausse"
        : forecastTotal < -kpis.ca * 0.05
        ? "baisse"
        : "stable";

    // ── 4. Construire le contexte BI ─────────────────────────────────────────
    const biContext: BIDataContext = {
      kpis: {
        ca: kpis.ca,
        margeBrute: kpis.margeBrute,
        margePercent: kpis.margePercent,
        clientsActifs: kpis.clientsActifs,
        trésorerie: kpis.trésorerie,
      },
      topProducts: topProducts.map((p) => ({
        designation: p.designation,
        ca: p.ca,
        margePercent: p.margePercent,
        volume: p.volume,
      })),
      forecastTotal,
      topClientShare,
      salesTrend,
      categories: categories.map((c) => ({
        category: c.category,
        margePercent: c.margePercent,
      })),
    };

    // ── 5. Appel Qwen API (avec fallback local) ───────────────────────────────
    let analysis;
    try {
      analysis = await analyzeBusinessData(biContext);
    } catch (qwenError) {
      console.warn("[BI] Qwen API indisponible, fallback moteur de règles:", qwenError);
      analysis = fallbackRulesAnalysis(biContext);
    }

    // ── 6. Retourner la réponse ───────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      data: {
        healthScore: analysis.healthScore,
        summary: analysis.summary,
        insights: analysis.insights,
        fiscalAlerts: analysis.fiscalAlerts,
        kpis: {
          ca: kpis.ca,
          margeBrute: kpis.margeBrute,
          margePercent: kpis.margePercent,
          clientsActifs: kpis.clientsActifs,
          topClientShare,
        },
        meta: {
          model: analysis.model,
          provider: analysis.provider,
          generatedAt: analysis.generatedAt,
        },
      },
    });
  } catch (error) {
    console.error("[BI] Erreur API ai-analysis:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'analyse IA" },
      { status: 500 }
    );
  }
});

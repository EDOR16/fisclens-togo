export const dynamic = "force-dynamic";

/**
 * GET /api/v1/bi/dashboard/ai-analysis
 * Analyse des données BI via le moteur de règles SQL déterministe.
 * (Anciens providers IA Qwen/DeepSeek retirés — 100% échec en production,
 * 5-15s perdus par appel sans bénéfice, cf. logs.)
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, GuardContext } from "@/lib/server/with-guard";
import { calculateGlobalKPIs, getTopProducts, getProfitabilityByCategory, getTopClients } from "@/lib/bi/aggregates";
import { forecastCA } from "@/lib/bi/forecasting";
import {
  fallbackRulesAnalysis,
  type BIDataContext,
} from "@/lib/integrations/qwen/bi-advisor";

// ── Cache in-memory 5 minutes par tenant ────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; expiresAt: number }>();

export const GET = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    // ── Cache hit ? ──────────────────────────────────────────────────────────
    const cacheKey = `ai-analysis:${tenantId}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data);
    }

    // ── 1. Récupérer toutes les données BI en parallèle ──────────────────────
    const [kpis, topProducts, categories, forecast, topClients] = await Promise.all([
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
      // SQL agrégé — plus de findMany+include
      getTopClients(tenantId, 1).catch(() => []),
    ]);

    // ── 2. Concentration du 1er client (déjà calculé via SQL) ────────────────
    const topClientShare = topClients[0]?.weight ?? 0;

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

    // ── 5. Analyse via moteur de règles SQL déterministe (pas d'appel API externe) ──
    const analysis = fallbackRulesAnalysis(biContext);

    // ── 6. Retourner la réponse ───────────────────────────────────────────────
    const responseData = {
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
    };

    // Stocker en cache
    cache.set(cacheKey, { data: responseData, expiresAt: Date.now() + CACHE_TTL_MS });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[BI] Erreur API ai-analysis:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'analyse IA" },
      { status: 500 }
    );
  }
});
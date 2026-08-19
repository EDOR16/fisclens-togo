/**
 * Utilitaires de prévisions (forecasting)
 * - Prévision CA avec intervalle de confiance
 * - Prévision trésorerie 90 jours
 * - Calcul MAPE (Mean Absolute Percentage Error)
 * - Simulateur What-if
 */

import { prisma } from "@/lib/server/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ForecastResult {
  date: string;
  value: number;
  lowerBound: number;
  upperBound: number;
  mape?: number;
}

export interface CAForecast {
  projections: ForecastResult[]; // 30 jours
  mape: number; // Mean Absolute Percentage Error %
}

export interface TreasuryForecast {
  projections: ForecastResult[]; // 90 jours
  breakEvenDate?: string; // Date à partir de laquelle trésorerie devient positive
}

export interface WhatIfScenario {
  name: string;
  priceChange: number; // % de changement de prix
  volumeChange: number; // % de changement de volume
  customerChurn: number; // % clients perdus
  projectedCA: number;
  projectedMargin: number;
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

function getDateRange(days: number): string[] {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
}

function calculateMovingAverage(values: number[], window: number): number[] {
  const result = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return result;
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length;
  return Math.sqrt(variance);
}

function calculateMAPE(actual: number[], predicted: number[]): number {
  if (actual.length === 0) return 0;
  const errors = actual.map((a, i) => {
    if (a === 0) return 0;
    return Math.abs((a - predicted[i]) / a);
  });
  return Math.round((errors.reduce((a, b) => a + b, 0) / errors.length) * 100);
}

// ---------------------------------------------------------------------------
// Prévisions CA (30 jours)
// ---------------------------------------------------------------------------

export async function forecastCA(
  tenantId: string,
  days: number = 30
): Promise<CAForecast> {
  // Récupérer les ventes des 90 derniers jours
  const today = new Date();
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const sales = await prisma.sale.findMany({
    where: {
      tenantId,
      date: {
        gte: ninetyDaysAgo.toISOString().split("T")[0],
      },
    },
    select: { date: true, montantHT: true },
    orderBy: { date: "asc" },
  });

  // Agréger par jour
  const dailyCA = new Map<string, number>();
  for (const sale of sales) {
    const day = sale.date;
    dailyCA.set(day, (dailyCA.get(day) || 0) + sale.montantHT);
  }

  // Créer une série complète (avec 0 pour les jours sans ventes)
  const caValues: number[] = [];
  for (let i = -90; i <= 0; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    caValues.push(dailyCA.get(dateStr) || 0);
  }

  // Calcul de la moyenne mobile (7 jours)
  const ma = calculateMovingAverage(caValues, 7);
  const recentMA = ma[ma.length - 1] || 0;

  // Écart-type pour intervalle de confiance (95% ≈ 1.96 σ)
  const stdDev = calculateStdDev(caValues);
  const confInterval = Math.round(stdDev * 1.96);

  // Prévisions simples : moyenne mobile constante
  const projections: ForecastResult[] = [];
  const forecastDates = getDateRange(days);
  
  for (const date of forecastDates) {
    projections.push({
      date,
      value: recentMA,
      lowerBound: Math.max(0, recentMA - confInterval),
      upperBound: recentMA + confInterval,
    });
  }

  // Validation MAPE (backtesting sur derniers 7 jours)
  const lastSevenDays = caValues.slice(-7);
  const predicted = Array(7).fill(recentMA);
  const mape = calculateMAPE(lastSevenDays, predicted);

  return { projections, mape };
}

// ---------------------------------------------------------------------------
// Prévisions Trésorerie (90 jours)
// ---------------------------------------------------------------------------

export async function forecastTreasury(
  tenantId: string,
  days: number = 90
): Promise<TreasuryForecast> {
  // CA forecast + conversion en TTC (moyenne TVA = 18%)
  const caForecast = await forecastCA(tenantId, days);

  const projections: ForecastResult[] = caForecast.projections.map((proj) => ({
    date: proj.date,
    value: Math.round(proj.value * 1.18), // Conversion HT -> TTC
    lowerBound: Math.round(proj.lowerBound * 1.18),
    upperBound: Math.round(proj.upperBound * 1.18),
    mape: caForecast.mape,
  }));

  // Calculer solde courant (ventes - achats du mois)
  const currentBalance = await prisma.sale.aggregate({
    where: { tenantId },
    _sum: { montantTTC: true },
  });
  const currentPurchases = await prisma.purchase.aggregate({
    where: { tenantId },
    _sum: { montantTTC: true },
  });

  let accumulatedBalance = (currentBalance._sum.montantTTC || 0) -
    (currentPurchases._sum.montantTTC || 0);

  // Point d'équilibre
  let breakEvenDate: string | undefined;

  for (const proj of projections) {
    accumulatedBalance += proj.value; // Simplifié : assume achats = 0
    if (!breakEvenDate && accumulatedBalance > 0) {
      breakEvenDate = proj.date;
    }
  }

  return { projections, breakEvenDate };
}

// ---------------------------------------------------------------------------
// Simulateur What-if
// ---------------------------------------------------------------------------

export async function simulateWhatIf(
  tenantId: string,
  scenario: Partial<WhatIfScenario>
): Promise<WhatIfScenario> {
  const name = scenario.name || "Scénario personnalisé";
  const priceChange = scenario.priceChange || 0;
  const volumeChange = scenario.volumeChange || 0;
  const customerChurn = scenario.customerChurn || 0;

  // CA courant
  const currentCA = await prisma.sale.aggregate({
    where: { tenantId },
    _sum: { montantHT: true },
  });
  const baseCA = currentCA._sum.montantHT || 0;

  // Nombre clients actuels
  const clientCount = await prisma.sale.findMany({
    where: { tenantId },
    distinct: ["clientId"],
  });

  // Appliquer changements
  const volumeImpact = (volumeChange / 100) * baseCA;
  const priceImpact = (priceChange / 100) * baseCA;
  const churnImpact = -(customerChurn / 100) * baseCA;

  const projectedCA = baseCA + volumeImpact + priceImpact + churnImpact;

  // Marge moyenne
  const marginAgg = await prisma.sale.aggregate({
    where: { tenantId },
    _sum: { montantHT: true, montantTVA: true },
  });
  const avgMarginPercent = ((marginAgg._sum.montantHT || 0) + (marginAgg._sum.montantTVA || 0))
    ? ((((marginAgg._sum.montantHT || 0) + (marginAgg._sum.montantTVA || 0)) - marginAgg._sum.montantHT) /
        ((marginAgg._sum.montantHT || 0) + (marginAgg._sum.montantTVA || 0))) *
      100
    : 20;

  const projectedMargin = Math.round((projectedCA * avgMarginPercent) / 100);

  return {
    name,
    priceChange,
    volumeChange,
    customerChurn,
    projectedCA,
    projectedMargin,
  };
}

// ---------------------------------------------------------------------------
// Stockage des prévisions
// ---------------------------------------------------------------------------

export async function saveForecast(
  tenantId: string,
  type: "CA" | "TRESORERIE" | "VENTE_PRODUIT",
  date: string,
  value: number,
  lowerBound: number,
  upperBound: number,
  mape: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.forecast.create({
    data: {
      tenantId,
      type,
      date,
      value,
      lowerBound,
      upperBound,
      mape,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    },
  });
}

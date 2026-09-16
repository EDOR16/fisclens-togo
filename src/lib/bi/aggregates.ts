/**
 * Utilitaires d'agrégation et calcul de KPIs pour le BI
 * Agrégats SQL matérialisés pour les dashboards
 */

import { prisma } from "@/lib/server/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardKPIs {
  ca: number; // Chiffre d'affaires total (HT)
  margeBrute: number; // Marge brute (CA - coûts d'achat)
  margePercent: number; // Marge en %
  clientsActifs: number; // Nombre de clients avec ventes
  trésorerie: number; // Montant total des ventes (TTC)
  tendanceVsN1: number; // Tendance vs N-1 en %
}

export interface TopProduct {
  code: string;
  designation: string;
  volume: number; // Quantité totale
  ca: number; // CA HT
  marge: number; // Marge absolue
  margePercent: number; // Marge %
}

export interface RFMSegment {
  clientCode: string;
  clientName: string;
  recency: number; // Jours depuis dernière vente
  frequency: number; // Nombre de ventes
  monetary: number; // CA total
  rfmScore: string; // VIP, Normal, At Risk, etc
}

export interface ForecastMetrics {
  caProjected: number; // CA projeté
  trésorerieProjected: number; // Trésorerie projetée 90j
  mape: number; // Mean Absolute Percentage Error %
}

// ---------------------------------------------------------------------------
// KPIs Globaux
// ---------------------------------------------------------------------------

export interface CaTrendPoint {
  moisKey: string; // "2026-08" ou "2026-08-15" selon la granularité
  mois: string;    // "Aoû 2026" ou "15 Aoû"
  ca: number;
  achats: number;
}

export type TrendPeriod =
  | { type: "last-n-days"; days: number }
  | { type: "month"; year: number; month: number }
  | { type: "year"; year: number }
  | { type: "all" }
  | { type: "custom"; from: string; to: string };

const MOIS_COURTS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function dayLabel(d: Date): string {
  return `${d.getDate()} ${MOIS_COURTS[d.getMonth()]}`;
}
function monthLabel(d: Date): string {
  return `${MOIS_COURTS[d.getMonth()]} ${d.getFullYear()}`;
}

export async function getCaTrend(tenantId: string, period: TrendPeriod): Promise<CaTrendPoint[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let from: Date;
  let to: Date = today;
  let granularity: "day" | "month";

  type RawRow = { key: string; total: bigint | number | string | null };
  let salesRows: RawRow[];
  let purchasesRows: RawRow[];

  if (period.type === "all") {
    granularity = "month";
    [salesRows, purchasesRows] = await Promise.all([
      prisma.$queryRaw<RawRow[]>`
        SELECT SUBSTRING("date", 1, 7) AS key, COALESCE(SUM("montantHT"), 0) AS total
        FROM "sales"
        WHERE "tenantId" = ${tenantId}
        GROUP BY SUBSTRING("date", 1, 7)
        ORDER BY SUBSTRING("date", 1, 7)
      `,
      prisma.$queryRaw<RawRow[]>`
        SELECT SUBSTRING("date", 1, 7) AS key, COALESCE(SUM("montantHT"), 0) AS total
        FROM "purchases"
        WHERE "tenantId" = ${tenantId}
        GROUP BY SUBSTRING("date", 1, 7)
        ORDER BY SUBSTRING("date", 1, 7)
      `,
    ]);

    const allKeys = [...salesRows.map((r) => r.key), ...purchasesRows.map((r) => r.key)].sort();
    if (allKeys.length === 0) return [];

    const [fy, fm] = allKeys[0].split("-").map(Number);
    from = new Date(fy, fm - 1, 1);

    const [ly, lm] = allKeys[allKeys.length - 1].split("-").map(Number);
    const lastMonthEnd = new Date(ly, lm, 0);
    to = lastMonthEnd > today ? lastMonthEnd : today;
  } else {
    // ── Détermination des bornes et granularité en mémoire ─────────────────
    if (period.type === "last-n-days") {
      from = new Date(today);
      from.setDate(from.getDate() - (period.days - 1));
      granularity = period.days <= 92 ? "day" : "month";
    } else if (period.type === "month") {
      from = new Date(period.year, period.month - 1, 1);
      const lastDayOfMonth = new Date(period.year, period.month, 0);
      to = lastDayOfMonth < today ? lastDayOfMonth : today;
      granularity = "day";
    } else if (period.type === "year") {
      from = new Date(period.year, 0, 1);
      const lastDayOfYear = new Date(period.year, 11, 31);
      to = lastDayOfYear < today ? lastDayOfYear : today;
      granularity = "month";
    } else if (period.type === "custom") {
      const [fy, fm, fd] = period.from.split("-").map(Number);
      const [ty, tm, td] = period.to.split("-").map(Number);
      from = new Date(fy, fm - 1, fd);
      to = new Date(ty, tm - 1, td);
      if (to > today) to = today;
      const spanDays = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
      granularity = spanDays <= 92 ? "day" : "month";
    } else {
      return [];
    }

    if (to < from) return [];

    const toDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const fromStr = toDate(from);
    const toStr   = toDate(to);

    if (granularity === "day") {
      [salesRows, purchasesRows] = await Promise.all([
        prisma.$queryRaw<RawRow[]>`
          SELECT "date" AS key, COALESCE(SUM("montantHT"), 0) AS total
          FROM "sales"
          WHERE "tenantId" = ${tenantId}
            AND "date" >= ${fromStr}
            AND "date" <= ${toStr}
          GROUP BY "date" ORDER BY "date"
        `,
        prisma.$queryRaw<RawRow[]>`
          SELECT "date" AS key, COALESCE(SUM("montantHT"), 0) AS total
          FROM "purchases"
          WHERE "tenantId" = ${tenantId}
            AND "date" >= ${fromStr}
            AND "date" <= ${toStr}
          GROUP BY "date" ORDER BY "date"
        `,
      ]);
    } else {
      [salesRows, purchasesRows] = await Promise.all([
        prisma.$queryRaw<RawRow[]>`
          SELECT SUBSTRING("date", 1, 7) AS key, COALESCE(SUM("montantHT"), 0) AS total
          FROM "sales"
          WHERE "tenantId" = ${tenantId}
            AND "date" >= ${fromStr}
            AND "date" <= ${toStr}
          GROUP BY SUBSTRING("date", 1, 7)
          ORDER BY SUBSTRING("date", 1, 7)
        `,
        prisma.$queryRaw<RawRow[]>`
          SELECT SUBSTRING("date", 1, 7) AS key, COALESCE(SUM("montantHT"), 0) AS total
          FROM "purchases"
          WHERE "tenantId" = ${tenantId}
            AND "date" >= ${fromStr}
            AND "date" <= ${toStr}
          GROUP BY SUBSTRING("date", 1, 7)
          ORDER BY SUBSTRING("date", 1, 7)
        `,
      ]);
    }
  }

  const caByKey = new Map<string, number>();
  const achatsByKey = new Map<string, number>();
  for (const row of salesRows)     caByKey.set(row.key, Number(row.total || 0));
  for (const row of purchasesRows) achatsByKey.set(row.key, Number(row.total || 0));

  // ── Génération des points continus (même si CA/achats = 0) ───────────────
  const points: CaTrendPoint[] = [];
  const cursor = new Date(from);

  while (cursor <= to) {
    const key = granularity === "day" ? dayKey(cursor) : monthKey(cursor);
    points.push({
      moisKey: key,
      mois: granularity === "day" ? dayLabel(cursor) : monthLabel(cursor),
      ca: caByKey.get(key) ?? 0,
      achats: achatsByKey.get(key) ?? 0,
    });
    if (granularity === "day") cursor.setDate(cursor.getDate() + 1);
    else cursor.setMonth(cursor.getMonth() + 1);
  }
  return points;
}


export async function getRealCaTrend(tenantId: string): Promise<CaTrendPoint[]> {
  return getCaTrend(tenantId, { type: "all" });
}

export async function calculateGlobalKPIs(tenantId: string): Promise<DashboardKPIs> {
  // Une seule requête SQL parallèle pour tous les KPIs
  const [salesRows, costRows] = await Promise.all([
    prisma.$queryRaw<Array<{ ca: bigint; tresorerie: bigint; clientsActifs: bigint }>>`
      SELECT
        COALESCE(SUM("montantHT"), 0)::bigint   AS ca,
        COALESCE(SUM("montantTTC"), 0)::bigint  AS tresorerie,
        COUNT(DISTINCT "clientId")::bigint      AS "clientsActifs"
      FROM sales
      WHERE "tenantId" = ${tenantId}
    `,
    prisma.$queryRaw<Array<{ costAchat: bigint }>>`
      SELECT COALESCE(SUM(p."quantity" * pr."costAchatHT"), 0)::bigint AS "costAchat"
      FROM purchases p
      JOIN product_refs pr ON p."productId" = pr.id
      WHERE p."tenantId" = ${tenantId}
    `,
  ]);

  const ca          = Number(salesRows[0]?.ca ?? 0);
  const trésorerie  = Number(salesRows[0]?.tresorerie ?? 0);
  const clientsActifs = Number(salesRows[0]?.clientsActifs ?? 0);
  const costAchat   = Number(costRows[0]?.costAchat ?? 0);
  const margeBrute  = ca - costAchat;
  const margePercent = ca > 0 ? Math.round((margeBrute / ca) * 100) : 0;

  return {
    ca,
    margeBrute,
    margePercent,
    clientsActifs,
    trésorerie,
    tendanceVsN1: 0,
  };
}

// ---------------------------------------------------------------------------
// Top Produits
// ---------------------------------------------------------------------------

export async function getTopProducts(
  tenantId: string,
  limit: number = 10
): Promise<TopProduct[]> {
  const rows = await prisma.$queryRaw<Array<{
    code: string;
    designation: string;
    volume: bigint;
    ca: bigint;
    marge: bigint;
    margePercent: number;
  }>>`
    SELECT
      pr.code,
      pr.designation,
      COALESCE(SUM(s.quantity), 0)::bigint                                        AS volume,
      COALESCE(SUM(s."montantHT"), 0)::bigint                                     AS ca,
      COALESCE(SUM(s."montantHT") - SUM(s.quantity * pr."costAchatHT"), 0)::bigint AS marge,
      CASE WHEN SUM(s."montantHT") > 0
        THEN ROUND(
          (SUM(s."montantHT") - SUM(s.quantity * pr."costAchatHT"))::numeric
          / SUM(s."montantHT")::numeric * 100
        )::int
        ELSE 0
      END AS "margePercent"
    FROM sales s
    JOIN product_refs pr ON s."productId" = pr.id
    WHERE s."tenantId" = ${tenantId}
    GROUP BY pr.id, pr.code, pr.designation
    ORDER BY marge DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    code:        r.code,
    designation: r.designation,
    volume:      Number(r.volume),
    ca:          Number(r.ca),
    marge:       Number(r.marge),
    margePercent: Number(r.margePercent),
  }));
}

// ---------------------------------------------------------------------------
// Segmentation RFM (Recency, Frequency, Monetary)
// ---------------------------------------------------------------------------

export async function getRFMSegmentation(
  tenantId: string
): Promise<RFMSegment[]> {
  const rows = await prisma.$queryRaw<Array<{
    clientCode: string;
    clientName: string;
    lastDate:   string;
    frequency:  bigint;
    monetary:   bigint;
  }>>`
    SELECT
      c.code                               AS "clientCode",
      c.name                               AS "clientName",
      MAX(s.date)                          AS "lastDate",
      COUNT(*)::bigint                     AS frequency,
      COALESCE(SUM(s."montantTTC"), 0)::bigint AS monetary
    FROM sales s
    JOIN clients c ON s."clientId" = c.id
    WHERE s."tenantId" = ${tenantId}
    GROUP BY c.id, c.code, c.name
    ORDER BY monetary DESC
  `;

  const today = new Date();
  return rows.map((agg) => {
    const lastDate = new Date(agg.lastDate);
    const recency  = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);
    const freq     = Number(agg.frequency);
    const monetary = Number(agg.monetary);

    let rfmScore = "Normal";
    if (freq >= 10 && recency <= 30)  rfmScore = "VIP";
    else if (freq < 3 && recency > 90) rfmScore = "At Risk";
    else if (monetary > 10_000_000)    rfmScore = "High Value";

    return { clientCode: agg.clientCode, clientName: agg.clientName, recency, frequency: freq, monetary, rfmScore };
  });
}

// ---------------------------------------------------------------------------
// Top Clients (Pareto)
// ---------------------------------------------------------------------------

export async function getTopClients(
  tenantId: string,
  limit: number = 20
): Promise<Array<{
  clientCode: string;
  clientName: string;
  ca: number;
  weight: number;
}>> {
  const rows = await prisma.$queryRaw<Array<{
    clientCode: string;
    clientName: string;
    ca: bigint;
    totalCA: bigint;
  }>>`
    SELECT
      c.code                                  AS "clientCode",
      c.name                                  AS "clientName",
      COALESCE(SUM(s."montantTTC"), 0)::bigint AS ca,
      SUM(SUM(s."montantTTC")) OVER ()::bigint  AS "totalCA"
    FROM sales s
    JOIN clients c ON s."clientId" = c.id
    WHERE s."tenantId" = ${tenantId}
    GROUP BY c.id, c.code, c.name
    ORDER BY ca DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => {
    const ca      = Number(r.ca);
    const totalCA = Number(r.totalCA);
    return {
      clientCode: r.clientCode,
      clientName: r.clientName,
      ca,
      weight: totalCA > 0 ? Math.round((ca / totalCA) * 100) : 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Analyse Achats
// ---------------------------------------------------------------------------

export async function getTopSuppliers(
  tenantId: string,
  limit: number = 10
): Promise<Array<{
  supplierId: string;
  totalAmount: number;
  orderCount: number;
}>> {
  const rows = await prisma.$queryRaw<Array<{
    supplierId: string;
    totalAmount: bigint;
    orderCount: bigint;
  }>>`
    SELECT
      "supplierId",
      COALESCE(SUM("montantTTC"), 0)::bigint AS "totalAmount",
      COUNT(*)::bigint                        AS "orderCount"
    FROM purchases
    WHERE "tenantId" = ${tenantId}
    GROUP BY "supplierId"
    ORDER BY "totalAmount" DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    supplierId:  r.supplierId,
    totalAmount: Number(r.totalAmount),
    orderCount:  Number(r.orderCount),
  }));
}

// ---------------------------------------------------------------------------
// Rentabilité par Catégorie
// ---------------------------------------------------------------------------

export async function getProfitabilityByCategory(
  tenantId: string
): Promise<Array<{
  category: string;
  ca: number;
  costAchat: number;
  marge: number;
  margePercent: number;
}>> {
  const rows = await prisma.$queryRaw<Array<{
    category: string;
    ca: bigint;
    costAchat: bigint;
    marge: bigint;
    margePercent: number;
  }>>`
    SELECT
      COALESCE(NULLIF(TRIM(pr.category), ''), 'Général')  AS category,
      COALESCE(SUM(s."montantHT"), 0)::bigint              AS ca,
      COALESCE(SUM(s.quantity * pr."costAchatHT"), 0)::bigint AS "costAchat",
      COALESCE(SUM(s."montantHT") - SUM(s.quantity * pr."costAchatHT"), 0)::bigint AS marge,
      CASE WHEN SUM(s."montantHT") > 0
        THEN ROUND(
          (SUM(s."montantHT") - SUM(s.quantity * pr."costAchatHT"))::numeric
          / SUM(s."montantHT")::numeric * 100
        )::int
        ELSE 0
      END AS "margePercent"
    FROM sales s
    JOIN product_refs pr ON s."productId" = pr.id
    WHERE s."tenantId" = ${tenantId}
    GROUP BY COALESCE(NULLIF(TRIM(pr.category), ''), 'Général')
    ORDER BY ca DESC
  `;

  return rows.map((r) => ({
    category:    r.category,
    ca:          Number(r.ca),
    costAchat:   Number(r.costAchat),
    marge:       Number(r.marge),
    margePercent: Number(r.margePercent),
  }));
}

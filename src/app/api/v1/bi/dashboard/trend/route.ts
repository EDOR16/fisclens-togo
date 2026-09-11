export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/bi/dashboard/trend
 * Query params :
 *   period = "7d" | "28d" | "90d" | "365d" | "all" | "year:2026" | "month:2026-09" | "custom"
 *   from, to = "YYYY-MM-DD" (requis seulement si period=custom)
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, GuardContext } from "@/lib/server/with-guard";
import { getCaTrend, TrendPeriod } from "@/lib/bi/aggregates";

export const GET = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "all";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let trendPeriod: TrendPeriod;

    if (period === "all") {
      trendPeriod = { type: "all" };
    } else if (/^\d+d$/.test(period)) {
      trendPeriod = { type: "last-n-days", days: parseInt(period, 10) };
    } else if (period.startsWith("year:")) {
      const year = parseInt(period.slice(5), 10);
      if (!Number.isFinite(year)) {
        return NextResponse.json({ error: "Année invalide" }, { status: 400 });
      }
      trendPeriod = { type: "year", year };
    } else if (period.startsWith("month:")) {
      const [y, m] = period.slice(6).split("-").map(Number);
      if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
        return NextResponse.json({ error: "Mois invalide (attendu YYYY-MM)" }, { status: 400 });
      }
      trendPeriod = { type: "month", year: y, month: m };
    } else if (period === "custom") {
      if (!from || !to) {
        return NextResponse.json({ error: "Paramètres from et to requis pour period=custom" }, { status: 400 });
      }
      trendPeriod = { type: "custom", from, to };
    } else {
      return NextResponse.json({ error: `Paramètre period non reconnu : ${period}` }, { status: 400 });
    }

    const trendCA = await getCaTrend(tenantId, trendPeriod);
    return NextResponse.json({ success: true, data: { trendCA } });
  } catch (error) {
    console.error("Erreur BI trend:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
});

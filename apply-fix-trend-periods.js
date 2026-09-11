/**
 * apply-fix-trend-periods.js
 * ---------------------------------------------------------------
 * Ajoute un vrai sélecteur de période à la courbe CA/Achats du
 * Workspace BI, avec granularité automatique (jour si période
 * courte, mois si période longue), basé uniquement sur les vraies
 * dates de Sale/Purchase. Aucune valeur n'est inventée : un jour ou
 * un mois sans transaction affiche 0, jamais une extrapolation.
 *
 * 3 changements :
 *   1) src/lib/bi/aggregates.ts       -> remplace getRealCaTrend par
 *      une version paramétrable (getCaTrend + TrendPeriod), en
 *      gardant getRealCaTrend en compatibilité pour l'existant.
 *   2) src/app/api/v1/bi/dashboard/trend/route.ts -> NOUVELLE route,
 *      créée seulement si elle n'existe pas déjà.
 *   3) src/app/(app)/workspace-bi/page.tsx -> ajoute le sélecteur de
 *      période (7j/28j/90j/365j/toujours/année/mois/personnalisée)
 *      et branche la courbe dessus.
 *
 * Usage (PowerShell, depuis la racine du projet) :
 *   node .\apply-fix-trend-periods.js
 * ---------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function readFile(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) {
    throw new Error(`Fichier introuvable : ${relPath} (chemin résolu : ${full})`);
  }
  return { full, content: fs.readFileSync(full, "utf8") };
}

function applyReplace(relPath, oldStr, newStr, label) {
  const { full, content } = readFile(relPath);
  if (!content.includes(oldStr)) {
    throw new Error(
      `[${label}] Le texte attendu n'a pas été trouvé tel quel dans ${relPath}.\n` +
      `Le fichier a probablement changé depuis l'audit - vérifie-le manuellement avant de relancer.`
    );
  }
  const occurrences = content.split(oldStr).length - 1;
  if (occurrences > 1) {
    throw new Error(
      `[${label}] Le texte attendu apparaît ${occurrences} fois dans ${relPath} - remplacement ambigu, arrêt par sécurité.`
    );
  }
  fs.writeFileSync(full, content.replace(oldStr, newStr), "utf8");
  console.log(`✔ [${label}] ${relPath} mis à jour.`);
}

function createFileIfAbsent(relPath, content, label) {
  const full = path.join(ROOT, relPath);
  if (fs.existsSync(full)) {
    throw new Error(
      `[${label}] Le fichier ${relPath} existe déjà — je ne l'écrase pas par sécurité.\n` +
      `Supprime-le ou renomme-le manuellement si tu veux forcer la recréation.`
    );
  }
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log(`✔ [${label}] ${relPath} créé.`);
}

try {
  // ==============================================================
  // 1) aggregates.ts — getRealCaTrend -> getCaTrend paramétrable
  // ==============================================================
  const aggregatesPath = path.join("src", "lib", "bi", "aggregates.ts");

  const oldTrendBlock = `export interface CaTrendPoint {
  moisKey: string; // "2026-08"
  mois: string;    // "Aoû 2026"
  ca: number;
  achats: number;
}

const MOIS_COURTS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function monthKey(d: Date): string {
  return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, "0")}\`;
}

export async function getRealCaTrend(tenantId: string): Promise<CaTrendPoint[]> {
  const [sales, purchases] = await Promise.all([
    prisma.sale.findMany({ where: { tenantId }, select: { date: true, montantHT: true } }),
    prisma.purchase.findMany({ where: { tenantId }, select: { date: true, montantHT: true } }),
  ]);

  // Aucune transaction réelle => aucun point. Le graphe reste vide,
  // exactement comme une chaîne YouTube sans vidéo publiée.
  if (sales.length === 0 && purchases.length === 0) return [];

  const caByMonth = new Map<string, number>();
  const achatsByMonth = new Map<string, number>();

  for (const s of sales) {
    const m = s.date.substring(0, 7); // "YYYY-MM", champ date = String en base
    caByMonth.set(m, (caByMonth.get(m) || 0) + s.montantHT);
  }
  for (const p of purchases) {
    const m = p.date.substring(0, 7);
    achatsByMonth.set(m, (achatsByMonth.get(m) || 0) + p.montantHT);
  }

  // Le point de départ = le mois de la première transaction réelle (vente OU achat),
  // jamais janvier par défaut.
  const allMonths = Array.from(new Set([...caByMonth.keys(), ...achatsByMonth.keys()])).sort();
  const [startY, startM] = allMonths[0].split("-").map(Number);
  const cursor = new Date(startY, startM - 1, 1);
  const currentKey = monthKey(new Date());

  const points: CaTrendPoint[] = [];
  while (monthKey(cursor) <= currentKey) {
    const key = monthKey(cursor);
    points.push({
      moisKey: key,
      mois: \`\${MOIS_COURTS[cursor.getMonth()]} \${cursor.getFullYear()}\`,
      ca: caByMonth.get(key) || 0,       // 0 réel si pas de vente ce mois-là, jamais une valeur inventée
      achats: achatsByMonth.get(key) || 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return points;
}`;

  const newTrendBlock = `export interface CaTrendPoint {
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
  return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, "0")}-\${String(d.getDate()).padStart(2, "0")}\`;
}
function monthKey(d: Date): string {
  return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, "0")}\`;
}
function dayLabel(d: Date): string {
  return \`\${d.getDate()} \${MOIS_COURTS[d.getMonth()]}\`;
}
function monthLabel(d: Date): string {
  return \`\${MOIS_COURTS[d.getMonth()]} \${d.getFullYear()}\`;
}

export async function getCaTrend(tenantId: string, period: TrendPeriod): Promise<CaTrendPoint[]> {
  const [sales, purchases] = await Promise.all([
    prisma.sale.findMany({ where: { tenantId }, select: { date: true, montantHT: true } }),
    prisma.purchase.findMany({ where: { tenantId }, select: { date: true, montantHT: true } }),
  ]);

  if (sales.length === 0 && purchases.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let from: Date;
  let to: Date = today;
  let granularity: "day" | "month";

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
    const allDates = [...sales.map((s) => s.date), ...purchases.map((p) => p.date)].sort();
    const [fy, fm, fd] = allDates[0].split("-").map(Number);
    from = new Date(fy, fm - 1, fd);
    granularity = "month";
  }

  if (to < from) return [];

  const caByKey = new Map<string, number>();
  const achatsByKey = new Map<string, number>();
  const keyOf = (dateStr: string) => (granularity === "day" ? dateStr : dateStr.substring(0, 7));

  for (const s of sales) {
    const k = keyOf(s.date);
    caByKey.set(k, (caByKey.get(k) || 0) + s.montantHT);
  }
  for (const p of purchases) {
    const k = keyOf(p.date);
    achatsByKey.set(k, (achatsByKey.get(k) || 0) + p.montantHT);
  }

  const points: CaTrendPoint[] = [];
  const cursor = new Date(from);

  while (cursor <= to) {
    const key = granularity === "day" ? dayKey(cursor) : monthKey(cursor);
    points.push({
      moisKey: key,
      mois: granularity === "day" ? dayLabel(cursor) : monthLabel(cursor),
      ca: caByKey.get(key) || 0,
      achats: achatsByKey.get(key) || 0,
    });
    if (granularity === "day") cursor.setDate(cursor.getDate() + 1);
    else cursor.setMonth(cursor.getMonth() + 1);
  }
  return points;
}

export async function getRealCaTrend(tenantId: string): Promise<CaTrendPoint[]> {
  return getCaTrend(tenantId, { type: "all" });
}`;

  applyReplace(aggregatesPath, oldTrendBlock, newTrendBlock, "aggregates.ts (getCaTrend paramétrable)");

  // ==============================================================
  // 2) Nouvelle route : GET /api/v1/bi/dashboard/trend
  // ==============================================================
  const trendRouteContent = `export const dynamic = 'force-dynamic';

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
    } else if (/^\\d+d$/.test(period)) {
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
      return NextResponse.json({ error: \`Paramètre period non reconnu : \${period}\` }, { status: 400 });
    }

    const trendCA = await getCaTrend(tenantId, trendPeriod);
    return NextResponse.json({ success: true, data: { trendCA } });
  } catch (error) {
    console.error("Erreur BI trend:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
});
`;

  createFileIfAbsent(
    path.join("src", "app", "api", "v1", "bi", "dashboard", "trend", "route.ts"),
    trendRouteContent,
    "Nouvelle route trend/route.ts"
  );

  // ==============================================================
  // 3) workspace-bi/page.tsx
  // ==============================================================
  const pagePath = path.join("src", "app", "(app)", "workspace-bi", "page.tsx");

  applyReplace(
    pagePath,
    `  const [aiData, setAiData] = useState<any>(null);`,
    `  const [aiData, setAiData] = useState<any>(null);

  // Sélecteur de période pour la courbe CA/Achats (données réelles uniquement)
  const [caPeriod, setCaPeriod] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [trendCA, setTrendCA] = useState<any[]>([]);`,
    "page.tsx (states période)"
  );

  applyReplace(
    pagePath,
    `  // ── Chargement des données ─────────────────────────────────────────────────
  const fetchTabMetrics = useCallback(async (tab: string) => {`,
    `  // ── Chargement des données ─────────────────────────────────────────────────
  const fetchTrend = useCallback(async (period: string, from?: string, to?: string) => {
    try {
      const params = new URLSearchParams({ period });
      if (period === "custom" && from && to) {
        params.set("from", from);
        params.set("to", to);
      }
      const r = await fetch(\`/api/v1/bi/dashboard/trend?\${params.toString()}\`);
      const json = r.ok ? await r.json() : null;
      if (json?.data?.trendCA) setTrendCA(json.data.trendCA);
    } catch {
      // Silencieux : la carte affiche "Aucune donnée disponible" par défaut, jamais une valeur inventée.
    }
  }, []);

  useEffect(() => {
    if (caPeriod === "custom" && (!customFrom || !customTo)) return;
    fetchTrend(caPeriod, customFrom, customTo);
  }, [caPeriod, customFrom, customTo, fetchTrend]);

  const fetchTabMetrics = useCallback(async (tab: string) => {`,
    "page.tsx (fetchTrend + useEffect)"
  );

  applyReplace(
    pagePath,
    `  const caTrendData = overviewData?.trendCA ?? [];`,
    `  const caTrendData = trendCA;

  const now = new Date();
  const MOIS_LONGS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const caPeriodYears = [now.getFullYear(), now.getFullYear() - 1];
  const caPeriodMonths = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { key: \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, "0")}\`, label: MOIS_LONGS[d.getMonth()] };
  });`,
    "page.tsx (caTrendData réel + options dynamiques)"
  );

  applyReplace(
    pagePath,
    `          {/* Chart CA Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Évolution du CA & Achats (année en cours)
              </CardTitle>
              <CardDescription>Tendance mensuelle — importez vos ventes pour actualiser</CardDescription>
            </CardHeader>
            <CardContent>
              <CaTrendChart data={caTrendData} height={240} />
            </CardContent>
          </Card>`,
    `          {/* Chart CA Trend */}
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Évolution du CA & Achats
                </CardTitle>
                <CardDescription>Basé sur vos ventes et achats réels enregistrés</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={caPeriod}
                  onChange={(e) => setCaPeriod(e.target.value)}
                  className="p-2 rounded-md border text-xs"
                >
                  <option value="7d">7 derniers jours</option>
                  <option value="28d">28 derniers jours</option>
                  <option value="90d">90 derniers jours</option>
                  <option value="365d">365 derniers jours</option>
                  <option value="all">Depuis toujours</option>
                  {caPeriodYears.map((y) => (
                    <option key={\`year:\${y}\`} value={\`year:\${y}\`}>{y}</option>
                  ))}
                  {caPeriodMonths.map((m) => (
                    <option key={\`month:\${m.key}\`} value={\`month:\${m.key}\`}>{m.label}</option>
                  ))}
                  <option value="custom">Période personnalisée</option>
                </select>
                {caPeriod === "custom" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="p-2 rounded-md border text-xs"
                    />
                    <span className="text-xs text-muted-foreground">→</span>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="p-2 rounded-md border text-xs"
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CaTrendChart data={caTrendData} height={240} />
            </CardContent>
          </Card>`,
    "page.tsx (sélecteur de période dans le header du graphe)"
  );

  console.log("\n✅ Correctif appliqué avec succès sur les 3 fichiers.");
  console.log("   Prochaine étape : npx tsc --noEmit puis vérifier le sélecteur de période dans l'onglet Vue d'ensemble.");
} catch (err) {
  console.error("\n✗ Échec de l'application du correctif :");
  console.error(err.message);
  process.exit(1);
}

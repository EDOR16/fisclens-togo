/**
 * apply-fix-catrend.js
 * ---------------------------------------------------------------
 * Remplace buildMockCaTrend (données inventées) par getRealCaTrend
 * (agrégation réelle Sale/Purchase par mois) dans les 3 fichiers
 * concernés du projet FiscLens.
 *
 * Usage (depuis la racine du projet, dans CMD) :
 *   node apply-fix-catrend.js
 *
 * Le script vérifie que le texte exact à remplacer existe avant de
 * toucher au fichier. S'il ne trouve pas la correspondance exacte,
 * il n'écrit rien et affiche un message d'erreur clair — aucune
 * modification silencieuse, aucune supposition.
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
      `Le fichier a probablement changé depuis l'audit — vérifie-le manuellement avant de relancer.`
    );
  }
  const occurrences = content.split(oldStr).length - 1;
  if (occurrences > 1) {
    throw new Error(
      `[${label}] Le texte attendu apparaît ${occurrences} fois dans ${relPath} — remplacement ambigu, arrêt par sécurité.`
    );
  }
  const updated = content.replace(oldStr, newStr);
  fs.writeFileSync(full, updated, "utf8");
  console.log(`✔ [${label}] ${relPath} mis à jour.`);
}

try {
  // ------------------------------------------------------------
  // 1) src/lib/bi/aggregates.ts — ajout de getRealCaTrend
  // ------------------------------------------------------------
  const aggregatesPath = path.join("src", "lib", "bi", "aggregates.ts");

  const aggregatesAnchor = `export async function calculateGlobalKPIs(tenantId: string): Promise<DashboardKPIs> {`;

  const newFunctionBlock = `export interface CaTrendPoint {
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
}

export async function calculateGlobalKPIs(tenantId: string): Promise<DashboardKPIs> {`;

  applyReplace(aggregatesPath, aggregatesAnchor, newFunctionBlock, "aggregates.ts");

  // ------------------------------------------------------------
  // 2) overview/route.ts — exposer trendCA
  // ------------------------------------------------------------
  const overviewPath = path.join("src", "app", "api", "v1", "bi", "dashboard", "overview", "route.ts");

  const overviewOld = `import { calculateGlobalKPIs } from "@/lib/bi/aggregates";

export const GET = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    const kpis = await calculateGlobalKPIs(tenantId);

    return NextResponse.json({
      success: true,
      data: {
        ca: kpis.ca,
        margeBrute: kpis.margeBrute,
        margePercent: kpis.margePercent,
        trésorerie: kpis.trésorerie,
        clientsActifs: kpis.clientsActifs,
        tendanceVsN1: kpis.tendanceVsN1,
      },
    });
  } catch (error) {`;

  const overviewNew = `import { calculateGlobalKPIs, getRealCaTrend } from "@/lib/bi/aggregates";

export const GET = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    const [kpis, trendCA] = await Promise.all([
      calculateGlobalKPIs(tenantId),
      getRealCaTrend(tenantId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ca: kpis.ca,
        margeBrute: kpis.margeBrute,
        margePercent: kpis.margePercent,
        trésorerie: kpis.trésorerie,
        clientsActifs: kpis.clientsActifs,
        tendanceVsN1: kpis.tendanceVsN1,
        trendCA,
      },
    });
  } catch (error) {`;

  applyReplace(overviewPath, overviewOld, overviewNew, "overview/route.ts");

  // ------------------------------------------------------------
  // 3) workspace-bi/page.tsx — supprimer buildMockCaTrend + son usage
  // ------------------------------------------------------------
  const pagePath = path.join("src", "app", "(app)", "workspace-bi", "page.tsx");

  const pageOldFunction = `// ─── Génération de données de démo (chart) ────────────────────────────────────

function buildMockCaTrend(ca: number) {
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const now = new Date().getMonth();
  return months.slice(0, now + 1).map((mois, i) => ({
    mois,
    ca: Math.round(ca * (0.6 + 0.4 * Math.sin(i * 0.8 + 1)) * (0.9 + Math.random() * 0.2)),
    achats: Math.round(ca * 0.4 * (0.6 + 0.4 * Math.sin(i * 0.8)) * (0.85 + Math.random() * 0.2)),
  }));
}

// ─── Composant Principal ──────────────────────────────────────────────────────`;

  const pageNewFunction = `// ─── Composant Principal ──────────────────────────────────────────────────────`;

  applyReplace(pagePath, pageOldFunction, pageNewFunction, "page.tsx (suppression buildMockCaTrend)");

  const pageOldUsage = `  const caTrendData = overviewData?.ca
    ? buildMockCaTrend(overviewData.ca)
    : [];`;

  const pageNewUsage = `  const caTrendData = overviewData?.trendCA ?? [];`;

  applyReplace(pagePath, pageOldUsage, pageNewUsage, "page.tsx (caTrendData réel)");

  console.log("\n✅ Correctif appliqué avec succès sur les 3 fichiers.");
  console.log("   Prochaine étape : npx tsc --noEmit puis relancer le serveur pour vérifier visuellement.");
} catch (err) {
  console.error("\n✗ Échec de l'application du correctif :");
  console.error(err.message);
  process.exit(1);
}

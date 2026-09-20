import { calculateGlobalKPIs, getCaTrend } from "../src/lib/bi/aggregates";
import { formatFcfaSmart } from "../src/lib/format-money";
import { prisma } from "../src/lib/server/prisma";

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { name: { contains: "AUTO PLUS" } } });
  if (!tenant) throw new Error("AUTO PLUS non trouvé");

  console.log("Tenant:", tenant.name, tenant.id);
  const kpis = await calculateGlobalKPIs(tenant.id);
  console.log("\n--- KPIS GLOBAUX ---");
  console.log("CA:", formatFcfaSmart(kpis.ca), `(${kpis.ca})`);
  console.log("Marge Brute:", formatFcfaSmart(kpis.margeBrute), `(${kpis.margeBrute})`);
  console.log("Marge %:", kpis.margePercent + "%");
  console.log("Clients Actifs:", kpis.clientsActifs);
  console.log("Trésorerie:", formatFcfaSmart(kpis.trésorerie), `(${kpis.trésorerie})`);

  const trend = await getCaTrend(tenant.id, { type: "all" });
  console.log("\n--- TENDANCE MENSUELLE (Trend Points) ---");
  console.log(`Nombre de points mensuels : ${trend.length}`);
  console.log("5 premiers points:", trend.slice(0, 5));
  console.log("5 derniers points:", trend.slice(-5));
}

main().finally(() => prisma.$disconnect());

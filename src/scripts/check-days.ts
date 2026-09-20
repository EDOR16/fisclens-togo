import { prisma } from "../../src/lib/server/prisma";

async function main() {
  const days = await prisma.$queryRaw`
    SELECT "date", count(*)::int as count 
    FROM sales 
    WHERE "date" LIKE '2026-09%'
    GROUP BY "date" 
    ORDER BY "date" LIMIT 15;
  `;
  console.log("Jours dans 2026-09:", days);

  const purchases = await prisma.$queryRaw`
    SELECT p."tenantId", count(*)::int as count, sum(p."montantHT")::float as totalHT
    FROM purchases p
    GROUP BY p."tenantId";
  `;
  console.log("Purchases:", purchases);

  const tenant = await prisma.tenant.findFirst();
  console.log("Tenant:", tenant?.id, tenant?.name);
}

main().finally(() => prisma.$disconnect());

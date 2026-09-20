import { prisma } from "../../src/lib/server/prisma";

async function main() {
  const dates = await prisma.$queryRaw`
    SELECT SUBSTRING("date", 1, 7) as mois, count(*)::int as count 
    FROM sales 
    GROUP BY SUBSTRING("date", 1, 7) 
    ORDER BY mois;
  `;
  console.log("Mois dans sales:", dates);

  const purchasesCount = await prisma.purchase.count();
  console.log("Nombre d'achats:", purchasesCount);

  const products = await prisma.productRef.count();
  console.log("Nombre de produits:", products);

  const ecritures = await prisma.ecriture.count();
  console.log("Nombre d'écritures:", ecritures);
}

main().finally(() => prisma.$disconnect());

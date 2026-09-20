const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { name: "ESSAY1" } });
  if (!tenant) { console.log("Tenant ESSAY1 introuvable."); return; }

  const [products, clients, sales, purchases] = await Promise.all([
    prisma.productRef.count({ where: { tenantId: tenant.id } }),
    prisma.clientRef.count({ where: { tenantId: tenant.id } }),
    prisma.sale.count({ where: { tenantId: tenant.id } }),
    prisma.purchase.count({ where: { tenantId: tenant.id } }),
  ]);

  console.log(`Tenant: ${tenant.name} (${tenant.id})`);
  console.log(`Produits: ${products} | Clients: ${clients} | Ventes: ${sales} | Achats: ${purchases}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

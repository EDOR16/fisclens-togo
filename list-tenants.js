/**
 * list-tenants.js
 * ---------------------------------------------------------------
 * Liste tous les tenants (dossiers) de la base avec leurs compteurs
 * de données réelles. NE SUPPRIME RIEN — sert uniquement à identifier
 * avec certitude l'ID exact du tenant ESSAY1 avant toute suppression.
 *
 * Usage (PowerShell, depuis la racine du projet) :
 *   node .\list-tenants.js
 * ---------------------------------------------------------------
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      nif: true,
      createdAt: true,
      _count: {
        select: {
          ecritures: true,
          comptes: true,
          sales: true,
          purchases: true,
          clientRefs: true,
          productRefs: true,
          userTenants: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (tenants.length === 0) {
    console.log("Aucun tenant trouvé dans la base.");
    return;
  }

  console.log(`\n${tenants.length} tenant(s) trouvé(s) :\n`);
  for (const t of tenants) {
    console.log("─".repeat(70));
    console.log(`ID          : ${t.id}`);
    console.log(`Nom         : ${t.name}`);
    console.log(`NIF         : ${t.nif ?? "(non renseigné)"}`);
    console.log(`Créé le     : ${t.createdAt.toISOString().substring(0, 10)}`);
    console.log(`Écritures   : ${t._count.ecritures}`);
    console.log(`Comptes     : ${t._count.comptes}`);
    console.log(`Ventes (BI) : ${t._count.sales}`);
    console.log(`Achats (BI) : ${t._count.purchases}`);
    console.log(`Clients (BI): ${t._count.clientRefs}`);
    console.log(`Produits(BI): ${t._count.productRefs}`);
    console.log(`Utilisateurs: ${t._count.userTenants}`);
  }
  console.log("─".repeat(70));
  console.log("\nCopie l'ID exact du tenant à supprimer, puis utilise :");
  console.log('  node .\\delete-tenant.js --tenant-id=<ID_COPIÉ> --i-am-sure');
}

main()
  .catch((e) => {
    console.error("Erreur :", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

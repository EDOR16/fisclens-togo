/**
 * delete-tenant.js
 * ---------------------------------------------------------------
 * Supprime UN SEUL tenant (dossier) identifié par son ID exact,
 * ainsi que toutes ses données liées (Écritures, Comptes, Ventes,
 * Achats, Clients, Produits BI, CSP, alertes, forecasts, membres).
 *
 * Le schéma Prisma définit onDelete: Cascade sur les 13 tables liées
 * au tenant — une seule suppression du Tenant nettoie donc tout,
 * sans toucher aux autres dossiers.
 *
 * Sécurité :
 *  - exige --tenant-id=<ID> (pas un nom, pour éviter toute ambiguïté
 *    entre deux dossiers qui porteraient un nom proche)
 *  - exige --i-am-sure
 *  - affiche un résumé complet du tenant AVANT suppression et
 *    demande une confirmation manuelle dans le terminal
 *
 * Usage (PowerShell, depuis la racine du projet) :
 *   node .\list-tenants.js                                  (pour trouver l'ID)
 *   node .\delete-tenant.js --tenant-id=<ID> --i-am-sure
 * ---------------------------------------------------------------
 */

const { PrismaClient } = require("@prisma/client");
const readline = require("readline");

const prisma = new PrismaClient();

function getArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

function askConfirmation(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const tenantId = getArg("tenant-id");
  const isConfirmedFlag = process.argv.includes("--i-am-sure");

  if (!tenantId) {
    console.error("❌ Argument manquant : --tenant-id=<ID>");
    console.error("   Lance d'abord : node .\\list-tenants.js pour copier l'ID exact.");
    process.exit(1);
  }
  if (!isConfirmedFlag) {
    console.error("❌ Refusé : ajoute --i-am-sure pour confirmer que tu comprends que c'est irréversible.");
    process.exit(1);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
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
          cspEvaluations: true,
          alerts: true,
          forecasts: true,
        },
      },
    },
  });

  if (!tenant) {
    console.error(`❌ Aucun tenant trouvé avec l'ID "${tenantId}". Vérifie avec node .\\list-tenants.js.`);
    process.exit(1);
  }

  console.log("\n⚠️  Tu es sur le point de SUPPRIMER DÉFINITIVEMENT ce tenant :\n");
  console.log(`  ID          : ${tenant.id}`);
  console.log(`  Nom         : ${tenant.name}`);
  console.log(`  NIF         : ${tenant.nif ?? "(non renseigné)"}`);
  console.log(`  Créé le     : ${tenant.createdAt.toISOString().substring(0, 10)}`);
  console.log(`  Écritures   : ${tenant._count.ecritures}`);
  console.log(`  Comptes     : ${tenant._count.comptes}`);
  console.log(`  Ventes (BI) : ${tenant._count.sales}`);
  console.log(`  Achats (BI) : ${tenant._count.purchases}`);
  console.log(`  Clients (BI): ${tenant._count.clientRefs}`);
  console.log(`  Produits(BI): ${tenant._count.productRefs}`);
  console.log(`  Évaluations CSP : ${tenant._count.cspEvaluations}`);
  console.log(`  Alertes     : ${tenant._count.alerts}`);
  console.log(`  Prévisions  : ${tenant._count.forecasts}`);
  console.log(`  Membres liés: ${tenant._count.userTenants} (leurs comptes utilisateur ne sont PAS supprimés, seule leur adhésion à ce tenant l'est)`);
  console.log("\nCette action est IRRÉVERSIBLE et ne touchera QUE ce tenant précis (les autres dossiers restent intacts).\n");

  const answer = await askConfirmation(
    `Tape exactement le nom du tenant ("${tenant.name}") pour confirmer la suppression : `
  );

  if (answer !== tenant.name) {
    console.error("\n❌ Le nom saisi ne correspond pas exactement. Suppression annulée, rien n'a été touché.");
    process.exit(1);
  }

  await prisma.tenant.delete({ where: { id: tenant.id } });

  console.log(`\n✅ Le tenant "${tenant.name}" (${tenant.id}) et toutes ses données ont été supprimés proprement.`);
  console.log("   Les autres dossiers de la base n'ont pas été touchés.");
}

main()
  .catch((e) => {
    console.error("\n✗ Erreur lors de la suppression :", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

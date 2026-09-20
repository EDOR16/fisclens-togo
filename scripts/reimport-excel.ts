import * as fs from "fs";
import * as path from "path";
import { prisma } from "../src/lib/server/prisma";
import { processUnifiedExcel } from "../src/lib/bi/unified-excel-import";

async function main() {
  console.log("Recherche du fichier Excel...");
  const filePath = path.join(process.cwd(), "FiscLens_AutoPlusTogo_10000_Ventes.xlsx");
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier introuvable: ${filePath}`);
  }

  // Trouver le premier tenant actif
  const tenant = await prisma.tenant.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!tenant) {
    throw new Error("Aucun tenant trouvé dans la base de données.");
  }

  console.log(`Traitement de l'import pour le tenant: ${tenant.name} (${tenant.id})`);
  const buffer = fs.readFileSync(filePath);

  console.log("Exécution de l'import unifié (nettoyage précédent + insertion complète)...");
  const result = await processUnifiedExcel(buffer, tenant.id);

  console.log("✅ Résultat de l'import :", result);
}

main()
  .catch((err) => {
    console.error("❌ Erreur:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

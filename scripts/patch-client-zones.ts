/**
 * Patch urgent : corrige les zoneGeo des 14 clients AFRIQ_TECH
 * créés à la volée (tous Maritime par défaut).
 * 
 * Exécuter : npx tsx scripts/patch-client-zones.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mapping code → zoneGeo réel selon Repertoire_Clients du fichier source
const ZONE_MAP: Record<string, string> = {
  "CLI-SOGEA":   "Maritime",   // Lomé
  "CLI-TOTAL":   "Maritime",   // Lomé
  "CLI-PHARM":   "Maritime",   // Lomé
  "CLI-ANEHO":   "Maritime",   // Aného (Maritime)
  "CLI-SOTOTO":  "Maritime",   // Tsévié (Maritime)
  "CLI-HORIZON": "Maritime",   // Lomé (Maritime)
  "CLI-PLATEAU": "Plateaux",   // Région Plateaux
  "CLI-ATAK":    "Plateaux",   // Atakpamé (Plateaux)
  "CLI-AGROK":   "Plateaux",   // Région Plateaux
  "CLI-BLITTA":  "Centrale",   // Blitta (Centrale)
  "CLI-KARA-T":  "Kara",       // Kara
  "CLI-BASSAR":  "Kara",       // Bassar (Kara)
  "CLI-SAVAN":   "Savanes",    // Région Savanes
  "CLI-MANGO":   "Savanes",    // Mango (Savanes)
};

async function main() {
  console.log("🔧 Patch zones géographiques clients...\n");
  let updated = 0;

  for (const [code, zoneGeo] of Object.entries(ZONE_MAP)) {
    const result = await prisma.clientRef.updateMany({
      where: { code },
      data: { zoneGeo },
    });
    if (result.count > 0) {
      console.log(`  ✓ ${code.padEnd(15)} → ${zoneGeo}`);
      updated += result.count;
    }
  }

  console.log(`\n✅ ${updated} clients mis à jour.`);

  // Vérification
  const clients = await prisma.clientRef.groupBy({
    by: ["zoneGeo"],
    _count: { zoneGeo: true },
  });
  console.log("\n📊 Distribution par zone :");
  clients.forEach((c) => console.log(`  ${c.zoneGeo}: ${c._count.zoneGeo} client(s)`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

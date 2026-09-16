/**
 * Extrait l'onglet Ecritures_Comptables du fichier principal
 * et crée un fichier Excel dédié pour l'import dans Saisie.
 *
 * Usage : npx tsx scripts/extract-ecritures.ts
 */

import * as XLSX from "xlsx";
import * as path from "path";

const source = path.join(process.cwd(), "FiscLens_AutoPlusTogo_10000_Ventes.xlsx");
const target = path.join(process.cwd(), "FiscLens_AutoPlusTogo_Ecritures_Import.xlsx");

console.log(`📖 Lecture de ${source}...`);
const wb = XLSX.readFile(source);

const ecrituresSheet = wb.Sheets["Ecritures_Comptables"];
if (!ecrituresSheet) {
  console.error("❌ Onglet 'Ecritures_Comptables' introuvable");
  console.error("   Onglets disponibles :", wb.SheetNames.join(", "));
  process.exit(1);
}

const rows: any[] = XLSX.utils.sheet_to_json(ecrituresSheet);
console.log(`📊 ${rows.length} lignes d'écritures trouvées`);

// Créer un nouveau classeur avec seulement cet onglet
const newWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWb, XLSX.utils.json_to_sheet(rows), "Ecritures");

XLSX.writeFile(newWb, target);
console.log(`✅ Fichier créé : ${target}`);
console.log(`   Lignes : ${rows.length}`);
console.log(`   Colonnes : ${Object.keys(rows[0] || {}).join(", ")}`);
/**
 * Extrait un échantillon des écritures (par défaut 2000 pièces uniques = ~6000 lignes)
 * pour tester l'import sans freeze navigateur.
 *
 * Usage : npx tsx scripts/extract-sample.ts [nbPieces]
 *   npx tsx scripts/extract-sample.ts        → 2000 pièces
 *   npx tsx scripts/extract-sample.ts 500    → 500 pièces
 */

import * as XLSX from "xlsx";
import * as path from "path";

const nbPieces = parseInt(process.argv[2] || "2000", 10);

const source = path.join(process.cwd(), "FiscLens_AutoPlusTogo_Ecritures_Import.xlsx");
const target = path.join(process.cwd(), `FiscLens_AutoPlusTogo_Ecritures_${nbPieces}.xlsx`);

console.log(`📖 Lecture de ${source}...`);
const wb = XLSX.readFile(source);
const sheet = wb.Sheets["Ecritures"];
const allRows: any[] = XLSX.utils.sheet_to_json(sheet);
console.log(`📊 ${allRows.length} lignes au total`);

// Regrouper par pièce
const piecesMap = new Map<string, any[]>();
for (const row of allRows) {
  const key = String(row.Piece || "");
  if (!piecesMap.has(key)) piecesMap.set(key, []);
  piecesMap.get(key)!.push(row);
}
console.log(`📦 ${piecesMap.size} pièces uniques`);

// Prendre les N premières pièces (dans l'ordre d'apparition)
const piecesList = Array.from(piecesMap.entries()).slice(0, nbPieces);
const sampleRows = piecesList.flatMap(([, rows]) => rows);

console.log(`✂️  Échantillon : ${piecesList.length} pièces → ${sampleRows.length} lignes`);

// Vérifier équilibre global (débit = crédit)
const totalDebit = sampleRows.reduce((s, r) => s + Number(r.Debit || 0), 0);
const totalCredit = sampleRows.reduce((s, r) => s + Number(r.Credit || 0), 0);
console.log(`📊 Équilibre : Débit ${totalDebit.toLocaleString("fr-FR")} / Crédit ${totalCredit.toLocaleString("fr-FR")} → ${totalDebit === totalCredit ? "OK ✅" : "DÉSÉQUILIBRÉ ❌"}`);

// Écrire
const newWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWb, XLSX.utils.json_to_sheet(sampleRows), "Ecritures");
XLSX.writeFile(newWb, target);

console.log(`✅ Fichier créé : ${target}`);
console.log(`   Taille approx : ${(JSON.stringify(sampleRows).length / 1024).toFixed(0)} Ko`);
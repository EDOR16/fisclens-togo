/**
 * Vérifie qu'aucune écriture ne dépasse INT4 (2 147 483 647 FCFA)
 */
import * as XLSX from "xlsx";
import * as path from "path";

const source = path.join(process.cwd(), "FiscLens_AutoPlusTogo_Ecritures_Import.xlsx");
const wb = XLSX.readFile(source);
const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets["Ecritures"]);

const INT4_MAX = 2_147_483_647;
const depassements = rows.filter((r) => 
  Number(r.Debit || 0) > INT4_MAX || Number(r.Credit || 0) > INT4_MAX
);

if (depassements.length === 0) {
  console.log("✅ Aucun depassement INT4 detecte");
  console.log(`   ${rows.length} lignes verifiees, max = ${Math.max(...rows.map((r) => Math.max(Number(r.Debit || 0), Number(r.Credit || 0)))).toLocaleString("fr-FR")} FCFA`);
} else {
  console.log(`❌ ${depassements.length} depassement(s) INT4 detecte(s) :`);
  depassements.slice(0, 10).forEach((r) => {
    console.log(`   ${r.Piece} | ${r.Compte} | Debit: ${r.Debit} | Credit: ${r.Credit}`);
  });
}
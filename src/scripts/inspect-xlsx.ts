import * as XLSX from "xlsx";
import * as path from "path";

const file = path.join(process.cwd(), "FiscLens_AutoPlusTogo_10000_Ventes.xlsx");
const wb = XLSX.readFile(file, { sheetRows: 5 });
console.log("Sheet names in 10000_Ventes:", wb.SheetNames);
for (const name of wb.SheetNames) {
  const data = XLSX.utils.sheet_to_json(wb.Sheets[name]);
  console.log(`Sheet "${name}" (first row):`, data[0]);
}

import * as XLSX from "xlsx";
import * as path from "path";
import {
  TEST_ECRITURES_1MOIS,
  TEST_VENTES_BI_1MOIS,
  TEST_ACHATS_BI_1MOIS,
  TEST_PRODUITS_1MOIS,
  TEST_CLIENTS_1MOIS,
  FICHE_SOCIETE,
} from "../src/lib/fiscal/test-dataset";

function generate() {
  const rootDir = path.resolve(__dirname, "..");

  const wb = XLSX.utils.book_new();

  // 1. Ecritures Comptables
  const wsEcritures = XLSX.utils.json_to_sheet(TEST_ECRITURES_1MOIS);
  XLSX.utils.book_append_sheet(wb, wsEcritures, "Ecritures_Comptables");

  // 2. Ventes détaillées
  const wsVentes = XLSX.utils.json_to_sheet(TEST_VENTES_BI_1MOIS);
  XLSX.utils.book_append_sheet(wb, wsVentes, "Ventes");

  // 3. Achats détaillés
  const wsAchats = XLSX.utils.json_to_sheet(TEST_ACHATS_BI_1MOIS);
  XLSX.utils.book_append_sheet(wb, wsAchats, "Achats");

  // 4. Produits
  const wsProduits = XLSX.utils.json_to_sheet(TEST_PRODUITS_1MOIS);
  XLSX.utils.book_append_sheet(wb, wsProduits, "Catalogue_Produits");

  // 5. Clients
  const wsClients = XLSX.utils.json_to_sheet(TEST_CLIENTS_1MOIS);
  XLSX.utils.book_append_sheet(wb, wsClients, "Repertoire_Clients");

  // 6. Fiche Société
  const wsFiche = XLSX.utils.json_to_sheet(FICHE_SOCIETE);
  XLSX.utils.book_append_sheet(wb, wsFiche, "Fiche_Entreprise_Togo");

  const fullPath = path.join(rootDir, "FiscLens_Test_AFRIQ_TECH_1Mois.xlsx");
  XLSX.writeFile(wb, fullPath);
  console.log(`[OK] Classeur généré : ${fullPath}`);

  // Mettre à jour test_ecritures_syscohada.xlsx
  const comptaPath = path.join(rootDir, "test_ecritures_syscohada.xlsx");
  XLSX.writeFile(wb, comptaPath);
  console.log(`[OK] Classeur mis à jour : ${comptaPath}`);
}

generate();

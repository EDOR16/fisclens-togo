export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import {
  TEST_ECRITURES_1MOIS,
  TEST_VENTES_BI_1MOIS,
  TEST_ACHATS_BI_1MOIS,
  TEST_PRODUITS_1MOIS,
  TEST_CLIENTS_1MOIS,
  FICHE_SOCIETE,
} from "@/lib/fiscal/test-dataset";

export async function GET(req: NextRequest) {
  try {
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

    // Génération du buffer binaire Excel
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="FiscLens_Test_AFRIQ_TECH_1Mois.xlsx"',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "EXPORT_FAILED", message: error.message },
      { status: 500 }
    );
  }
}

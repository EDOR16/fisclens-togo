const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const testData = [
  // --- ACHATS 1 : Achat de marchandises ETS KOFFI Lomé ---
  {
    Journal: "ACHATS",
    Date: "2026-08-10",
    Piece: "FAC-ACH-2026-001",
    Compte: "601100",
    Libelle: "Achat marchandises ETS KOFFI",
    Debit: 1000000,
    Credit: 0,
  },
  {
    Journal: "ACHATS",
    Date: "2026-08-10",
    Piece: "FAC-ACH-2026-001",
    Compte: "445200",
    Libelle: "TVA récupérable sur achats (18%)",
    Debit: 180000,
    Credit: 0,
  },
  {
    Journal: "ACHATS",
    Date: "2026-08-10",
    Piece: "FAC-ACH-2026-001",
    Compte: "401100",
    Libelle: "Fournisseur ETS KOFFI",
    Debit: 0,
    Credit: 1180000,
  },

  // --- ACHATS 2 : Facture Électricité CEET Lomé ---
  {
    Journal: "ACHATS",
    Date: "2026-08-15",
    Piece: "FAC-ACH-2026-002",
    Compte: "605100",
    Libelle: "Facture électricité CEET Lomé",
    Debit: 150000,
    Credit: 0,
  },
  {
    Journal: "ACHATS",
    Date: "2026-08-15",
    Piece: "FAC-ACH-2026-002",
    Compte: "445400",
    Libelle: "TVA déductible sur services (18%)",
    Debit: 27000,
    Credit: 0,
  },
  {
    Journal: "ACHATS",
    Date: "2026-08-15",
    Piece: "FAC-ACH-2026-002",
    Compte: "401200",
    Libelle: "Fournisseur CEET Lomé",
    Debit: 0,
    Credit: 177000,
  },

  // --- VENTES 1 : Vente de marchandises Société SOGEA ---
  {
    Journal: "VENTES",
    Date: "2026-08-18",
    Piece: "FAC-VTE-2026-001",
    Compte: "411100",
    Libelle: "Client Société SOGEA Lomé",
    Debit: 2360000,
    Credit: 0,
  },
  {
    Journal: "VENTES",
    Date: "2026-08-18",
    Piece: "FAC-VTE-2026-001",
    Compte: "701100",
    Libelle: "Vente marchandises en gros",
    Debit: 0,
    Credit: 2000000,
  },
  {
    Journal: "VENTES",
    Date: "2026-08-18",
    Piece: "FAC-VTE-2026-001",
    Compte: "443100",
    Libelle: "TVA facturée sur ventes (18%)",
    Debit: 0,
    Credit: 360000,
  },

  // --- VENTES 2 : Prestation de services de conseil ---
  {
    Journal: "VENTES",
    Date: "2026-08-20",
    Piece: "FAC-VTE-2026-002",
    Compte: "411200",
    Libelle: "Client Cabinet Horizon",
    Debit: 590000,
    Credit: 0,
  },
  {
    Journal: "VENTES",
    Date: "2026-08-20",
    Piece: "FAC-VTE-2026-002",
    Compte: "706100",
    Libelle: "Prestation conseil & assistance fiscale",
    Debit: 0,
    Credit: 500000,
  },
  {
    Journal: "VENTES",
    Date: "2026-08-20",
    Piece: "FAC-VTE-2026-002",
    Compte: "443100",
    Libelle: "TVA facturée sur prestations (18%)",
    Debit: 0,
    Credit: 90000,
  },

  // --- BANQUE 1 : Encaissement virement client SOGEA ---
  {
    Journal: "BANQUE",
    Date: "2026-08-22",
    Piece: "VIR-BQ-2026-001",
    Compte: "521100",
    Libelle: "Virement reçu client SOGEA Ecobank",
    Debit: 2360000,
    Credit: 0,
  },
  {
    Journal: "BANQUE",
    Date: "2026-08-22",
    Piece: "VIR-BQ-2026-001",
    Compte: "411100",
    Libelle: "Règlement facture FAC-VTE-2026-001",
    Debit: 0,
    Credit: 2360000,
  },

  // --- BANQUE 2 : Paiement fournisseur ETS KOFFI ---
  {
    Journal: "BANQUE",
    Date: "2026-08-24",
    Piece: "VIR-BQ-2026-002",
    Compte: "401100",
    Libelle: "Paiement virement ETS KOFFI",
    Debit: 1180000,
    Credit: 0,
  },
  {
    Journal: "BANQUE",
    Date: "2026-08-24",
    Piece: "VIR-BQ-2026-002",
    Compte: "521100",
    Libelle: "Virement émis Ecobank",
    Debit: 0,
    Credit: 1180000,
  },

  // --- CAISSE 1 : Règlement carburant & frais de déplacement ---
  {
    Journal: "CAISSE",
    Date: "2026-08-25",
    Piece: "PC-CAI-2026-001",
    Compte: "613300",
    Libelle: "Carburant mission commerciale Lomé",
    Debit: 45000,
    Credit: 0,
  },
  {
    Journal: "CAISSE",
    Date: "2026-08-25",
    Piece: "PC-CAI-2026-001",
    Compte: "571100",
    Libelle: "Sortie espèces caisse centrale",
    Debit: 0,
    Credit: 45000,
  },

  // --- PAIE : Salaires du mois ---
  {
    Journal: "PAIE",
    Date: "2026-08-28",
    Piece: "PAIE-2026-08",
    Compte: "661100",
    Libelle: "Salaires bruts du personnel Août 2026",
    Debit: 1500000,
    Credit: 0,
  },
  {
    Journal: "PAIE",
    Date: "2026-08-28",
    Piece: "PAIE-2026-08",
    Compte: "422000",
    Libelle: "Salaires nets à payer au personnel",
    Debit: 0,
    Credit: 1200000,
  },
  {
    Journal: "PAIE",
    Date: "2026-08-28",
    Piece: "PAIE-2026-08",
    Compte: "431100",
    Libelle: "CNSS Togo cotisations salariales",
    Debit: 0,
    Credit: 60000,
  },
  {
    Journal: "PAIE",
    Date: "2026-08-28",
    Piece: "PAIE-2026-08",
    Compte: "444100",
    Libelle: "État - Retenues fiscales IRPP / TRSG",
    Debit: 0,
    Credit: 240000,
  },

  // --- OD : Dotation aux amortissements matériel ---
  {
    Journal: "OD",
    Date: "2026-08-31",
    Piece: "OD-2026-001",
    Compte: "681300",
    Libelle: "Dotation amortissement matériel info",
    Debit: 125000,
    Credit: 0,
  },
  {
    Journal: "OD",
    Date: "2026-08-31",
    Piece: "OD-2026-001",
    Compte: "281830",
    Libelle: "Amortissement matériel informatique",
    Debit: 0,
    Credit: 125000,
  },
];

// Vérification de l'équilibre
const pieceTotals = {};
testData.forEach((row) => {
  if (!pieceTotals[row.Piece]) {
    pieceTotals[row.Piece] = { debit: 0, credit: 0, count: 0 };
  }
  pieceTotals[row.Piece].debit += row.Debit;
  pieceTotals[row.Piece].credit += row.Credit;
  pieceTotals[row.Piece].count += 1;
});

console.log("Vérification de l'équilibre comptable :");
let allBalanced = true;
for (const [piece, tot] of Object.entries(pieceTotals)) {
  const ok = tot.debit === tot.credit && tot.debit > 0;
  console.log(` - Pièce ${piece} (${tot.count} lignes) : Débit = ${tot.debit}, Crédit = ${tot.credit} -> ${ok ? "OK" : "ERREUR"}`);
  if (!ok) allBalanced = false;
}

if (!allBalanced) {
  console.error("Erreur : Certaines écritures ne sont pas équilibrées !");
  process.exit(1);
}

// 1. Créer le classeur Excel
const ws = XLSX.utils.json_to_sheet(testData);

// Définir la largeur des colonnes pour que ce soit joli
ws["!cols"] = [
  { wch: 12 }, // Journal
  { wch: 14 }, // Date
  { wch: 20 }, // Piece
  { wch: 12 }, // Compte
  { wch: 40 }, // Libelle
  { wch: 14 }, // Debit
  { wch: 14 }, // Credit
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Ecritures");

// Fichiers cibles
const rootPath = path.resolve(__dirname, "..");
const xlsxPath = path.join(rootPath, "test_ecritures_syscohada.xlsx");
const csvPath = path.join(rootPath, "test_ecritures_syscohada.csv");

// Écrire XLSX
XLSX.writeFile(wb, xlsxPath);
console.log(`Fichier Excel généré avec succès : ${xlsxPath}`);

// Écrire CSV
const csvContent = XLSX.utils.sheet_to_csv(ws);
fs.writeFileSync(csvPath, csvContent, "utf8");
console.log(`Fichier CSV généré avec succès : ${csvPath}`);

// Copier également dans le dossier Téléchargements de l'utilisateur pour un accès ultra-rapide
const downloadsPath = path.join("C:", "Users", "Admin", "Downloads");
if (fs.existsSync(downloadsPath)) {
  try {
    fs.copyFileSync(xlsxPath, path.join(downloadsPath, "test_ecritures_syscohada.xlsx"));
    fs.copyFileSync(csvPath, path.join(downloadsPath, "test_ecritures_syscohada.csv"));
    console.log(`Fichiers copiés dans le dossier Téléchargements : ${downloadsPath}`);
  } catch (e) {
    console.log("Impossible de copier dans Downloads:", e.message);
  }
}

import * as XLSX from "xlsx";
import type { BalanceRowExport, GrandLivreRowExport } from "./pdf-generator";
import type { TvaCalculationResult, PayrollCalculationResult, IsCalculationResult } from "@/lib/fiscal/togo-rules";

// ---------------------------------------------------------------------------
// 1. Export Excel Balance
// ---------------------------------------------------------------------------

export function exportBalanceExcel(
  companyName: string,
  periode: string,
  rows: BalanceRowExport[]
) {
  const data = rows.map((r) => ({
    "Code Compte": r.code,
    "Intitulé du Compte": r.libelle,
    "Mouvements Débit (FCFA)": r.debitMvt,
    "Mouvements Crédit (FCFA)": r.creditMvt,
    "Solde Débiteur (FCFA)": r.soldeDbt,
    "Solde Créditeur (FCFA)": r.soldeCdt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Balance Générale");
  XLSX.writeFile(workbook, `Balance_Generale_${companyName.replace(/\s+/g, "_")}_${periode}.xlsx`);
}

// ---------------------------------------------------------------------------
// 2. Export Excel Grand Livre
// ---------------------------------------------------------------------------

export function exportGrandLivreExcel(
  companyName: string,
  accountCode: string,
  accountName: string,
  rows: GrandLivreRowExport[]
) {
  const data = rows.map((r) => ({
    "Date": r.date,
    "N° Pièce": r.piece,
    "Journal": r.journal,
    "Libellé": r.libelle,
    "Débit (FCFA)": r.debit,
    "Crédit (FCFA)": r.credit,
    "Solde Progressif (FCFA)": r.balance,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Compte_${accountCode}`);
  XLSX.writeFile(workbook, `Grand_Livre_${accountCode}_${companyName.replace(/\s+/g, "_")}.xlsx`);
}

// ---------------------------------------------------------------------------
// 3. Export Excel Journaux
// ---------------------------------------------------------------------------

export type JournalRowExport = {
  date: string;
  piece: string;
  journal: string;
  libelle: string;
  debit: number;
  credit: number;
};

export function exportJournauxExcel(
  companyName: string,
  journalName: string,
  rows: JournalRowExport[]
) {
  const data = rows.map((r) => ({
    "Date": r.date,
    "N° Pièce": r.piece,
    "Code Journal": r.journal,
    "Libellé": r.libelle,
    "Débit (FCFA)": r.debit,
    "Crédit (FCFA)": r.credit,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Journal_${journalName}`);
  XLSX.writeFile(workbook, `Journal_${journalName}_${companyName.replace(/\s+/g, "_")}.xlsx`);
}

// ---------------------------------------------------------------------------
// 4. Export Excel TVA
// ---------------------------------------------------------------------------

export function exportTvaExcel(
  companyName: string,
  periode: string,
  tva: TvaCalculationResult
) {
  const data = [
    { "Élément Déclaratif TVA (OTR)": "Chiffre d'affaires taxable à 18%", "Montant (FCFA)": Math.round(tva.tvaCollectee / 0.18) },
    { "Élément Déclaratif TVA (OTR)": "TVA Brute Collectée (18%)", "Montant (FCFA)": tva.tvaCollectee },
    { "Élément Déclaratif TVA (OTR)": "TVA Déductible sur immobilisations", "Montant (FCFA)": tva.tvaDeductibleImmo },
    { "Élément Déclaratif TVA (OTR)": "TVA Déductible sur biens et services", "Montant (FCFA)": tva.tvaDeductibleBiensServices },
    { "Élément Déclaratif TVA (OTR)": "Total TVA Déductible Brute", "Montant (FCFA)": tva.tvaDeductibleTotale },
    { "Élément Déclaratif TVA (OTR)": "Prorata de déduction applicable (%)", "Montant (FCFA)": tva.prorataApplique },
    { "Élément Déclaratif TVA (OTR)": "TVA Déductible après Prorata", "Montant (FCFA)": tva.tvaDeductibleApresProrata },
    { "Élément Déclaratif TVA (OTR)": "Crédit de TVA reporté du mois précédent", "Montant (FCFA)": tva.creditReportePrecedent },
    { "Élément Déclaratif TVA (OTR)": "Total Déductions et Crédits", "Montant (FCFA)": tva.tvaDeductibleApresProrata + tva.creditReportePrecedent },
    { "Élément Déclaratif TVA (OTR)": "TVA Nette Due (à verser à l'OTR)", "Montant (FCFA)": tva.tvaNetteDue },
    { "Élément Déclaratif TVA (OTR)": "Crédit de TVA à reporter", "Montant (FCFA)": tva.creditReportable },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Déclaration TVA");
  XLSX.writeFile(workbook, `Declaration_TVA_${periode}_${companyName.replace(/\s+/g, "_")}.xlsx`);
}

// ---------------------------------------------------------------------------
// 5. Export Excel Paie & IRPP / CNSS
// ---------------------------------------------------------------------------

export function exportPayrollExcel(
  companyName: string,
  periode: string,
  employees: { nom: string; poste: string; payroll: PayrollCalculationResult }[]
) {
  const data = employees.map((e) => ({
    "Nom de l'Employé": e.nom,
    "Poste Occupé": e.poste,
    "Salaire Brut (FCFA)": e.payroll.salaireBrut,
    "CNSS Salariale (4%)": e.payroll.cnssSalariale,
    "AMU Salariale (1%)": e.payroll.amuSalariale,
    "Total Retenus Salariales (5%)": e.payroll.totalRetenueSalariale,
    "CNSS Patronale (15%)": e.payroll.cnssPatronale,
    "AMU Patronale (2.5%)": e.payroll.amuPatronale,
    "Total Charges Patronales (17.5%)": e.payroll.totalChargePatronale,
    "Coût Total Employeur": e.payroll.coutTotalEmployeur,
    "Base Imposable IRPP": e.payroll.baseImposableIrpp,
    "IRPP Retenu": e.payroll.irppNet,
    "Net à Payer au Salarié (FCFA)": e.payroll.netAPayer,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Livre de Paie");
  XLSX.writeFile(workbook, `Livre_de_Paie_${periode}_${companyName.replace(/\s+/g, "_")}.xlsx`);
}

// ---------------------------------------------------------------------------
// 6. Export Excel IS / MFP
// ---------------------------------------------------------------------------

export function exportIsExcel(
  companyName: string,
  exercice: string,
  isResult: IsCalculationResult
) {
  const soldeDeclaration =
    isResult.impotExigible -
    (isResult.acompte1 + isResult.acompte2 + isResult.acompte3 + isResult.acompte4);

  const data = [
    { "Rubrique IS / MFP (CGI Togo)": "Chiffre d'Affaires Annuel HT", "Montant (FCFA)": isResult.chiffreAffairesHt },
    { "Rubrique IS / MFP (CGI Togo)": "Résultat Comptable Brut", "Montant (FCFA)": isResult.resultatComptable },
    { "Rubrique IS / MFP (CGI Togo)": "Réintégrations Fiscales", "Montant (FCFA)": isResult.reintegrations },
    { "Rubrique IS / MFP (CGI Togo)": "Déductions Fiscales", "Montant (FCFA)": isResult.deductions },
    { "Rubrique IS / MFP (CGI Togo)": "Résultat Fiscal Imposable", "Montant (FCFA)": isResult.resultatFiscal },
    { "Rubrique IS / MFP (CGI Togo)": "IS Théorique (27%) [Art. 113 CGI]", "Montant (FCFA)": isResult.isTheorique },
    { "Rubrique IS / MFP (CGI Togo)": "MFP Théorique (1% du CA, plancher 20 000 FCFA) [Art. 120 CGI]", "Montant (FCFA)": isResult.mfpTheorique },
    { "Rubrique IS / MFP (CGI Togo)": `Impôt Exigible Retenu [${isResult.impotRetenu}]`, "Montant (FCFA)": isResult.impotExigible },
    { "Rubrique IS / MFP (CGI Togo)": "1er Acompte (31 Janvier - 25%) [Art. 114 CGI]", "Montant (FCFA)": isResult.acompte1 },
    { "Rubrique IS / MFP (CGI Togo)": "2ème Acompte (31 Mai - 25%)", "Montant (FCFA)": isResult.acompte2 },
    { "Rubrique IS / MFP (CGI Togo)": "3ème Acompte (31 Juillet - 25%)", "Montant (FCFA)": isResult.acompte3 },
    { "Rubrique IS / MFP (CGI Togo)": "4ème Acompte (31 Octobre - 25%)", "Montant (FCFA)": isResult.acompte4 },
    { "Rubrique IS / MFP (CGI Togo)": "Solde à la déclaration de résultat", "Montant (FCFA)": soldeDeclaration },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Bordereau IS");
  XLSX.writeFile(workbook, `Bordereau_IS_MFP_${exercice}_${companyName.replace(/\s+/g, "_")}.xlsx`);
}
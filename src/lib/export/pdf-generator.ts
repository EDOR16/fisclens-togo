import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatAmount, formatDate } from "@/lib/utils";
import type { TvaCalculationResult, PayrollCalculationResult, IsCalculationResult } from "@/lib/fiscal/togo-rules";

// Helper pour ajouter l'en-tête officiel Togo / FiscLens
function addOfficialHeader(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("RÉPUBLIQUE TOGOLAISE", 14, 15);
  doc.text("Office Togolais des Recettes (OTR)", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(22, 163, 74); // brand green
  doc.text("FiscLens Togo — Gestion Fiscale & Comptable", 196, 15, { align: "right" });
  doc.setTextColor(100, 100, 100);
  doc.text(`Édité le : ${formatDate(new Date())}`, 196, 20, { align: "right" });

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, 24, 196, 24);

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 33);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 38);
  }
}

// ---------------------------------------------------------------------------
// 1. Export Balance Générale
// ---------------------------------------------------------------------------

export type BalanceRowExport = {
  code: string;
  libelle: string;
  debitMvt: number;
  creditMvt: number;
  soldeDbt: number;
  soldeCdt: number;
};

export function exportBalancePdf(
  companyName: string,
  periode: string,
  rows: BalanceRowExport[]
) {
  const doc = new jsPDF();
  addOfficialHeader(
    doc,
    "BALANCE GÉNÉRALE DES COMPTES (SYSCOHADA)",
    `Entreprise : ${companyName} | Période : ${periode}`
  );

  const totalDebitMvt = rows.reduce((s, r) => s + r.debitMvt, 0);
  const totalCreditMvt = rows.reduce((s, r) => s + r.creditMvt, 0);
  const totalSoldeDbt = rows.reduce((s, r) => s + r.soldeDbt, 0);
  const totalSoldeCdt = rows.reduce((s, r) => s + r.soldeCdt, 0);

  const tableBody = rows.map((r) => [
    r.code,
    r.libelle,
    r.debitMvt > 0 ? formatAmount(r.debitMvt) : "—",
    r.creditMvt > 0 ? formatAmount(r.creditMvt) : "—",
    r.soldeDbt > 0 ? formatAmount(r.soldeDbt) : "—",
    r.soldeCdt > 0 ? formatAmount(r.soldeCdt) : "—",
  ]);

  autoTable(doc, {
    startY: 44,
    head: [
      [
        { content: "Compte", styles: { halign: "left" } },
        { content: "Intitulé du compte", styles: { halign: "left" } },
        { content: "Mvt Débit (FCFA)", styles: { halign: "right" } },
        { content: "Mvt Crédit (FCFA)", styles: { halign: "right" } },
        { content: "Solde Débiteur", styles: { halign: "right" } },
        { content: "Solde Créditeur", styles: { halign: "right" } },
      ],
    ],
    body: tableBody,
    foot: [
      [
        "TOTAL",
        "TOTAUX GÉNÉRAUX",
        formatAmount(totalDebitMvt),
        formatAmount(totalCreditMvt),
        formatAmount(totalSoldeDbt),
        formatAmount(totalSoldeCdt),
      ],
    ],
    headStyles: { fillColor: [22, 163, 74], textColor: 255 },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 22 },
      1: { cellWidth: 58 },
      2: { halign: "right", cellWidth: 26 },
      3: { halign: "right", cellWidth: 26 },
      4: { halign: "right", cellWidth: 25 },
      5: { halign: "right", cellWidth: 25 },
    },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  doc.save(`Balance_Generale_${companyName.replace(/\s+/g, "_")}_${periode}.pdf`);
}

// ---------------------------------------------------------------------------
// 2. Export Grand Livre
// ---------------------------------------------------------------------------

export type GrandLivreRowExport = {
  date: string;
  piece: string;
  journal: string;
  libelle: string;
  debit: number;
  credit: number;
  balance: number;
};

export function exportGrandLivrePdf(
  companyName: string,
  accountCode: string,
  accountName: string,
  rows: GrandLivreRowExport[]
) {
  const doc = new jsPDF();
  addOfficialHeader(
    doc,
    `GRAND LIVRE — COMPTE ${accountCode}`,
    `Entreprise : ${companyName} | Intitulé : ${accountName}`
  );

  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const finalBalance = totalDebit - totalCredit;

  const tableBody = rows.map((r) => [
    formatDate(r.date),
    r.piece,
    r.journal,
    r.libelle,
    r.debit > 0 ? formatAmount(r.debit) : "—",
    r.credit > 0 ? formatAmount(r.credit) : "—",
    `${formatAmount(Math.abs(r.balance))} ${r.balance >= 0 ? "D" : "C"}`,
  ]);

  autoTable(doc, {
    startY: 44,
    head: [
      [
        "Date",
        "Pièce",
        "Journal",
        "Libellé",
        { content: "Débit (FCFA)", styles: { halign: "right" } },
        { content: "Crédit (FCFA)", styles: { halign: "right" } },
        { content: "Solde Prog.", styles: { halign: "right" } },
      ],
    ],
    body: tableBody,
    foot: [
      [
        "TOTAL",
        "",
        "",
        "TOTAUX DU COMPTE",
        formatAmount(totalDebit),
        formatAmount(totalCredit),
        `${formatAmount(Math.abs(finalBalance))} ${finalBalance >= 0 ? "D" : "C"}`,
      ],
    ],
    headStyles: { fillColor: [22, 163, 74], textColor: 255 },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 22 },
      2: { cellWidth: 18 },
      3: { cellWidth: 56 },
      4: { halign: "right", cellWidth: 22 },
      5: { halign: "right", cellWidth: 22 },
      6: { halign: "right", cellWidth: 22 },
    },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  doc.save(`Grand_Livre_${accountCode}_${companyName.replace(/\s+/g, "_")}.pdf`);
}

// ---------------------------------------------------------------------------
// 3. Export Déclaration TVA (Formulaire OTR CA3)
// ---------------------------------------------------------------------------

export function exportTvaDeclarationPdf(
  companyName: string,
  nif: string,
  periode: string,
  tva: TvaCalculationResult
) {
  const doc = new jsPDF();
  addOfficialHeader(
    doc,
    "DÉCLARATION MENSUELLE DE TVA (FORMULAIRE CA3 - OTR)",
    `Entreprise : ${companyName} | NIF : ${nif || "En cours"} | Période : ${periode}`
  );

  const tvaRows = [
    ["1", "Chiffre d'affaires taxable à 18%", formatAmount(Math.round(tva.tvaCollectee / 0.18)) + " FCFA"],
    ["2", "TVA BRUTE COLLECTÉE (18%)", formatAmount(tva.tvaCollectee) + " FCFA"],
    ["3", "TVA déductible sur immobilisations", formatAmount(tva.tvaDeductibleImmo) + " FCFA"],
    ["4", "TVA déductible sur biens et services", formatAmount(tva.tvaDeductibleBiensServices) + " FCFA"],
    ["5", "TOTAL TVA DÉDUCTIBLE BRUTE", formatAmount(tva.tvaDeductibleTotale) + " FCFA"],
    ["6", "Prorata de déduction applicable", `${tva.prorataApplique} %`],
    ["7", "TVA Déductible admise après prorata", formatAmount(tva.tvaDeductibleApresProrata) + " FCFA"],
    ["8", "Crédit de TVA reporté du mois précédent", formatAmount(tva.creditReportePrecedent) + " FCFA"],
    ["9", "TOTAL DÉDUCTIONS & CRÉDITS (Ligne 7 + 8)", formatAmount(tva.tvaDeductibleApresProrata + tva.creditReportePrecedent) + " FCFA"],
    ["10", "TVA NETTE DUE À REVERSER À L'OTR", formatAmount(tva.tvaNetteDue) + " FCFA"],
    ["11", "CRÉDIT DE TVA À REPORTER SUR LE MOIS SUIVANT", formatAmount(tva.creditReportable) + " FCFA"],
  ];

  autoTable(doc, {
    startY: 44,
    head: [["Réf", "Éléments déclaratifs (CGI Togo)", "Montant FCFA"]],
    body: tvaRows,
    headStyles: { fillColor: [22, 163, 74], textColor: 255 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 15 },
      1: { cellWidth: 120 },
      2: { halign: "right", fontStyle: "bold", cellWidth: 47 },
    },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  doc.save(`Declaration_TVA_${periode}_${companyName.replace(/\s+/g, "_")}.pdf`);
}

// ---------------------------------------------------------------------------
// 4. Export Paie & IRPP / CNSS
// ---------------------------------------------------------------------------

export function exportPayrollPdf(
  companyName: string,
  periode: string,
  employees: { nom: string; poste: string; payroll: PayrollCalculationResult }[]
) {
  const doc = new jsPDF("landscape");
  addOfficialHeader(
    doc,
    "LIVRE DE PAIE MENSUEL & ÉTAT CNSS / IRPP (TOGO)",
    `Entreprise : ${companyName} | Période : ${periode} | Réf : CGI Art. 26 & 74`
  );

  const totalBrut = employees.reduce((s, e) => s + e.payroll.salaireBrut, 0);
  const totalCnssSal = employees.reduce((s, e) => s + e.payroll.cnssSalariale, 0);
  const totalAmuSal = employees.reduce((s, e) => s + e.payroll.amuSalariale, 0);
  const totalCnssPat = employees.reduce((s, e) => s + e.payroll.cnssPatronale, 0);
  const totalAmuPat = employees.reduce((s, e) => s + e.payroll.amuPatronale, 0);
  const totalIrpp = employees.reduce((s, e) => s + e.payroll.irppNet, 0);
  const totalNet = employees.reduce((s, e) => s + e.payroll.netAPayer, 0);

  const tableBody = employees.map((e) => [
    e.nom,
    e.poste,
    formatAmount(e.payroll.salaireBrut),
    formatAmount(e.payroll.cnssSalariale),
    formatAmount(e.payroll.amuSalariale),
    formatAmount(e.payroll.cnssPatronale),
    formatAmount(e.payroll.amuPatronale),
    formatAmount(e.payroll.baseImposableIrpp),
    formatAmount(e.payroll.irppNet),
    formatAmount(e.payroll.netAPayer),
  ]);

  autoTable(doc, {
    startY: 44,
    head: [
      [
        "Employé",
        "Poste",
        { content: "Brut", styles: { halign: "right" } },
        { content: "CNSS Sal. (4%)", styles: { halign: "right" } },
        { content: "AMU Sal. (5%)", styles: { halign: "right" } },
        { content: "CNSS Pat. (15%)", styles: { halign: "right" } },
        { content: "AMU Pat. (5%)", styles: { halign: "right" } },
        { content: "Base IRPP", styles: { halign: "right" } },
        { content: "IRPP", styles: { halign: "right" } },
        { content: "Net", styles: { halign: "right" } },
      ],
    ],
    body: tableBody,
    foot: [
      [
        "TOTAL",
        `${employees.length} salarié(s)`,
        formatAmount(totalBrut),
        formatAmount(totalCnssSal),
        formatAmount(totalAmuSal),
        formatAmount(totalCnssPat),
        formatAmount(totalAmuPat),
        "—",
        formatAmount(totalIrpp),
        formatAmount(totalNet),
      ],
    ],
    headStyles: { fillColor: [22, 163, 74], textColor: 255 },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  doc.save(`Livre_de_Paie_${periode}_${companyName.replace(/\s+/g, "_")}.pdf`);
}

// ---------------------------------------------------------------------------
// 5. Export IS / MFP
// ---------------------------------------------------------------------------

export function exportIsDeclarationPdf(
  companyName: string,
  exercice: string,
  isResult: IsCalculationResult
) {
  const doc = new jsPDF();
  addOfficialHeader(
    doc,
    "BORDEREAU D'IMPÔT SUR LES SOCIÉTÉS (IS 27% & MFP 1%)",
    `Entreprise : ${companyName} | Exercice fiscal : ${exercice} | CGI Togo`
  );

  const soldeDeclaration =
    isResult.impotExigible -
    (isResult.acompte1 + isResult.acompte2 + isResult.acompte3 + isResult.acompte4);

  const isRows = [
    ["1", "Chiffre d'Affaires Annuel HT", formatAmount(isResult.chiffreAffairesHt) + " FCFA"],
    ["2", "Résultat Comptable Brut (Produits - Charges)", formatAmount(isResult.resultatComptable) + " FCFA"],
    ["3", "Réintégrations fiscales (Charges non déductibles)", formatAmount(isResult.reintegrations) + " FCFA"],
    ["4", "Déductions fiscales (Produits exonérés)", formatAmount(isResult.deductions) + " FCFA"],
    ["5", "RÉSULTAT FISCAL IMPOSABLE", formatAmount(isResult.resultatFiscal) + " FCFA"],
    ["6", "IS Théorique au taux normal (27%) [Art. 113 CGI]", formatAmount(isResult.isTheorique) + " FCFA"],
    ["7", "MFP Théorique (1% du CA, plancher 20 000 FCFA) [Art. 120 CGI]", formatAmount(isResult.mfpTheorique) + " FCFA"],
    ["8", `IMPÔT EXIGIBLE RETENU : MAX(IS, MFP) [${isResult.impotRetenu}]`, formatAmount(isResult.impotExigible) + " FCFA"],
    ["9", "1er Acompte provisionnel (Échéance 31 Janvier - 25%) [Art. 114 CGI]", formatAmount(isResult.acompte1) + " FCFA"],
    ["10", "2ème Acompte provisionnel (Échéance 31 Mai - 25%)", formatAmount(isResult.acompte2) + " FCFA"],
    ["11", "3ème Acompte provisionnel (Échéance 31 Juillet - 25%)", formatAmount(isResult.acompte3) + " FCFA"],
    ["12", "4ème Acompte provisionnel (Échéance 31 Octobre - 25%)", formatAmount(isResult.acompte4) + " FCFA"],
    ["13", "Solde à la déclaration de résultat", formatAmount(soldeDeclaration) + " FCFA"],
  ];

  autoTable(doc, {
    startY: 44,
    head: [["Réf", "Élément de liquidation IS / MFP", "Montant FCFA"]],
    body: isRows,
    headStyles: { fillColor: [22, 163, 74], textColor: 255 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 15 },
      1: { cellWidth: 120 },
      2: { halign: "right", fontStyle: "bold", cellWidth: 47 },
    },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  doc.save(`Bordereau_IS_MFP_${exercice}_${companyName.replace(/\s+/g, "_")}.pdf`);
}
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

const ACCOUNT_LABELS: Record<string, string> = {
  "101": "Capital social",
  "102": "Capital par dotation",
  "111": "Report à nouveau créditeur",
  "121": "Résultat de l'exercice (Bénéfice)",
  "129": "Résultat de l'exercice (Perte)",
  "131": "Subventions d'équipement",
  "162": "Emprunts auprès des établissements de crédit",
  "163": "Dettes de location-financement",
  "164": "Emprunts divers",
  "191": "Provisions pour risques",
  "211": "Terrains",
  "213": "Bâtiments industriels et commerciaux",
  "215": "Matériel industriel et outillage",
  "218": "Matériel de transport",
  "241": "Matériel de bureau et informatique",
  "281": "Amortissements des terrains",
  "283": "Amortissements des bâtiments",
  "285": "Amortissements matériel industriel",
  "311": "Marchandises A",
  "312": "Marchandises B",
  "321": "Matières premières",
  "401": "Fournisseurs d'exploitation",
  "4011": "Fournisseurs d'exploitation",
  "411": "Clients - Ventes de biens ou services",
  "421": "Personnel, rémunérations dues",
  "431": "Sécurité sociale (CNSS)",
  "443": "État, TVA facturée sur ventes",
  "445": "État, TVA déductible",
  "4452": "État, TVA déductible sur achats",
  "447": "État, Retenues IRPP sur salaires",
  "521": "Banque locale",
  "571": "Caisse principale",
  "601": "Achats de marchandises",
  "605": "Fournitures de bureau et consommables",
  "612": "Transports sur achats",
  "622": "Locations et charges locatives",
  "624": "Entretien et réparations",
  "628": "Frais de télécommunications",
  "631": "Services bancaires",
  "641": "Impôts et taxes d'exploitation",
  "661": "Rémunération du personnel",
  "664": "Charges sociales patronales",
  "701": "Ventes de marchandises",
  "706": "Prestations de services",
  "707": "Produits accessoires",
};

function getLabel(code: string, libelle?: string): string {
  if (ACCOUNT_LABELS[code]) return ACCOUNT_LABELS[code];
  for (let len = Math.min(code.length, 6); len >= 3; len--) {
    const prefix = code.slice(0, len);
    if (ACCOUNT_LABELS[prefix]) return ACCOUNT_LABELS[prefix];
  }
  return libelle || `Compte ${code}`;
}

type AccountEntry = {
  code: string;
  libelle: string;
  classe: number;
  debit: number;
  credit: number;
  solde: number;
};

type FinancialLine = {
  code: string;
  libelle: string;
  montantBrut: number;
  amortissement: number;
  montantNet: number;
};

type BilanSection = { titre: string; lignes: FinancialLine[]; total: number };
type CRSection = { titre: string; lignes: FinancialLine[]; total: number };

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  const ecritureLines = await prisma.ecritureLine.findMany({
    where: { ecriture: { tenantId } },
    select: { accountCode: true, libelle: true, debit: true, credit: true },
  });

  const planComptes = await prisma.comptePlan.findMany({ where: { tenantId } });
  const planMap = new Map(planComptes.map((c) => [c.code, c.libelle]));

  const accountsMap = new Map<string, AccountEntry>();

  for (const line of ecritureLines) {
    const code = line.accountCode;
    const classe = parseInt(code[0] || "0", 10);
    const existing = accountsMap.get(code);
    if (existing) {
      existing.debit += line.debit;
      existing.credit += line.credit;
      existing.solde = existing.debit - existing.credit;
    } else {
      accountsMap.set(code, {
        code,
        libelle: planMap.get(code) || getLabel(code, line.libelle),
        classe,
        debit: line.debit,
        credit: line.credit,
        solde: line.debit - line.credit,
      });
    }
  }

  const accounts = Array.from(accountsMap.values()).sort((a, b) =>
    a.code.localeCompare(b.code)
  );

  function toLine(a: AccountEntry, montant?: number): FinancialLine {
    const m = montant ?? Math.abs(a.solde);
    return { code: a.code, libelle: a.libelle, montantBrut: m, amortissement: 0, montantNet: m };
  }

  // === COMPTE DE RÉSULTAT ===
  const chExplLines = accounts
    .filter((a) => a.classe === 6 && !a.code.startsWith("66") && !a.code.startsWith("67") && !a.code.startsWith("68") && a.solde > 0)
    .map((a) => toLine(a, a.solde));
  const chFinLines = accounts
    .filter((a) => a.classe === 6 && a.code.startsWith("66") && a.solde > 0)
    .map((a) => toLine(a, a.solde));
  const chExcLines = accounts
    .filter((a) => a.classe === 6 && (a.code.startsWith("67") || a.code.startsWith("68")) && a.solde > 0)
    .map((a) => toLine(a, a.solde));

  const prExplLines = accounts
    .filter((a) => a.classe === 7 && !a.code.startsWith("76") && !a.code.startsWith("77") && !a.code.startsWith("78") && !a.code.startsWith("79") && a.solde < 0)
    .map((a) => toLine(a));
  const prFinLines = accounts
    .filter((a) => a.classe === 7 && a.code.startsWith("76") && a.solde < 0)
    .map((a) => toLine(a));
  const prExcLines = accounts
    .filter((a) => a.classe === 7 && (a.code.startsWith("77") || a.code.startsWith("78") || a.code.startsWith("79")) && a.solde < 0)
    .map((a) => toLine(a));

  const totalChExpl = chExplLines.reduce((s, l) => s + l.montantNet, 0);
  const totalChFin = chFinLines.reduce((s, l) => s + l.montantNet, 0);
  const totalChExc = chExcLines.reduce((s, l) => s + l.montantNet, 0);
  const totalCharges = totalChExpl + totalChFin + totalChExc;

  const totalPrExpl = prExplLines.reduce((s, l) => s + l.montantNet, 0);
  const totalPrFin = prFinLines.reduce((s, l) => s + l.montantNet, 0);
  const totalPrExc = prExcLines.reduce((s, l) => s + l.montantNet, 0);
  const totalProduits = totalPrExpl + totalPrFin + totalPrExc;

  const resultatNet = totalProduits - totalCharges;

  // === BILAN ===
  const immoLines: FinancialLine[] = accounts
    .filter((a) => a.classe === 2 && !a.code.startsWith("28") && a.solde > 0)
    .map((a) => {
      const amortCode = "28" + a.code.slice(2);
      const amort = accountsMap.get(amortCode);
      const amortM = amort ? Math.abs(amort.solde) : 0;
      return { code: a.code, libelle: a.libelle, montantBrut: a.solde, amortissement: amortM, montantNet: a.solde - amortM };
    });

  const stockLines = accounts.filter((a) => a.classe === 3 && a.solde > 0).map((a) => toLine(a));
  const creanceLines = accounts.filter((a) => a.classe === 4 && a.solde > 0).map((a) => toLine(a));
  const tresoActifLines = accounts.filter((a) => a.classe === 5 && a.solde > 0).map((a) => toLine(a));

  const totalActifImmo = immoLines.reduce((s, l) => s + l.montantNet, 0);
  const totalActifStocks = stockLines.reduce((s, l) => s + l.montantNet, 0);
  const totalActifCreances = creanceLines.reduce((s, l) => s + l.montantNet, 0);
  const totalTresoActif = tresoActifLines.reduce((s, l) => s + l.montantNet, 0);
  const totalActif = totalActifImmo + totalActifStocks + totalActifCreances + totalTresoActif;

  const capPropresLines = accounts.filter((a) => a.classe === 1 && a.solde < 0).map((a) => toLine(a));
  
  // Si un résultat d'exercice a été dégagé par les classes 6 et 7, l'intégrer dans les capitaux propres
  if (resultatNet !== 0) {
    capPropresLines.push({
      code: resultatNet > 0 ? "121" : "129",
      libelle: resultatNet > 0 ? "Résultat net de l'exercice (Bénéfice)" : "Résultat net de l'exercice (Perte)",
      montantBrut: Math.abs(resultatNet),
      amortissement: 0,
      montantNet: resultatNet, // positif si bénéfice, négatif si perte
    });
  }

  const dettesFiLines = accounts.filter((a) => a.classe === 1 && a.solde > 0).map((a) => toLine(a));
  const dettesLines = accounts.filter((a) => a.classe === 4 && a.solde < 0).map((a) => toLine(a));
  const tresoPassifLines = accounts.filter((a) => a.classe === 5 && a.solde < 0).map((a) => toLine(a));

  const totalCapPropres = capPropresLines.reduce((s, l) => s + l.montantNet, 0);
  const totalDettesFi = dettesFiLines.reduce((s, l) => s + l.montantNet, 0);
  const totalDettes = dettesLines.reduce((s, l) => s + l.montantNet, 0);
  const totalTresoPassif = tresoPassifLines.reduce((s, l) => s + l.montantNet, 0);
  const totalPassif = totalCapPropres + totalDettesFi + totalDettes + totalTresoPassif;

  // === TAFIRE ===
  const dotationsAmort = accounts.filter((a) => a.code.startsWith("68") && a.solde > 0).reduce((s, a) => s + a.solde, 0);
  const caf = resultatNet + dotationsAmort;
  const variationBFR = (totalActifStocks + totalActifCreances) - totalDettes;
  const fluxExpl = caf - variationBFR;
  const fluxInvest = -totalActifImmo;
  const fluxFin = totalCapPropres + totalDettesFi;
  const varTreso = fluxExpl + fluxInvest + fluxFin;

  return NextResponse.json({
    exercice: new Date().getFullYear().toString(),
    hasData: ecritureLines.length > 0,
    bilan: {
      actif: [
        { titre: "Actif immobilisé", lignes: immoLines, total: totalActifImmo } satisfies BilanSection,
        { titre: "Stocks", lignes: stockLines, total: totalActifStocks } satisfies BilanSection,
        { titre: "Créances et actif circulant", lignes: creanceLines, total: totalActifCreances } satisfies BilanSection,
        { titre: "Trésorerie – Actif", lignes: tresoActifLines, total: totalTresoActif } satisfies BilanSection,
      ],
      passif: [
        { titre: "Capitaux propres et ressources nettes", lignes: capPropresLines, total: totalCapPropres } satisfies BilanSection,
        { titre: "Dettes financières", lignes: dettesFiLines, total: totalDettesFi } satisfies BilanSection,
        { titre: "Dettes d'exploitation et fiscales (Passif circulant)", lignes: dettesLines, total: totalDettes } satisfies BilanSection,
        { titre: "Trésorerie – Passif", lignes: tresoPassifLines, total: totalTresoPassif } satisfies BilanSection,
      ],
      totalActif,
      totalPassif,
      equilibre: Math.abs(totalActif - totalPassif) < 1,
    },
    compteResultat: {
      charges: [
        { titre: "Charges d'exploitation", lignes: chExplLines, total: totalChExpl } satisfies CRSection,
        { titre: "Charges financières", lignes: chFinLines, total: totalChFin } satisfies CRSection,
        { titre: "Charges exceptionnelles / HAO", lignes: chExcLines, total: totalChExc } satisfies CRSection,
      ],
      produits: [
        { titre: "Produits d'exploitation", lignes: prExplLines, total: totalPrExpl } satisfies CRSection,
        { titre: "Produits financiers", lignes: prFinLines, total: totalPrFin } satisfies CRSection,
        { titre: "Produits exceptionnels / HAO", lignes: prExcLines, total: totalPrExc } satisfies CRSection,
      ],
      totalCharges,
      totalProduits,
      resultatNet,
    },
    tafire: {
      capaciteAutofinancement: caf,
      variationBFR,
      fluxExploitation: fluxExpl,
      fluxInvestissement: fluxInvest,
      fluxFinancement: fluxFin,
      variationTresorerie: varTreso,
      tresorerieOuverture: 0,
      tresorerieCloture: varTreso,
    },
  });
});

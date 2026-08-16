import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

// Labels SYSCOHADA par défaut
const DEFAULT_ACCOUNT_LABELS: Record<string, string> = {
  "101000": "Capital social",
  "102000": "Capital par dotation",
  "111000": "Report à nouveau créditeur",
  "121000": "Résultat de l'exercice (Bénéfice)",
  "162000": "Emprunts auprès des établissements de crédit",
  "211000": "Terrains",
  "213000": "Bâtiments industriels et commerciaux",
  "215000": "Matériel industriel et outillage",
  "218000": "Matériel de transport",
  "241000": "Matériel de bureau et informatique",
  "311000": "Marchandises A",
  "401000": "Fournisseurs d'exploitation",
  "411000": "Clients - Ventes de biens ou services",
  "421000": "Personnel, rémunérations dues",
  "431000": "Sécurité sociale (CNSS)",
  "443100": "État, TVA facturée sur ventes (18%)",
  "445100": "État, TVA déductible sur immobilisations",
  "445200": "État, TVA déductible sur achats et services",
  "447100": "État, Retenues IRPP sur salaires",
  "521000": "Banque locale Togo (Ecobank/Orabank)",
  "571000": "Caisse principale",
  "601000": "Achats de marchandises",
  "605000": "Fournitures de bureau et consommables",
  "612000": "Transports sur achats",
  "622000": "Locations et charges locatives",
  "624000": "Entretien et réparations",
  "628000": "Frais de télécommunications et internet",
  "631000": "Services bancaires et frais",
  "641000": "Impôts et taxes d'exploitation (Patente/Taxes)",
  "661000": "Rémunération du personnel (Salaires bruts)",
  "664000": "Charges sociales patronales (CNSS 17.5%)",
  "701000": "Ventes de marchandises",
  "706000": "Prestations de services",
  "707000": "Produits accessoires",
};

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  // Récupérer toutes les lignes d'écritures du tenant
  const lines = await prisma.ecritureLine.findMany({
    where: {
      ecriture: {
        tenantId,
      },
    },
    select: {
      accountCode: true,
      libelle: true,
      debit: true,
      credit: true,
    },
  });

  // Récupérer le plan de comptes du tenant
  const planComptes = await prisma.comptePlan.findMany({
    where: { tenantId },
  });
  const planMap = new Map(planComptes.map((c) => [c.code, c.libelle]));

  // Agréger par compte
  const accountsMap = new Map<
    string,
    {
      code: string;
      libelle: string;
      classe: number;
      debitMouvements: number;
      creditMouvements: number;
    }
  >();

  for (const line of lines) {
    const code = line.accountCode;
    const classe = parseInt(code[0] || "0", 10);
    const existing = accountsMap.get(code);

    if (existing) {
      existing.debitMouvements += line.debit;
      existing.creditMouvements += line.credit;
    } else {
      const libelle =
        planMap.get(code) || DEFAULT_ACCOUNT_LABELS[code] || line.libelle || `Compte ${code}`;
      accountsMap.set(code, {
        code,
        libelle,
        classe,
        debitMouvements: line.debit,
        creditMouvements: line.credit,
      });
    }
  }

  // Calculer les soldes débiteurs et créditeurs
  const balanceLines = Array.from(accountsMap.values())
    .map((acc) => {
      const solde = acc.debitMouvements - acc.creditMouvements;
      return {
        code: acc.code,
        libelle: acc.libelle,
        classe: acc.classe,
        debitMouvements: acc.debitMouvements,
        creditMouvements: acc.creditMouvements,
        soldeDebiteur: solde > 0 ? solde : 0,
        soldeCrediteur: solde < 0 ? Math.abs(solde) : 0,
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));

  // Totaux généraux
  const totalDebitMouvements = balanceLines.reduce((s, l) => s + l.debitMouvements, 0);
  const totalCreditMouvements = balanceLines.reduce((s, l) => s + l.creditMouvements, 0);
  const totalSoldeDebiteur = balanceLines.reduce((s, l) => s + l.soldeDebiteur, 0);
  const totalSoldeCrediteur = balanceLines.reduce((s, l) => s + l.soldeCrediteur, 0);

  const isBalanced =
    totalDebitMouvements === totalCreditMouvements &&
    totalSoldeDebiteur === totalSoldeCrediteur;

  return NextResponse.json({
    lines: balanceLines,
    totals: {
      debitMouvements: totalDebitMouvements,
      creditMouvements: totalCreditMouvements,
      soldeDebiteur: totalSoldeDebiteur,
      soldeCrediteur: totalSoldeCrediteur,
    },
    isBalanced,
  });
});

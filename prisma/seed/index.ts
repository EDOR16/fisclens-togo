import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

if (process.env.APP_ENV === "production" || process.env.ALLOW_FAKE_SEED !== "true") {
  console.error("❌ Seed de données fictives bloqué (environnement réel).");
  process.exit(1);
}

const prisma = new PrismaClient();

function getRelativeDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0]!;
}

export async function seedDatabase() {
  console.log("🌱 Début du seed FiscLens Togo avec intégrité SYSCOHADA...");

  // 1. Création ou mise à jour du Tenant Démo
  const tenant = await prisma.tenant.upsert({
    where: { id: "tenant-demo-stcs" },
    update: {
      name: "SOCIÉTÉ TOGOLAISE DE COMMERCE & SERVICES (STCS SARL)",
      regime: "REEL_NORMAL",
      nif: "100123456789",
      exerciceOuvert: true,
    },
    create: {
      id: "tenant-demo-stcs",
      name: "SOCIÉTÉ TOGOLAISE DE COMMERCE & SERVICES (STCS SARL)",
      regime: "REEL_NORMAL",
      nif: "100123456789",
      exerciceOuvert: true,
    },
  });

  // 2. Création des Utilisateurs
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const gerantUser = await prisma.user.upsert({
    where: { email: "gerant@stcs.tg" },
    update: { passwordHash, name: "Honoré EDOR (Gérant)" },
    create: {
      email: "gerant@stcs.tg",
      name: "Honoré EDOR (Gérant)",
      passwordHash,
      require2fa: false,
    },
  });

  await prisma.userTenant.upsert({
    where: {
      userId_tenantId: {
        userId: gerantUser.id,
        tenantId: tenant.id,
      },
    },
    update: { role: "GERANT" },
    create: {
      userId: gerantUser.id,
      tenantId: tenant.id,
      role: "GERANT",
    },
  });

  // 3. Plan de comptes SYSCOHADA
  const comptesSYSCOHADA = [
    { code: "101000", libelle: "Capital social", classe: 1 },
    { code: "162000", libelle: "Emprunts bancaires", classe: 1 },
    { code: "218000", libelle: "Matériel de transport", classe: 2 },
    { code: "241000", libelle: "Matériel informatique et bureau", classe: 2 },
    { code: "311000", libelle: "Stocks de marchandises", classe: 3 },
    { code: "401100", libelle: "Fournisseurs d'exploitation locaux", classe: 4 },
    { code: "411100", libelle: "Clients - Ventes de marchandises", classe: 4 },
    { code: "421100", libelle: "Personnel, rémunérations nettes dues", classe: 4 },
    { code: "431100", libelle: "Sécurité sociale (CNSS & AMU Togo)", classe: 4 },
    { code: "443100", libelle: "État, TVA facturée sur ventes (18%)", classe: 4 },
    { code: "445200", libelle: "État, TVA déductible sur achats (18%)", classe: 4 },
    { code: "447100", libelle: "État, Retenues IRPP sur salaires", classe: 4 },
    { code: "521100", libelle: "Banque Ecobank Togo", classe: 5 },
    { code: "571100", libelle: "Caisse principale Lomé", classe: 5 },
    { code: "601100", libelle: "Achats de marchandises", classe: 6 },
    { code: "605100", libelle: "Fournitures de bureau", classe: 6 },
    { code: "622100", libelle: "Loyers commerciaux et charges", classe: 6 },
    { code: "628100", libelle: "Frais Télécom & Internet (TogoCom/Moov)", classe: 6 },
    { code: "661100", libelle: "Rémunération du personnel (Salaires bruts)", classe: 6 },
    { code: "664100", libelle: "Charges patronales (CNSS 17.5% + AMU)", classe: 6 },
    { code: "701100", libelle: "Ventes de marchandises au Togo", classe: 7 },
    { code: "706100", libelle: "Prestations de services", classe: 7 },
  ];

  for (const c of comptesSYSCOHADA) {
    await prisma.comptePlan.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: c.code,
        },
      },
      update: { libelle: c.libelle, classe: c.classe },
      create: {
        tenantId: tenant.id,
        code: c.code,
        libelle: c.libelle,
        classe: c.classe,
      },
    });
  }

  // 4. Nettoyage des anciennes écritures pour assurer la cohérence
  await prisma.ecritureLine.deleteMany({
    where: { ecriture: { tenantId: tenant.id } },
  });
  await prisma.ecriture.deleteMany({
    where: { tenantId: tenant.id },
  });

  // 5. Jeu d'écritures 100% équilibrées à dates relatives
  const demoEcritures = [
    // Écriture 1 (J-25) : Vente de marchandises avec TVA 18% (10 000 000 HT + 1 800 000 TVA)
    {
      journal: "VENTES",
      date: getRelativeDate(25),
      piece: "FAC-2025-001",
      libelle: "Facture client TOGO DISTRIBUTION",
      lines: [
        { accountCode: "411100", libelle: "Client TOGO DISTRIBUTION", debit: 11_800_000, credit: 0 },
        { accountCode: "701100", libelle: "Ventes marchandises HT", debit: 0, credit: 10_000_000 },
        { accountCode: "443100", libelle: "TVA facturée 18%", debit: 0, credit: 1_800_000 },
      ],
    },

    // Écriture 2 (J-22) : Achat de marchandises avec TVA 18% (6 000 000 HT + 1 080 000 TVA)
    {
      journal: "ACHATS",
      date: getRelativeDate(22),
      piece: "FAC-FOUR-089",
      libelle: "Facture fournisseur LOMÉ IMPORT",
      lines: [
        { accountCode: "601100", libelle: "Achats marchandises HT", debit: 6_000_000, credit: 0 },
        { accountCode: "445200", libelle: "TVA déductible 18%", debit: 1_080_000, credit: 0 },
        { accountCode: "401100", libelle: "Fournisseur LOMÉ IMPORT", debit: 0, credit: 7_080_000 },
      ],
    },

    // Écriture 3 (J-18) : Règlement partiel client par Banque (8 000 000 FCFA)
    {
      journal: "BANQUE",
      date: getRelativeDate(18),
      piece: "VIR-CLT-001",
      libelle: "Virement client TOGO DISTRIBUTION",
      lines: [
        { accountCode: "521100", libelle: "Banque Ecobank Togo", debit: 8_000_000, credit: 0 },
        { accountCode: "411100", libelle: "Client TOGO DISTRIBUTION", debit: 0, credit: 8_000_000 },
      ],
    },

    // Écriture 4 (J-15) : Règlement fournisseur par Banque (5 000 000 FCFA)
    {
      journal: "BANQUE",
      date: getRelativeDate(15),
      piece: "CHQ-FOUR-002",
      libelle: "Chèque fournisseur LOMÉ IMPORT",
      lines: [
        { accountCode: "401100", libelle: "Fournisseur LOMÉ IMPORT", debit: 5_000_000, credit: 0 },
        { accountCode: "521100", libelle: "Banque Ecobank Togo", debit: 0, credit: 5_000_000 },
      ],
    },

    // Écriture 5 (J-10) : Frais généraux & Internet TogoCom (500 000 HT + 90 000 TVA)
    {
      journal: "ACHATS",
      date: getRelativeDate(10),
      piece: "FAC-TGCOM-04",
      libelle: "Abonnement Fibre TogoCom Pro",
      lines: [
        { accountCode: "628100", libelle: "Frais Télécom & Internet", debit: 500_000, credit: 0 },
        { accountCode: "445200", libelle: "TVA déductible 18%", debit: 90_000, credit: 0 },
        { accountCode: "401100", libelle: "Fournisseur TogoCom", debit: 0, credit: 590_000 },
      ],
    },

    // Écriture 6 (J-5) : Deuxième Vente de services (5 000 000 HT + 900 000 TVA)
    {
      journal: "VENTES",
      date: getRelativeDate(5),
      piece: "FAC-2025-002",
      libelle: "Prestation conseil SOCIÉTÉ MINES TOGO",
      lines: [
        { accountCode: "411100", libelle: "Client SOCIÉTÉ MINES TOGO", debit: 5_900_000, credit: 0 },
        { accountCode: "706100", libelle: "Prestations de services HT", debit: 0, credit: 5_000_000 },
        { accountCode: "443100", libelle: "TVA facturée 18%", debit: 0, credit: 900_000 },
      ],
    },

    // Écriture 7 (J-2) : Paie & Cotisations Sociales CNSS / AMU Togo
    // Salaires bruts: 3 000 000 FCFA
    // Charges patronales CNSS+AMU (20%): 600 000 FCFA
    // Retenue CNSS ouvrière (4%): 120 000 FCFA
    // Retenue IRPP OTR: 280 000 FCFA
    // Net à payer au personnel: 2 600 000 FCFA
    // Total Débit: 3 000 000 (661) + 600 000 (664) = 3 600 000
    // Total Crédit: 2 600 000 (421) + 720 000 (431) + 280 000 (447) = 3 600 000 -> PARFAITEMENT ÉQUILIBRÉ
    {
      journal: "PAIE",
      date: getRelativeDate(2),
      piece: "PAIE-MOIS-ACTUEL",
      libelle: "Journal de paie du personnel",
      lines: [
        { accountCode: "661100", libelle: "Rémunération du personnel (Brut)", debit: 3_000_000, credit: 0 },
        { accountCode: "664100", libelle: "Charges patronales CNSS & AMU", debit: 600_000, credit: 0 },
        { accountCode: "421100", libelle: "Personnel, salaires nets à payer", debit: 0, credit: 2_600_000 },
        { accountCode: "431100", libelle: "Cotisations CNSS & AMU dues", debit: 0, credit: 720_000 },
        { accountCode: "447100", libelle: "Retenues IRPP salaires dues OTR", debit: 0, credit: 280_000 },
      ],
    },
  ];

  for (const e of demoEcritures) {
    const totalD = e.lines.reduce((s, l) => s + l.debit, 0);
    const totalC = e.lines.reduce((s, l) => s + l.credit, 0);

    if (totalD !== totalC) {
      throw new Error(`Erreur d'équilibre dans le seed : ${e.piece} Débit=${totalD} !== Crédit=${totalC}`);
    }

    await prisma.ecriture.create({
      data: {
        tenantId: tenant.id,
        journal: e.journal,
        date: e.date,
        piece: e.piece,
        libelle: e.libelle,
        status: "VALIDE",
        lines: {
          create: e.lines,
        },
      },
    });
  }

  console.log("✅ Seed terminé avec succès ! 7 écritures équilibrées créées.");
}

// Exécution directe si exécuté en script
if (require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

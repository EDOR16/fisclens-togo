import { prisma } from "@/lib/server/prisma";
import { generateCalendar, type Regime } from "./calendar-rules";
import { SYSCOHADA_REF, type SyscohadaReference } from "../../../prisma/seed/syscohadaRef";

export interface ProvisionInput {
  tenantName: string;
  ownerUserId: string;
  regime: Regime;
  nif?: string;
  role?: string;
  ip?: string;
  userAgent?: string;
}

// Nomenclature officielle SYSCOHADA Révisé (Classes 1 à 8)
export const SYSCOHADA_OFFICIAL_ACCOUNTS = [
  // CLASSE 1 : COMPTES DE RESSOURCES DURABLES
  { code: "101000", libelle: "Capital social", classe: 1 },
  { code: "102000", libelle: "Capital par dotation", classe: 1 },
  { code: "111000", libelle: "Report à nouveau créditeur", classe: 1 },
  { code: "119000", libelle: "Report à nouveau débiteur", classe: 1 },
  { code: "121000", libelle: "Résultat de l'exercice (Bénéfice)", classe: 1 },
  { code: "129000", libelle: "Résultat de l'exercice (Perte)", classe: 1 },
  { code: "162000", libelle: "Emprunts auprès des établissements de crédit", classe: 1 },
  { code: "164000", libelle: "Avances reçues de l'État", classe: 1 },

  // CLASSE 2 : COMPTES D'ACTIF IMMOBILISÉ
  { code: "211000", libelle: "Terrains nus", classe: 2 },
  { code: "213000", libelle: "Bâtiments industriels et commerciaux", classe: 2 },
  { code: "215000", libelle: "Matériel industriel et outillage", classe: 2 },
  { code: "218000", libelle: "Matériel de transport", classe: 2 },
  { code: "241000", libelle: "Matériel de bureau et informatique", classe: 2 },
  { code: "281300", libelle: "Amortissements des bâtiments", classe: 2 },
  { code: "281800", libelle: "Amortissements du matériel de transport", classe: 2 },
  { code: "284100", libelle: "Amortissements du matériel informatique", classe: 2 },

  // CLASSE 3 : COMPTES DE STOCKS
  { code: "311000", libelle: "Marchandises A (Stocks)", classe: 3 },
  { code: "321000", libelle: "Matières premières et fournitures", classe: 3 },
  { code: "391000", libelle: "Dépréciations des stocks de marchandises", classe: 3 },

  // CLASSE 4 : COMPTES DE TIERS
  { code: "401100", libelle: "Fournisseurs d'exploitation locaux", classe: 4 },
  { code: "408100", libelle: "Fournisseurs - Factures non parvenues", classe: 4 },
  { code: "411100", libelle: "Clients - Ventes de biens ou prestations", classe: 4 },
  { code: "416000", libelle: "Créances clients douteuses ou litigieuses", classe: 4 },
  { code: "418100", libelle: "Clients - Factures à établir", classe: 4 },
  { code: "421100", libelle: "Personnel, rémunérations nettes dues", classe: 4 },
  { code: "422000", libelle: "Personnel, avances et acomptes", classe: 4 },
  { code: "431100", libelle: "Sécurité sociale (CNSS & AMU Togo)", classe: 4 },
  { code: "443100", libelle: "État, TVA facturée sur ventes (18%)", classe: 4 },
  { code: "443200", libelle: "État, TVA facturée sur prestations de services (18%)", classe: 4 },
  { code: "445100", libelle: "État, TVA déductible sur immobilisations (18%)", classe: 4 },
  { code: "445200", libelle: "État, TVA déductible sur achats et services (18%)", classe: 4 },
  { code: "445400", libelle: "État, Crédit de TVA à reporter", classe: 4 },
  { code: "447100", libelle: "État, Retenues IRPP sur salaires", classe: 4 },
  { code: "447200", libelle: "État, Prélèvements forfaitaires libératoires", classe: 4 },
  { code: "447800", libelle: "État, Autres impôts et taxes retenus à la source", classe: 4 },
  { code: "491000", libelle: "Dépréciations des comptes clients (Provisions)", classe: 4 },

  // CLASSE 5 : COMPTES DE TRÉSORERIE
  { code: "521100", libelle: "Banque locale Togo (Ecobank/Orabank/BTCI)", classe: 5 },
  { code: "531100", libelle: "Chèques postaux et trésor", classe: 5 },
  { code: "571100", libelle: "Caisse principale Lomé", classe: 5 },
  { code: "585000", libelle: "Virements de fonds internes", classe: 5 },

  // CLASSE 6 : COMPTES DE CHARGES
  { code: "601100", libelle: "Achats de marchandises", classe: 6 },
  { code: "602100", libelle: "Achats de matières premières", classe: 6 },
  { code: "604100", libelle: "Achats de fournitures stockées", classe: 6 },
  { code: "605100", libelle: "Fournitures de bureau non stockables", classe: 6 },
  { code: "612100", libelle: "Transports sur achats", classe: 6 },
  { code: "622100", libelle: "Locations commerciales et charges locatives", classe: 6 },
  { code: "624100", libelle: "Entretien, réparations et maintenance", classe: 6 },
  { code: "628100", libelle: "Frais Télécom & Internet (TogoCom / Moov)", classe: 6 },
  { code: "631100", libelle: "Services bancaires et frais de tenue de compte", classe: 6 },
  { code: "641100", libelle: "Taxe professionnelle (Patente)", classe: 6 },
  { code: "641300", libelle: "Taxes sur les véhicules de société", classe: 6 },
  { code: "661100", libelle: "Rémunération du personnel (Salaires bruts)", classe: 6 },
  { code: "664100", libelle: "Charges patronales de sécurité sociale (CNSS 17.5% + AMU)", classe: 6 },
  { code: "681100", libelle: "Dotations aux amortissements d'exploitation", classe: 6 },
  { code: "681200", libelle: "Dotations aux dépréciations d'exploitation (Créances douteuses)", classe: 6 },

  // CLASSE 7 : COMPTES DE PRODUITS
  { code: "701100", libelle: "Ventes de marchandises au Togo", classe: 7 },
  { code: "702100", libelle: "Ventes de produits finis", classe: 7 },
  { code: "706100", libelle: "Prestations de services et travaux", classe: 7 },
  { code: "707100", libelle: "Produits accessoires et refacturations", classe: 7 },
  { code: "711100", libelle: "Variation des stocks de marchandises", classe: 7 },
  { code: "751100", libelle: "Produits financiers et intérêts reçus", classe: 7 },
  { code: "771100", libelle: "Reprises de dépréciations et provisions", classe: 7 },

  // CLASSE 8 : AUTRES CHARGES ET PRODUITS (HAO)
  { code: "811000", libelle: "Valeurs comptables des cessions d'actifs", classe: 8 },
  { code: "821000", libelle: "Produits des cessions d'éléments d'actif", classe: 8 },
  { code: "831000", libelle: "Charges hors activités ordinaires (HAO)", classe: 8 },
  { code: "841000", libelle: "Produits hors activités ordinaires (HAO)", classe: 8 },
  { code: "851000", libelle: "Dotations hors activités ordinaires", classe: 8 },
];

type SyscohadaRefClient = {
  syscohadaRef: {
    upsert(args: { where: { code: string }; update: Record<string, never>; create: SyscohadaReference }): Promise<unknown>;
    findMany(): Promise<SyscohadaReference[]>;
  };
};

/** Seed idempotent du noyau : les lignes importées depuis un texte officiel ne sont jamais écrasées. */
export async function ensureSyscohadaReferences(tx: SyscohadaRefClient) {
  for (const ref of SYSCOHADA_REF) {
    await tx.syscohadaRef.upsert({ where: { code: ref.code }, update: {}, create: ref });
  }
}

/**
 * Crée un espace de travail professionnel VIDE et 100% prêt à l'emploi.
 * Aucune donnée simulée.
 */
export async function provisionTenant(input: ProvisionInput) {
  return prisma.$transaction(
    async (tx) => {
      await ensureSyscohadaReferences(tx);

      // 1. Création du Tenant Réel
      const tenant = await tx.tenant.create({
        data: {
          name: input.tenantName,
          regime: input.regime,
          nif: input.nif || null,
          exerciceOuvert: true,
        },
      });

      // 2. Association du rôle utilisateur
      const role = input.role || "GERANT";
      await tx.userTenant.create({
        data: {
          userId: input.ownerUserId,
          tenantId: tenant.id,
          role,
        },
      });

      if (role === "CABINET" || role === "ADMIN_SYS") {
        await tx.user.update({
          where: { id: input.ownerUserId },
          data: { require2fa: true },
        });
      }

      // 3. Plan comptable
      const refs = await tx.syscohadaRef.findMany();
      await tx.comptePlan.createMany({
        data: refs.map((ref) => ({
          tenantId: tenant.id,
          code: ref.code,
          libelle: ref.libelle,
          classe: ref.classe,
          refCode: ref.code,
          postable: ref.postable,
          isRoot: !ref.postable || ref.code.length <= 2,
        })),
      });

      // 4. Calendrier fiscal
      const currentYear = new Date().getFullYear();
      await generateCalendar(tx, tenant.id, input.regime, currentYear);

      // 5. Consentements
      for (const consentType of ["CGU", "CONFIDENTIALITE"]) {
        await tx.consentRecord.create({
          data: {
            userId: input.ownerUserId,
            type: consentType,
            version: "1.0",
            ip: input.ip || null,
            userAgent: input.userAgent || null,
          },
        });
      }

      // 6. Audit log
      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: input.ownerUserId,
          action: "TENANT_PROVISIONED",
          entity: "TENANT",
          details: JSON.stringify({
            tenantName: input.tenantName,
            regime: input.regime,
            role,
            accountsCount: refs.length,
            year: currentYear,
          }),
        },
      });

      return tenant;
    },
    {
      timeout: 120000, // ✅ Augmenté à 120 secondes (2 min) pour éviter P2028
      maxWait: 60000   // ✅ Temps d'attente max pour acquérir la transaction
    }
  );
}
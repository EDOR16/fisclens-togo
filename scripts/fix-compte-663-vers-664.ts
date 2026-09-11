import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const TENANT_ID = "cmtur5wef0000o1124rs8az16"; // ESSAY1

    const ligneAReclasser = await prisma.ecritureLine.findFirst({
        where: {
            accountCode: "663100",
            debit: 700000,
            libelle: { contains: "CNSS", mode: "insensitive" },
            ecriture: { tenantId: TENANT_ID },
        },
        include: { ecriture: true },
    });

    if (!ligneAReclasser) {
        console.log("Aucune ligne correspondante trouvée — vérifier les critères de recherche.");
        return;
    }

    console.log("Ligne trouvée :", ligneAReclasser.id, ligneAReclasser.libelle, ligneAReclasser.debit);

    await prisma.comptePlan.upsert({
        where: { tenantId_code: { tenantId: TENANT_ID, code: "664100" } },
        create: {
            tenantId: TENANT_ID,
            code: "664100",
            libelle: "Charges sociales sur rémunération du personnel national",
            classe: 6,
            postable: true,
            isRoot: false,
            type: "STANDARD",
        },
        update: {},
    });

    const updated = await prisma.ecritureLine.update({
        where: { id: ligneAReclasser.id },
        data: {
            accountCode: "664100",
            libelle: "Charges sociales patronales CNSS Togo (15%) et AMU Togo (5%)",
        },
    });

    console.log("Ligne corrigée :", updated);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
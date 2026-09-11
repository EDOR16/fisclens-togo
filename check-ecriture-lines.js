const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const tenant = await prisma.tenant.findFirst({ where: { name: "ESSAY1" } });
    if (!tenant) { console.log("Tenant ESSAY1 introuvable."); return; }

    const lines = await prisma.ecritureLine.findMany({
        where: { ecriture: { tenantId: tenant.id } },
        include: { ecriture: { select: { date: true, journal: true, piece: true } } },
    });

    console.log(`Tenant: ${tenant.name} (${tenant.id}) — ${lines.length} lignes au total\n`);

    const comptes70 = lines.filter((l) => l.accountCode.startsWith("70"));
    console.log(`Lignes compte 70x : ${comptes70.length}`);
    comptes70.forEach((l) =>
        console.log(`  ${l.ecriture.date} | ${l.accountCode} | débit=${l.debit} crédit=${l.credit} | piece=${l.ecriture.piece}`)
    );

    const comptes4451 = lines.filter((l) => l.accountCode.startsWith("4451"));
    const comptes4452 = lines.filter((l) => l.accountCode.startsWith("4452"));
    console.log(`\nLignes compte 4451 (TVA immo) : ${comptes4451.length}`);
    console.log(`Lignes compte 4452 (TVA biens/services) : ${comptes4452.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
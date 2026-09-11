const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function getArg(name) {
    const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
    return arg ? arg.split("=").slice(1).join("=") : null;
}

async function main() {
    const email = getArg("email");
    const tenantName = getArg("tenant-name");

    if (!email || !tenantName) {
        console.error('Usage : node attach-user-tenant.js --email=xxx --tenant-name="NOM"');
        process.exit(1);
    }

    const user = await prisma.user.findUnique({
        where: { email },
        include: { userTenants: true },
    });

    if (!user) {
        console.error(`❌ Aucun utilisateur trouvé avec l'email "${email}".`);
        process.exit(1);
    }

    if (user.userTenants.length > 0) {
        console.error(`⚠️  Ce compte a déjà ${user.userTenants.length} adhésion(s) — aucune action pour éviter un doublon.`);
        process.exit(1);
    }

    const tenant = await prisma.tenant.create({
        data: { name: tenantName },
    });

    await prisma.userTenant.create({
        data: {
            userId: user.id,
            tenantId: tenant.id,
            role: "GERANT",
        },
    });

    console.log(`✅ Tenant "${tenantName}" (${tenant.id}) créé et rattaché à ${email} avec le rôle GERANT.`);
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
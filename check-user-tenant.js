const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const email = "essay1sarl@gmail.com";

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            userTenants: {
                include: { tenant: true },
            },
        },
    });

    if (!user) {
        console.log(`❌ Aucun utilisateur trouvé avec l'email "${email}".`);
        return;
    }

    console.log("──────────────────────────────────────────────────────────────────────");
    console.log("Utilisateur       :", user.email);
    console.log("ID                :", user.id);
    console.log("isSuperAdmin      :", user.isSuperAdmin);
    console.log("Nombre de tenants :", user.userTenants.length);
    console.log("──────────────────────────────────────────────────────────────────────");

    if (user.userTenants.length === 0) {
        console.log("⚠️  Aucune adhésion (userTenants vide) — confirme l'hypothèse TENANT_REQUIRED.");
    } else {
        user.userTenants.forEach((ut) => {
            console.log(`  - Tenant: ${ut.tenant.name} (${ut.tenantId}) | Rôle: ${ut.role}`);
        });
    }
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
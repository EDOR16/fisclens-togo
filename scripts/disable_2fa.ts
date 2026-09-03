import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function disable2FA() {
  const targetEmail = "essay1sarl@gmail.com";
  
  const user = await prisma.user.findFirst({
    where: { email: { equals: targetEmail, mode: "insensitive" } }
  });

  if (!user) {
    console.log("Utilisateur non trouvé avec l'email:", targetEmail);
    const allUsers = await prisma.user.findMany({ 
      select: { id: true, email: true, name: true, require2fa: true } 
    });
    console.log("Utilisateurs existants en base :", JSON.stringify(allUsers, null, 2));
    return;
  }

  console.log("Utilisateur trouvé :", user.id, user.email, "require2fa:", user.require2fa);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      require2fa: false,
      twoFaSecret: null,
      backupCodes: null,
    }
  });

  console.log("✅ SUCCESS: 2FA désactivée pour", updated.email, "| require2fa:", updated.require2fa);
}

disable2FA()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

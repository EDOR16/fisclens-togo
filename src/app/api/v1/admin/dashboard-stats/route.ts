export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

export const GET = withGuard(
  async (req: NextRequest, { user, isSuperAdmin }) => {
    // 1. Récupérer tous les dossiers (Tenants)
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            userTenants: true,
            ecritures: true,
          },
        },
      },
    });

    // 2. Récupérer le nombre total d'utilisateurs
    const totalUsers = await prisma.user.count();

    // 3. Récupérer le volume total d'écritures et de mouvements
    const totalEcritures = await prisma.ecriture.count();
    
    // Total mouvementé en FCFA (somme des débits)
    const allLines = await prisma.ecritureLine.aggregate({
      _sum: {
        debit: true,
      },
    });
    const totalVolumeMouvements = allLines._sum.debit || 0;

    // 4. Utilisateurs récents
    const recentUsersRaw = await prisma.user.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        isSuperAdmin: true,
        createdAt: true,
        userTenants: {
          select: {
            role: true,
            tenant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const recentUsers = recentUsersRaw.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      isSuperAdmin: u.isSuperAdmin,
      createdAt: u.createdAt.toISOString(),
      role: u.isSuperAdmin ? "ADMIN_SYS" : (u.userTenants[0]?.role || "GERANT"),
      tenantName: u.userTenants[0]?.tenant?.name || "Sans dossier",
      tenantId: u.userTenants[0]?.tenant?.id || "",
    }));

    // 5. Logs d'audit récents
    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        details: true,
        createdAt: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });


    // 6. Formatter les dossiers
    const formattedTenants = tenants.map((t) => ({
      id: t.id,
      name: t.name,
      regime: t.regime,
      nif: t.nif || "Non renseigné",
      city: t.city || "Lomé",
      formeJuridique: t.formeJuridique || "SARL",
      exerciceOuvert: t.exerciceOuvert,
      userCount: t._count.userTenants,
      ecritureCount: t._count.ecritures,
      createdAt: t.createdAt.toISOString(),
    }));

    // Clients uniquement (hors dossier admin interne)
    const clientTenants = formattedTenants.filter((t) => t.id !== "tenant-fisclens-admin");

    return NextResponse.json({
      platformStats: {
        totalTenants: clientTenants.length,
        totalUsers,
        totalEcritures,
        totalVolumeMouvements,
      },
      tenants: formattedTenants,
      recentUsers,
      recentAuditLogs,
    });
  },
  { roles: ["ADMIN_SYS"] }
);

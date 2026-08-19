export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

export const GET = withGuard(
  async (req: NextRequest, { user }) => {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        userTenants: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "USER_NOT_FOUND", message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const tenantIds = dbUser.userTenants.map((ut) => ut.tenantId);
    const tenants = dbUser.userTenants.map((ut) => ({
      id: ut.tenant.id,
      name: ut.tenant.name,
      regime: ut.tenant.regime,
      exerciceOuvert: ut.tenant.exerciceOuvert,
    }));

    const primaryMembership = dbUser.userTenants[0];
    const role = primaryMembership ? primaryMembership.role : "GERANT";

    const sessionUser = {
      userId: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role,
      tenantIds,
      tenants,
      require2fa: dbUser.require2fa,
    };

    return NextResponse.json(sessionUser);
  },
  { requireTenant: false }
);

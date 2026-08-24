// src/app/api/v1/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";

import { prisma } from "@/lib/server/prisma";

export const dynamic = 'force-dynamic'; // Empêche le build-time execution

export const GET = withGuard(async (req, ctx) => {
  // Récupérer les vrais tenants de l'utilisateur
  const userTenants = await prisma.userTenant.findMany({
    where: { userId: ctx.userId },
    include: { tenant: true },
  });

  const tenantIds = userTenants.map((ut) => ut.tenantId);
  const tenants = userTenants.map((ut) => ({
    id: ut.tenant.id,
    name: ut.tenant.name,
    regime: ut.tenant.regime,
    exerciceOuvert: ut.tenant.exerciceOuvert,
    plan: ut.tenant.plan,
  }));

  return NextResponse.json({
    userId: ctx.userId,
    email: ctx.user?.email || "system@fisclens.tg",
    name: ctx.user?.name || "Utilisateur",
    role: ctx.isSuperAdmin ? "ADMIN_SYS" : (ctx.role || "GERANT"),
    isSuperAdmin: ctx.isSuperAdmin || false,
    tenantIds: tenantIds,
    tenants: tenants,
    require2fa: false,
  });
});
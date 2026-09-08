export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

// PATCH /api/v1/admin/tenants/[id] — modifier plan, exerciceOuvert
export const PATCH = withGuard(
  async (req: NextRequest, { params }) => {
    const tenantId = params?.id;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID requis" }, { status: 400 });
    }

    const body = await req.json();
    const { plan, exerciceOuvert } = body;

    const validPlans = ["STARTER", "PRO", "PREMIUM"];

    const updateData: Record<string, unknown> = {};
    if (plan !== undefined) {
      if (!validPlans.includes(plan)) {
        return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
      }
      updateData.plan = plan;
    }
    if (exerciceOuvert !== undefined) {
      updateData.exerciceOuvert = Boolean(exerciceOuvert);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Aucune modification fournie" }, { status: 400 });
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    return NextResponse.json({ success: true, tenant: updated });
  },
  { roles: ["ADMIN_SYS"] }
);

// GET /api/v1/admin/tenants/[id] — détail d'un tenant
export const GET = withGuard(
  async (req: NextRequest, { params }) => {
    const tenantId = params?.id;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID requis" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        userTenants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, require2fa: true, createdAt: true },
            },
          },
        },
        _count: {
          select: { ecritures: true, comptes: true, auditLogs: true },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant introuvable" }, { status: 404 });
    }

    return NextResponse.json({ tenant });
  },
  { roles: ["ADMIN_SYS"] }
);

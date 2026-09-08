export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

// GET /api/v1/admin/tenants — liste complète des tenants avec détails
export const GET = withGuard(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const plan = searchParams.get("plan") || "";

    const tenants = await prisma.tenant.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { nif: { contains: search, mode: "insensitive" } },
                  { city: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          plan ? { plan: plan as "STARTER" | "PRO" | "PREMIUM" } : {},
        ],
      },
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

    const formatted = tenants.map((t) => ({
      id: t.id,
      name: t.name,
      regime: t.regime,
      nif: t.nif || "—",
      rccm: t.rccm || "—",
      cnssNumber: t.cnssNumber || "—",
      centreFiscal: t.centreFiscal || "DPME Lomé",
      formeJuridique: t.formeJuridique || "SARL",
      secteurActivite: t.secteurActivite || "—",
      phone: t.phone || "—",
      address: t.address || "—",
      city: t.city || "Lomé",
      exerciceOuvert: t.exerciceOuvert,
      plan: t.plan,
      userCount: t._count.userTenants,
      ecritureCount: t._count.ecritures,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      isAdminTenant: t.id === "tenant-fisclens-admin",
    }));

    const planStats = {
      STARTER: formatted.filter((t) => !t.isAdminTenant && t.plan === "STARTER").length,
      PRO: formatted.filter((t) => !t.isAdminTenant && t.plan === "PRO").length,
      PREMIUM: formatted.filter((t) => !t.isAdminTenant && t.plan === "PREMIUM").length,
    };

    return NextResponse.json({ tenants: formatted, planStats });
  },
  { roles: ["ADMIN_SYS"] }
);

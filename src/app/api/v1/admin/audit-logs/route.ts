export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

// GET /api/v1/admin/audit-logs — journal d'audit paginé
export const GET = withGuard(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "25"));
    const tenantId = searchParams.get("tenantId") || "";
    const action = searchParams.get("action") || "";
    const entity = searchParams.get("entity") || "";

    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (action) where.action = { contains: action, mode: "insensitive" };
    if (entity) where.entity = { contains: entity, mode: "insensitive" };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          tenant: { select: { id: true, name: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const formatted = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
      user: log.user
        ? { id: log.user.id, name: log.user.name, email: log.user.email }
        : null,
      tenant: log.tenant
        ? { id: log.tenant.id, name: log.tenant.name }
        : null,
    }));

    // Actions distinctes pour les filtres
    const distinctActions = await prisma.auditLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    });

    return NextResponse.json({
      logs: formatted,
      total,
      page,
      pages: Math.ceil(total / limit),
      distinctActions: distinctActions.map((a) => a.action),
    });
  },
  { roles: ["ADMIN_SYS"] }
);

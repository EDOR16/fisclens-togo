export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

// GET /api/v1/admin/users — liste globale des utilisateurs
export const GET = withGuard(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        authProvider: true,
        require2fa: true,
        isSuperAdmin: true,
        createdAt: true,
        userTenants: {
          select: {
            role: true,
            tenant: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      authProvider: u.authProvider,
      require2fa: u.require2fa,
      isSuperAdmin: u.isSuperAdmin,
      createdAt: u.createdAt.toISOString(),
      tenants: u.userTenants.map((ut) => ({
        id: ut.tenant.id,
        name: ut.tenant.name,
        role: ut.role,
      })),
      primaryRole: u.isSuperAdmin
        ? "ADMIN_SYS"
        : (u.userTenants[0]?.role || "GERANT"),
      primaryTenant: u.userTenants[0]?.tenant?.name || "Sans dossier",
    }));

    return NextResponse.json({ users: formatted, total: formatted.length });
  },
  { roles: ["ADMIN_SYS"] }
);

// PATCH /api/v1/admin/users — désactiver un compte (reset token, forcer logout)
export const PATCH = withGuard(
  async (req: NextRequest) => {
    const body = await req.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: "userId et action requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    if (action === "reset_password_token") {
      // Invalider le token de reset (forcer une nouvelle demande)
      await prisma.user.update({
        where: { id: userId },
        data: { resetToken: null, resetTokenExpiry: null },
      });
      return NextResponse.json({ success: true, message: "Token de reset supprimé" });
    }

    if (action === "disable_2fa") {
      await prisma.user.update({
        where: { id: userId },
        data: { require2fa: false, twoFaSecret: null, backupCodes: null },
      });
      return NextResponse.json({ success: true, message: "2FA désactivée" });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  },
  { roles: ["ADMIN_SYS"] }
);

// src/app/api/v1/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";

export const dynamic = 'force-dynamic'; // Empêche le build-time execution

export const GET = withGuard(async (req, ctx) => {
  // Retourner les infos utilisateur depuis le contexte
  return NextResponse.json({
    userId: ctx.userId,
    email: ctx.user?.email || "system@fisclens.tg",
    name: ctx.user?.name || "Utilisateur",
    role: ctx.role,
    tenantIds: [ctx.tenantId],
    tenants: [{ id: ctx.tenantId, name: "Tenant", regime: "REEL_NORMAL", exerciceOuvert: true }],
    require2fa: false,
  });
});
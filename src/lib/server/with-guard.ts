import { NextRequest, NextResponse } from "next/server";

export interface AuthenticatedContext {
  params: Record<string, string>;
  tenantId: string;
  userId: string;
  role: string;
  user: { id: string; userId: string; email: string; name?: string };
}

export type GuardContext = AuthenticatedContext;

export interface GuardOptions { roles?: string[]; requireTenant?: boolean }

type Handler = (req: NextRequest, ctx: GuardContext) => Promise<NextResponse> | NextResponse;

export function withGuard(handler: Handler, options?: GuardOptions): (req: NextRequest, context: { params: Record<string, string> }) => Promise<NextResponse> {
  return async (req: NextRequest, context: { params: Record<string, string> }) => {
    const tenantId = req.headers.get("x-tenant-id") || req.nextUrl.searchParams.get("tenantId") || "";
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }
    const userId = req.headers.get("x-user-id") || "system";
    const role = req.headers.get("x-user-role") || "GERANT";
    const email = req.headers.get("x-user-email") || "system@fisclens.tg";
    const name = req.headers.get("x-user-name") || "Utilisateur systeme";
    if (options && options.roles && options.roles.length > 0 && options.roles.indexOf(role) === -1) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const ctx: GuardContext = { params: context.params, tenantId: tenantId, userId: userId, role: role, user: { id: userId, userId: userId, email: email, name: name } };
    try {
      return await handler(req, ctx);
    } catch (err: any) {
      const msg = err && err.message ? err.message : "Internal error";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  };
}

export const withTenantGuard = withGuard;

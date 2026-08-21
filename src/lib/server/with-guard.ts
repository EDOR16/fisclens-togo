import { NextRequest, NextResponse } from "next/server";

export interface AuthenticatedContext {
  params: Record<string, string>;
  tenantId: string;
  userId: string;
  role: string;
  user: {
    id: string;
    userId: string;
    email: string;
    name?: string;
  };
}

export type GuardContext = AuthenticatedContext;

export interface GuardOptions {
  roles?: string[];
  requireTenant?: boolean;
}

type Handler = (
  req: NextRequest,
  ctx: GuardContext
) => Promise<NextResponse> | NextResponse;

export function withGuard(
  handler: Handler,
  options?: GuardOptions
): (req: NextRequest, context: { params: Record<string, string> }) => Promise<NextResponse> {
  return async (req: NextRequest, context: { params: Record<string, string> }) => {
    try {
      const tenantId =
        req.headers.get("x-tenant-id") ||
        req.nextUrl.searchParams.get("tenantId") ||
        "";

      if (!tenantId && options?.requireTenant !== false) {
        return NextResponse.json(
          { error: "TENANT_REQUIRED", message: "Tenant ID requis" },
          { status: 400 }
        );
      }

      const userId = req.headers.get("x-user-id") || "system";
      const role = req.headers.get("x-user-role") || "GERANT";
      const email = req.headers.get("x-user-email") || "system@fisclens.tg";
      const name = req.headers.get("x-user-name") || "Utilisateur système";

      if (options?.roles && options.roles.length > 0 && !options.roles.includes(role)) {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      }

      const ctx: GuardContext = {
        params: context.params,
        tenantId,
        userId,
        role,
        user: {
          id: userId,
          userId: userId,
          email,
          name,
        },
      };

      return await handler(req, ctx);
    } catch (err: any) {
      const msg = err?.message || "Internal server error";
      console.error("[WITH_GUARD_ERROR]", msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  };
}

export const withTenantGuard = withGuard;
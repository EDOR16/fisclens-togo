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
  requireTenant?: boolean; // Par défaut true, sauf si explicitement false
}

type Handler = (
  req: NextRequest,
  ctx: GuardContext
) => Promise<NextResponse> | NextResponse;

/**
 * Middleware de protection multi-tenant.
 * Si options.requireTenant === false, on injecte un tenantId vide mais on ne bloque pas.
 */
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

      // ❌ CORRECTION ICI : On ne bloque QUE si requireTenant n'est pas explicitement false
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

      // Vérification des rôles autorisés
      if (options?.roles && options.roles.length > 0 && !options.roles.includes(role)) {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      }

      const ctx: GuardContext = {
        params: context.params,
        tenantId, // Peut être "" si requireTenant=false
        userId,
        role,
        user: {
          id: userId,
          userId,
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

// Alias pour compatibilité
export const withTenantGuard = withGuard;
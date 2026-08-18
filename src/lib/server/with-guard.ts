import { NextRequest, NextResponse } from "next/server";

type RouteHandler = (
  req: NextRequest,
  context: { params: Record<string, string> }
) => Promise<NextResponse> | NextResponse;

interface GuardContext {
  tenantId: string;
  userId: string;
  role: string;
}

/**
 * Middleware de protection des routes API multi-tenant.
 * Version simplifiée : valide le tenantId en header ou query.
 */
export function withGuard(
  handler: (
    req: NextRequest,
    context: { params: Record<string, string> } & GuardContext
  ) => Promise<NextResponse> | NextResponse
): RouteHandler {
  return async (req: NextRequest, context: { params: Record<string, string> }) => {
    try {
      const tenantId =
        req.headers.get("x-tenant-id") || req.nextUrl.searchParams.get("tenantId");

      if (!tenantId) {
        return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
      }

      const userId = req.headers.get("x-user-id") || "system";
      const role = req.headers.get("x-user-role") || "GERANT";

      return await handler(req, { ...context, tenantId, userId, role });
    } catch (err: any) {
      return NextResponse.json(
        { error: err?.message || "Internal error" },
        { status: 500 }
      );
    }
  };
}

// Alias pour compatibilité
export const withTenantGuard = withGuard;

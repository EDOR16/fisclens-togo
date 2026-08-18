import { NextRequest, NextResponse } from "next/server";

type RouteHandler = (
  req: NextRequest,
  context: { params: Record<string, string> }
) => Promise<NextResponse>;

interface TenantGuardContext {
  tenantId: string;
  userId: string;
  role: string;
}

/**
 * Middleware de protection des routes API multi-tenant.
 * Version simplifiée : valide le tenantId transmis en header/query.
 * L'authentification complète sera branchée en phase sécurité.
 */
export function withTenantGuard(
  handler: (
    req: NextRequest,
    context: { params: Record<string, string> } & TenantGuardContext
  ) => Promise<NextResponse>
): RouteHandler {
  return async (req: NextRequest, context: { params: Record<string, string> }) => {
    const tenantId =
      req.headers.get("x-tenant-id") || req.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const userId = req.headers.get("x-user-id") || "system";
    const role = req.headers.get("x-user-role") || "GERANT";

    return handler(req, { ...context, tenantId, userId, role });
  };
}
import { NextRequest, NextResponse } from "next/server";
import { verifyJwt, JwtPayload } from "@/lib/server/jwt";
import { prisma } from "@/lib/server/prisma";

export type AuthenticatedContext = {
  user: JwtPayload;
  tenantId: string;
  role: string;
};

type GuardOptions = {
  roles?: string[];
  requireTenant?: boolean;
};

type GuardedHandler = (
  req: NextRequest,
  ctx: AuthenticatedContext
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function pour protéger les routes API Next.js.
 * Vérifie l'authentification JWT, l'accès au tenant (x-tenant-id) et les permissions de rôle.
 */
export function withGuard(
  handler: GuardedHandler,
  options: GuardOptions = { requireTenant: true }
) {
  return async function (req: NextRequest): Promise<NextResponse> {
    // 1. Extraire le token
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("fl_token")?.value;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : cookieToken;

    if (!token) {
      return NextResponse.json(
        { error: "AUTHENTICATION_REQUIRED", message: "Token d'authentification manquant" },
        { status: 401 }
      );
    }

    // 2. Vérifier le JWT
    const payload = await verifyJwt(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: "INVALID_TOKEN", message: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    // 3. Vérifier le tenant si requis
    const requestedTenantId =
      req.headers.get("x-tenant-id") || payload.tenantId || "";

    let effectiveRole = payload.role;

    if (options.requireTenant !== false) {
      if (!requestedTenantId) {
        return NextResponse.json(
          { error: "TENANT_REQUIRED", message: "En-tête x-tenant-id requis" },
          { status: 400 }
        );
      }

      // Vérifier que l'utilisateur a bien accès à ce tenant
      const membership = await prisma.userTenant.findUnique({
        where: {
          userId_tenantId: {
            userId: payload.userId,
            tenantId: requestedTenantId,
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "TENANT_FORBIDDEN", message: "Accès non autorisé à cette entreprise" },
          { status: 403 }
        );
      }

      effectiveRole = membership.role;
    }

    // 4. Vérifier les rôles autorisés si spécifié
    if (options.roles && options.roles.length > 0) {
      if (!options.roles.includes(effectiveRole)) {
        return NextResponse.json(
          { error: "INSUFFICIENT_PERMISSIONS", message: "Permissions insuffisantes pour cette action" },
          { status: 403 }
        );
      }
    }

    // 5. Exécuter le handler sécurisé
    try {
      return await handler(req, {
        user: payload,
        tenantId: requestedTenantId,
        role: effectiveRole,
      });
    } catch (err: unknown) {
      console.error("[API_ERROR]", err);
      return NextResponse.json(
        {
          error: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "Erreur interne du serveur",
        },
        { status: 500 }
      );
    }
  };
}

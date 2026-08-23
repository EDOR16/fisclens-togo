import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/server/jwt";
import { prisma } from "@/lib/server/prisma";

export interface AuthenticatedContext {
  params: Record<string, string>;
  tenantId: string;
  userId: string;
  role: string;
  isSuperAdmin: boolean;
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
  requireSuperAdmin?: boolean;
}

type Handler = (
  req: NextRequest,
  ctx: GuardContext
) => Promise<NextResponse> | NextResponse;

export function withGuard(
  handler: Handler,
  options?: GuardOptions
) {
  return async (
    req: NextRequest,
    context: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    try {
      // 1. Token
      const token =
        req.cookies.get("fl_token")?.value ||
        req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
        "";

      if (!token) {
        return NextResponse.json(
          { error: "UNAUTHENTICATED", message: "Authentification requise" },
          { status: 401 }
        );
      }

      // 2. JWT
      const payload = await verifyJwt(token);

      if (!payload?.userId) {
        return NextResponse.json(
          { error: "INVALID_TOKEN", message: "Session invalide ou expirée" },
          { status: 401 }
        );
      }

      // 3. User
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          isSuperAdmin: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "UNAUTHENTICATED", message: "Utilisateur introuvable" },
          { status: 401 }
        );
      }

      // 4. Super Admin
      if (options?.requireSuperAdmin) {
        if (!user.isSuperAdmin) {
          return NextResponse.json(
            { error: "FORBIDDEN" },
            { status: 403 }
          );
        }

        return handler(req, {
          params: context.params,
          tenantId: "",
          userId: user.id,
          role: "SUPER_ADMIN",
          isSuperAdmin: true,
          user: {
            id: user.id,
            userId: user.id,
            email: user.email,
            name: user.name ?? undefined,
          },
        });
      }

      // 5. Tenant
      const requestedTenantId =
        req.headers.get("x-tenant-id") ||
        req.nextUrl.searchParams.get("tenantId") ||
        payload.tenantId ||
        "";

      // IMPORTANT :
      // /auth/me peut fonctionner sans tenant
      if (!requestedTenantId && options?.requireTenant !== false) {
        return NextResponse.json(
          {
            error: "TENANT_REQUIRED",
            message: "Tenant ID requis",
          },
          { status: 400 }
        );
      }

      let role = "";

      // 6. Vérification membership
      if (requestedTenantId) {
        if (user.isSuperAdmin) {
          role = "ADMIN_SYS";
        } else {
          const membership = await prisma.userTenant.findUnique({
            where: {
              userId_tenantId: {
                userId: user.id,
                tenantId: requestedTenantId,
              },
            },
            select: {
              role: true,
            },
          });

          if (!membership) {
            return NextResponse.json(
              {
                error: "FORBIDDEN",
                message: "Accès non autorisé à ce dossier",
              },
              { status: 403 }
            );
          }

          role = membership.role;
        }
      }

      // 7. Vérification rôle
      if (
        options?.roles?.length &&
        !options.roles.includes(role) &&
        !user.isSuperAdmin
      ) {
        return NextResponse.json(
          { error: "FORBIDDEN" },
          { status: 403 }
        );
      }

      // 8. Contexte final
      return handler(req, {
        params: context.params,
        tenantId: requestedTenantId,
        userId: user.id,
        role,
        isSuperAdmin: user.isSuperAdmin,
        user: {
          id: user.id,
          userId: user.id,
          email: user.email,
          name: user.name ?? undefined,
        },
      });
    } catch (err) {
      console.error("[WITH_GUARD_ERROR]", err);

      return NextResponse.json(
        { error: "INTERNAL_SERVER_ERROR" },
        { status: 500 }
      );
    }
  };
}

export const withTenantGuard = withGuard;
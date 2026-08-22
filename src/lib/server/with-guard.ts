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
  requireSuperAdmin?: boolean; // Pour les routes du Super Admin Panel : ignore tout rôle par tenant
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
      // 1. Extraire le token — cookie en priorité (navigateur), sinon header Authorization (API/mobile)
      const token =
        req.cookies.get("fl_token")?.value ||
        req.headers.get("authorization")?.replace("Bearer ", "") ||
        "";

      if (!token) {
        return NextResponse.json(
          { error: "UNAUTHENTICATED", message: "Authentification requise" },
          { status: 401 }
        );
      }

      // 2. Vérifier la signature + expiration du JWT — plus aucune confiance aveugle aux headers client
      const payload = await verifyJwt(token);
      if (!payload || !payload.userId) {
        return NextResponse.json(
          { error: "INVALID_TOKEN", message: "Session invalide ou expirée" },
          { status: 401 }
        );
      }

      // 3. Recharger l'utilisateur en base — nécessaire pour connaître isSuperAdmin
      //    et pour être sûr que le compte n'a pas été désactivé/supprimé depuis l'émission du token.
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, name: true, isSuperAdmin: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: "UNAUTHENTICATED", message: "Utilisateur introuvable" },
          { status: 401 }
        );
      }

      // 4. Routes réservées au Super Admin Panel : accès transversal, aucun tenant requis
      if (options?.requireSuperAdmin) {
        if (!user.isSuperAdmin) {
          return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
        }

        const ctx: GuardContext = {
          params: context.params,
          tenantId: "",
          userId: user.id,
          role: "SUPER_ADMIN",
          isSuperAdmin: true,
          user: { id: user.id, userId: user.id, email: user.email, name: user.name },
        };
        return await handler(req, ctx);
      }

      // 5. Déterminer le tenant demandé pour cette requête (le JWT ne fige plus le tenant :
      //    un CABINET doit pouvoir changer de dossier sans se reconnecter)
      const requestedTenantId =
        req.headers.get("x-tenant-id") ||
        req.nextUrl.searchParams.get("tenantId") ||
        payload.tenantId ||
        "";

      if (!requestedTenantId && options?.requireTenant !== false) {
        return NextResponse.json(
          { error: "TENANT_REQUIRED", message: "Tenant ID requis" },
          { status: 400 }
        );
      }

      let role = "";

      if (requestedTenantId) {
        if (user.isSuperAdmin) {
          // Le super admin peut consulter n'importe quel tenant en lecture/admin,
          // sans qu'une ligne UserTenant existe forcément pour lui.
          role = "ADMIN_SYS";
        } else {
          // Vérifie EN BASE que cet utilisateur a bien un accès à CE tenant précis.
          // C'est ce qui manquait : avant, le tenantId venait d'un header non vérifié.
          const membership = await prisma.userTenant.findUnique({
            where: { userId_tenantId: { userId: user.id, tenantId: requestedTenantId } },
            select: { role: true },
          });

          if (!membership) {
            return NextResponse.json(
              { error: "FORBIDDEN", message: "Accès non autorisé à ce dossier" },
              { status: 403 }
            );
          }

          role = membership.role;
        }
      }

      if (
        options?.roles &&
        options.roles.length > 0 &&
        !options.roles.includes(role) &&
        !user.isSuperAdmin
      ) {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      }

      const ctx: GuardContext = {
        params: context.params,
        tenantId: requestedTenantId,
        userId: user.id,
        role,
        isSuperAdmin: user.isSuperAdmin,
        user: { id: user.id, userId: user.id, email: user.email, name: user.name },
      };

      return await handler(req, ctx);
    } catch (err: any) {
      const msg = err?.message || "Internal server error";
      console.error("[WITH_GUARD_ERROR]", msg);
      return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
    }
  };
}

export const withTenantGuard = withGuard;
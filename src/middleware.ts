import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware Next.js — protection globale des routes.
 * - Routes (app)/* → nécessitent un token valide
 * - Routes (public)/* → libres
 * La vérification complète (JWT + tenant + rôle) est dans withGuard.ts côté API.
 *
 * Défense en profondeur : on supprime ici tout header d'identité envoyé par le client
 * AVANT qu'il n'atteigne les routes API. Même si
 * withGuard.ts ignore déjà ces headers pour l'identité (il ne fait plus confiance
 * qu'au JWT vérifié), ce nettoyage empêche toute régression future qui recommencerait
 * à les lire par erreur.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques — pas de protection
  const PUBLIC_PATHS = ["/login", "/register", "/2fa", "/api/v1/auth", "/api/v1/health"];
  const isPublic = pathname === "/" || PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-user-id");
  requestHeaders.delete("x-user-role");
  requestHeaders.delete("x-user-email");
  requestHeaders.delete("x-user-name");
  // Note : x-tenant-id reste autorisé — c'est un paramètre légitime (quel dossier
  // consulter), pas une preuve d'identité. Sa validité est vérifiée en base dans
  // withGuard.ts via UserTenant, pas prise pour argent comptant.

  if (isPublic) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Vérification token (présence uniquement — validité vérifiée par l'API)
  const token =
    request.cookies.get("fl_token")?.value ??
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token && !pathname.startsWith("/api/")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
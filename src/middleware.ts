import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware Next.js — protection globale des routes.
 * - Routes (app)/* → nécessitent un token valide
 * - Routes (public)/* → libres
 * La vérification complète (JWT + tenant + rôle) est dans withGuard.ts côté API.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques — pas de protection
  const PUBLIC_PATHS = ["/login", "/register", "/2fa", "/api/v1/auth", "/api/v1/health"];
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // Vérification token (présence uniquement — validité vérifiée par l'API)
  const token =
    request.cookies.get("fl_token")?.value ??
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token && !pathname.startsWith("/api/")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};

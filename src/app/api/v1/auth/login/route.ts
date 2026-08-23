export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { signJwt } from "@/lib/server/jwt";

const LoginInputSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

// Durée de vie du cookie alignée sur l'expiration du JWT (signJwt utilise "7d")
const TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export async function POST(req: NextRequest) {
  try {
    // 1. Parsing sécurisé
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    }

    const parsed = LoginInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Recherche utilisateur (avec gestion d'erreur DB)
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          userTenants: {
            include: { tenant: true },
          },
        },
      });
    } catch (dbError) {
      console.error("[LOGIN_DB_ERROR]", dbError);
      return NextResponse.json({ error: "DB_CONNECTION_FAILED" }, { status: 503 });
    }

    if (!user) {
      // Sécurité : ne pas révéler si l'email existe ou non
      return NextResponse.json(
        { error: "INVALID_CREDENTIALS", message: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // 3. Vérification mot de passe
    if (!user.passwordHash) {
      // Compte créé via Google/Firebase : pas de mot de passe local à comparer
      return NextResponse.json(
        { error: "NO_PASSWORD_SET", message: "Ce compte utilise la connexion Google. Utilisez « Continuer avec Google »." },
        { status: 401 }
      );
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json(
        { error: "INVALID_CREDENTIALS", message: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // 4. Préparation contexte
    const primaryMembership = user.userTenants[0];
    const tenantId = primaryMembership ? primaryMembership.tenantId : "";
    const role = primaryMembership ? primaryMembership.role : "GERANT";

    // 5. Gestion 2FA — pas de cookie posé tant que le TOTP n'est pas vérifié
    if (user.require2fa) {
      return NextResponse.json({
        token: "",
        tenantId: "",
        require2fa: true,
        userId: user.id,
      });
    }

    // 6. Génération Token
    let token;
    try {
      token = await signJwt({
        userId: user.id,
        email: user.email,
        role,
        tenantId,
      });
    } catch (jwtError) {
      console.error("[LOGIN_JWT_ERROR]", jwtError);
      return NextResponse.json({ error: "TOKEN_GENERATION_FAILED" }, { status: 500 });
    }

    const response = NextResponse.json({
      token,
      tenantId,
      require2fa: false,
      userId: user.id,
    });

    // 7. Pose du cookie httpOnly — lu par middleware.ts lors des navigations plein-page.
    //    Le token est aussi renvoyé en JSON ci-dessus pour les appels fetch (api-client.ts)
    //    qui l'utilisent en header Authorization.
    response.cookies.set("fl_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TOKEN_MAX_AGE_SECONDS,
    });

    return response;

  } catch (err: unknown) {
    console.error("[LOGIN_CRITICAL_ERROR]", err);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: err instanceof Error ? err.message : "Erreur critique inattendue",
      },
      { status: 500 }
    );
  }
}
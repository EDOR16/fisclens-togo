import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { signJwt } from "@/lib/server/jwt"; // Assurez-vous que ce fichier existe et exporte signJwt

const LoginInputSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

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
      console.error("[LOGIN_ERROR] User has no password hash");
      return NextResponse.json({ error: "ACCOUNT_CONFIG_ERROR" }, { status: 500 });
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

    // 5. Gestion 2FA
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

    return NextResponse.json({
      token,
      tenantId,
      require2fa: false,
      userId: user.id,
    });

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
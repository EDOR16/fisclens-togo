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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Rechercher l'utilisateur avec ses tenants
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        userTenants: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "INVALID_CREDENTIALS", message: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Vérifier le hash du mot de passe
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json(
        { error: "INVALID_CREDENTIALS", message: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Premier tenant associé
    const primaryMembership = user.userTenants[0];
    const tenantId = primaryMembership ? primaryMembership.tenantId : "";
    const role = primaryMembership ? primaryMembership.role : "GERANT";

    // Si 2FA est activé sur le compte
    if (user.require2fa) {
      return NextResponse.json({
        token: "",
        tenantId: "",
        require2fa: true,
        userId: user.id,
      });
    }

    // Génération du token
    const token = await signJwt({
      userId: user.id,
      email: user.email,
      role,
      tenantId,
    });

    return NextResponse.json({
      token,
      tenantId,
      require2fa: false,
      userId: user.id,
    });
  } catch (err: unknown) {
    console.error("[LOGIN_ERROR]", err);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: err instanceof Error ? err.message : "Erreur interne",
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { signJwt } from "@/lib/server/jwt";
import { provisionTenant } from "@/lib/server/provisioning";

const RegisterInputSchema = z.object({
  companyName: z.string().min(2, "Le nom de l'entreprise ou du cabinet est requis"),
  email: z.string().email("Adresse email invalide"),
  password: z
    .string()
    .min(10, "Le mot de passe doit contenir au moins 10 caractères pour la sécurité des données financières"),
  regime: z.enum(["REEL_NORMAL", "RSI", "TPU"]).default("REEL_NORMAL"),
  nif: z.string().optional(),
  role: z.enum(["GERANT", "COMPTABLE", "CABINET"]).default("GERANT"),
  cgu: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter les Conditions Générales d'Utilisation" }),
  }),
  confidentialite: z.literal(true, {
    errorMap: () => ({
      message: "Vous devez accepter la politique de confidentialité (Loi togolaise n°2018-26)",
    }),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: parsed.error.format() },
        { status: 422 }
      );
    }

    const { companyName, email, password, regime, nif, role } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Vérifier si l'utilisateur existe déjà
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "USER_ALREADY_EXISTS", message: "Un compte existe déjà avec cet email" },
        { status: 409 }
      );
    }

    // 2. Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Créer l'utilisateur réel
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: companyName,
        passwordHash,
        require2fa: role === "CABINET",
      },
    });

    // 4. Provisionner un espace de travail réel, vierge de toute écriture et 100% configuré
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const tenant = await provisionTenant({
      tenantName: companyName,
      ownerUserId: user.id,
      regime,
      nif,
      role,
      ip: clientIp,
      userAgent,
    });

    // 5. Générer le token JWT d'authentification
    const token = await signJwt({
      userId: user.id,
      email: user.email,
      role,
      tenantId: tenant.id,
    });

    return NextResponse.json(
      {
        message: "Espace professionnel configuré avec succès",
        token,
        tenantId: tenant.id,
        require2fa: user.require2fa,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("[REGISTER_ERROR]", err);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: err instanceof Error ? err.message : "Erreur lors de la création de l'espace",
      },
      { status: 500 }
    );
  }
}

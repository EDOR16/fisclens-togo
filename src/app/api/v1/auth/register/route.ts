import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { signJwt } from "@/lib/server/jwt";

const RegisterInputSchema = z.object({
  companyName: z.string().min(2, "Nom de l'entreprise requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  regime: z.enum(["REEL_NORMAL", "REEL_SIMPLIFIE", "TPU"]).default("REEL_NORMAL"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { companyName, email, password, regime } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Vérifier l'existence du compte
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "USER_ALREADY_EXISTS", message: "Un compte existe déjà avec cet email" },
        { status: 409 }
      );
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer la transaction : User + Tenant + UserTenant + Comptes de base
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: companyName,
          passwordHash,
        },
      });

      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          regime,
        },
      });

      await tx.userTenant.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: "GERANT",
        },
      });

      // Initialiser les comptes SYSCOHADA essentiels pour le tenant
      const defaultComptes = [
        { code: "101000", libelle: "Capital social", classe: 1 },
        { code: "401000", libelle: "Fournisseurs", classe: 4 },
        { code: "411000", libelle: "Clients", classe: 4 },
        { code: "443100", libelle: "État, TVA facturée sur ventes (18%)", classe: 4 },
        { code: "445100", libelle: "État, TVA déductible sur achats", classe: 4 },
        { code: "521000", libelle: "Banque locale Togo", classe: 5 },
        { code: "571000", libelle: "Caisse principale", classe: 5 },
        { code: "601000", libelle: "Achats de marchandises", classe: 6 },
        { code: "661000", libelle: "Rémunération du personnel", classe: 6 },
        { code: "701000", libelle: "Ventes de marchandises", classe: 7 },
      ];

      for (const c of defaultComptes) {
        await tx.comptePlan.create({
          data: {
            tenantId: tenant.id,
            code: c.code,
            libelle: c.libelle,
            classe: c.classe,
          },
        });
      }

      return { user, tenant };
    });

    // Générer le JWT
    const token = await signJwt({
      userId: result.user.id,
      email: result.user.email,
      role: "GERANT",
      tenantId: result.tenant.id,
    });

    return NextResponse.json(
      {
        token,
        tenantId: result.tenant.id,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("[REGISTER_ERROR]", err);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: err instanceof Error ? err.message : "Erreur interne",
      },
      { status: 500 }
    );
  }
}

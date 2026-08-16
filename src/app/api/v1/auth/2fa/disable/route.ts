import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/server/prisma";
import { withGuard, AuthenticatedContext } from "@/lib/server/with-guard";

const DisableSchema = z.object({
  password: z.string().min(1, "Mot de passe requis pour désactiver la 2FA"),
});

/**
 * Désactive la 2FA après vérification du mot de passe de l'utilisateur.
 */
export const POST = withGuard(
  async (req: NextRequest, ctx: AuthenticatedContext) => {
    try {
      const body = await req.json();
      const parsed = DisableSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", details: parsed.error.format() },
          { status: 400 }
        );
      }

      const { password } = parsed.data;

      const user = await prisma.user.findUnique({
        where: { id: ctx.user.userId },
      });

      if (!user) {
        return NextResponse.json(
          { error: "USER_NOT_FOUND", message: "Utilisateur introuvable" },
          { status: 404 }
        );
      }

      // Vérification du mot de passe courant
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "INVALID_PASSWORD", message: "Mot de passe incorrect." },
          { status: 401 }
        );
      }

      // Désactivation de la 2FA et nettoyage
      await prisma.user.update({
        where: { id: user.id },
        data: {
          require2fa: false,
          twoFaSecret: null,
          backupCodes: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "L'authentification à deux facteurs a été désactivée.",
      });
    } catch (err: unknown) {
      console.error("[2FA_DISABLE_ERROR]", err);
      return NextResponse.json(
        {
          error: "DISABLE_FAILED",
          message: err instanceof Error ? err.message : "Erreur lors de la désactivation de la 2FA",
        },
        { status: 500 }
      );
    }
  },
  { requireTenant: false }
);

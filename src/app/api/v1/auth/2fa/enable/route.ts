import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authenticator } from "otplib";
import { prisma } from "@/lib/server/prisma";
import { withGuard, AuthenticatedContext } from "@/lib/server/with-guard";

const EnableSchema = z.object({
  otp: z.string().length(6, "Le code doit contenir 6 chiffres"),
});

/**
 * Valide le premier code OTP saisi par l'utilisateur,
 * active la 2FA (require2fa: true) et génère 8 codes de secours uniques.
 */
export const POST = withGuard(
  async (req: NextRequest, ctx: AuthenticatedContext) => {
    try {
      const body = await req.json();
      const parsed = EnableSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", details: parsed.error.format() },
          { status: 400 }
        );
      }

      const { otp } = parsed.data;

      const user = await prisma.user.findUnique({
        where: { id: ctx.user.userId },
      });

      if (!user || !user.twoFaSecret) {
        return NextResponse.json(
          { error: "NO_SECRET_FOUND", message: "Veuillez d'abord initialiser la configuration 2FA." },
          { status: 400 }
        );
      }

      // Vérification du code OTP
      const isValid = authenticator.check(otp, user.twoFaSecret);
      if (!isValid) {
        return NextResponse.json(
          { error: "INVALID_OTP", message: "Code OTP invalide. Vérifiez l'heure de votre appareil." },
          { status: 400 }
        );
      }

      // Génération de 8 codes de secours alphanumériques uniques (format XXXX-XXXX)
      const plainBackupCodes: string[] = [];
      const hashedBackupCodes: Array<{ hash: string; used: boolean }> = [];

      for (let i = 0; i < 8; i++) {
        const rawCode = crypto.randomBytes(4).toString("hex").toUpperCase();
        const formattedCode = `${rawCode.slice(0, 4)}-${rawCode.slice(4, 8)}`;
        plainBackupCodes.push(formattedCode);
        const hash = await bcrypt.hash(formattedCode.replace("-", ""), 10);
        hashedBackupCodes.push({ hash, used: false });
      }

      // Sauvegarde et activation
      await prisma.user.update({
        where: { id: user.id },
        data: {
          require2fa: true,
          backupCodes: JSON.stringify(hashedBackupCodes),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Authentification à deux facteurs activée avec succès.",
        backupCodes: plainBackupCodes,
      });
    } catch (err: unknown) {
      console.error("[2FA_ENABLE_ERROR]", err);
      return NextResponse.json(
        {
          error: "ENABLE_FAILED",
          message: err instanceof Error ? err.message : "Erreur lors de l'activation de la 2FA",
        },
        { status: 500 }
      );
    }
  },
  { requireTenant: false }
);

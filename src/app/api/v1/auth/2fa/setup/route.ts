import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { prisma } from "@/lib/server/prisma";
import { withGuard, AuthenticatedContext } from "@/lib/server/with-guard";

/**
 * Initialise la configuration 2FA pour l'utilisateur connecté.
 * Génère un secret TOTP et un QR Code en Base64.
 */
export const POST = withGuard(
  async (req: NextRequest, ctx: AuthenticatedContext) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: ctx.user.userId },
      });

      if (!user) {
        return NextResponse.json(
          { error: "USER_NOT_FOUND", message: "Utilisateur introuvable" },
          { status: 404 }
        );
      }

      // Génération du secret TOTP
      const secret = authenticator.generateSecret();
      const appName = "FiscLens Togo";
      const otpauthUrl = authenticator.keyuri(user.email, appName, secret);

      // Génération du QR Code Data URL
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });

      // Sauvegarde temporaire du secret (la 2FA ne sera active qu'après validation du premier code)
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFaSecret: secret },
      });

      return NextResponse.json({
        secret,
        qrCodeDataUrl,
        otpauthUrl,
      });
    } catch (err: unknown) {
      console.error("[2FA_SETUP_ERROR]", err);
      return NextResponse.json(
        {
          error: "SETUP_FAILED",
          message: err instanceof Error ? err.message : "Erreur lors de la configuration 2FA",
        },
        { status: 500 }
      );
    }
  },
  { requireTenant: false }
);

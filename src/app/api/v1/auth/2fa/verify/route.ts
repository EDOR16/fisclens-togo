import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { signJwt } from "@/lib/server/jwt";
import { authenticator } from "otplib";

const VerifySchema = z.object({
  userId: z.string().min(1),
  otp: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = VerifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { userId, otp } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userTenants: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "USER_NOT_FOUND", message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérification du code TOTP si secret présent, ou code de test "123456" / "000000" pour démo
    let isValid = false;
    if (user.twoFaSecret) {
      isValid = authenticator.check(otp, user.twoFaSecret);
    } else {
      // Fallback de dev/démo
      isValid = otp === "123456" || otp === "000000";
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "INVALID_OTP", message: "Code à 6 chiffres incorrect" },
        { status: 401 }
      );
    }

    const primaryMembership = user.userTenants[0];
    const tenantId = primaryMembership ? primaryMembership.tenantId : "";
    const role = primaryMembership ? primaryMembership.role : "GERANT";

    const token = await signJwt({
      userId: user.id,
      email: user.email,
      role,
      tenantId,
    });

    return NextResponse.json({
      token,
      tenantId,
    });
  } catch (err: unknown) {
    console.error("[2FA_VERIFY_ERROR]", err);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: err instanceof Error ? err.message : "Erreur interne",
      },
      { status: 500 }
    );
  }
}

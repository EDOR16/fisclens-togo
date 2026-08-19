export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/server/prisma";
import { signJwt } from "@/lib/server/jwt";
import { authenticator } from "otplib";

const VerifySchema = z.object({
  userId: z.string().min(1),
  otp: z.string().min(6, "Code invalide").max(10, "Code invalide"),
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
    const cleanOtp = otp.trim().replace(/[\s-]/g, "");

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

    let isValid = false;
    let usedBackupIndex = -1;

    // 1. Vérifier si c'est un code TOTP (6 chiffres)
    if (/^\d{6}$/.test(cleanOtp) && user.twoFaSecret) {
      isValid = authenticator.check(cleanOtp, user.twoFaSecret);
    }

    // 2. Si non valide par TOTP, vérifier si c'est un code de secours (8 caractères)
    if (!isValid && user.backupCodes) {
      try {
        const backupList: Array<{ hash: string; used: boolean }> = JSON.parse(
          user.backupCodes
        );
        for (let i = 0; i < backupList.length; i++) {
          const item = backupList[i];
          if (item && !item.used) {
            const match = await bcrypt.compare(cleanOtp.toUpperCase(), item.hash);
            if (match) {
              isValid = true;
              usedBackupIndex = i;
              item.used = true;
              // Mettre à jour la liste des codes en DB
              await prisma.user.update({
                where: { id: user.id },
                data: { backupCodes: JSON.stringify(backupList) },
              });
              break;
            }
          }
        }
      } catch (e) {
        console.error("[BACKUP_CODE_PARSE_ERROR]", e);
      }
    }

    // 3. Fallback uniquement en environnement de développement local si aucun secret n'est configuré
    if (!isValid && process.env.NODE_ENV !== "production" && !user.twoFaSecret) {
      isValid = cleanOtp === "123456" || cleanOtp === "000000";
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "INVALID_OTP", message: "Code TOTP ou code de secours incorrect" },
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
      usedBackupCode: usedBackupIndex !== -1,
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

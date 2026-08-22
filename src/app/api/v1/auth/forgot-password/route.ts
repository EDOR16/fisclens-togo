import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Validation stricte de l'email entrant
const ForgotPasswordSchema = z.object({
  email: z.string().email("Format d'email invalide").toLowerCase().trim(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ForgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: parsed.error.format() },
        { status: 422 }
      );
    }

    const { email } = parsed.data;

    // 1. Rechercher l'utilisateur (sans exposer son existence)
    const user = await prisma.user.findUnique({ where: { email } });

    // NOTE DE SÉCURITÉ : On renvoie toujours 200 OK pour éviter l'énumération de comptes.
    if (!user) {
      return NextResponse.json(
        { message: "Si cet email est associé à un compte, vous recevrez un lien de réinitialisation." },
        { status: 200 }
      );
    }

    // 2. Générer un token cryptographique sécurisé (valable 15 minutes)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await hash(resetToken, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // 3. Sauvegarder le token hashé dans la base
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: expiresAt,
      },
    });

    // 4. Construire le lien de réinitialisation
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password?token=${resetToken}&uid=${user.id}`;

    // 5. Envoi de l'email transactionnel via Resend SANDBOX
    // ⚠️ MODE TEST : L'email sera délivré à une adresse de test Resend, pas à user.email
    const response = await resend.emails.send({
      from: "FiscLens Togo <onboarding@resend.dev>", // Domaine sandbox gratuit
      to: ["delivered@resend.dev"], // Adresse de test obligatoire en sandbox
      subject: `[TEST] Réinitialisation de votre mot de passe - FiscLens`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color: #0B3D2E;">FiscLens Togo (Mode Test)</h2>
          <p>Bonjour,</p>
          <p>Ceci est un email de test. Le lien ci-dessous est valide :</p>
          <a href="${resetLink}" 
             style="display: inline-block; background: #0B3D2E; color: white; 
                    padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                    font-weight: bold; margin: 20px 0;">
            Réinitialiser mon mot de passe
          </a>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Ce lien expire dans 15 minutes.<br/>
            Email original demandé pour : <strong>${user.email}</strong>
          </p>
        </div>
      `,
    });

    // Log de debug pour vérifier que Resend a accepté la requête
    console.log("[RESEND_SANDBOX]", response);

    // 6. Audit log (Section 8 - Traçabilité obligatoire)
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        entity: "USER",
        entityId: user.id,
        details: JSON.stringify({
          ip: req.headers.get("x-forwarded-for"),
          sandboxMode: true,
          deliveredTo: "delivered@resend.dev"
        }),
      },
    });

    return NextResponse.json(
      { message: "Si cet email est associé à un compte, vous recevrez un lien de réinitialisation." },
      { status: 200 }
    );

  } catch (error) {
    console.error("[FORGOT_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "Une erreur est survenue lors de la demande." },
      { status: 500 }
    );
  }
}
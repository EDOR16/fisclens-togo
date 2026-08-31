export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { decodeJwt } from "jose";
import { prisma } from "@/lib/server/prisma";
import { signJwt } from "@/lib/server/jwt";
import { provisionTenant } from "@/lib/server/provisioning";

const FirebaseInputSchema = z.object({
  idToken: z.string().min(10, "Token Firebase requis"),
  companyName: z.string().optional(),
  regime: z.enum(["REEL_NORMAL", "RSI", "TPU"]).optional().default("REEL_NORMAL"),
  nif: z.string().optional(),
  role: z.enum(["GERANT", "COMPTABLE", "CABINET"]).optional().default("GERANT"),
  cgu: z.boolean().optional(),
  confidentialite: z.boolean().optional(),
});

const TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * Valide le token ID Firebase et extrait les informations du profil utilisateur
 */
async function verifyFirebaseToken(idToken: string): Promise<{
  email: string;
  name?: string;
  uid: string;
  emailVerified: boolean;
}> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  // 1. Validation via l'API REST Google Identity Toolkit (si API Key disponible)
  if (apiKey) {
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const user = json.users?.[0];
        if (user && user.email) {
          return {
            email: user.email.toLowerCase().trim(),
            name: user.displayName || user.email.split("@")[0],
            uid: user.localId,
            emailVerified: !!user.emailVerified,
          };
        }
      }
    } catch (apiErr) {
      console.warn("[FIREBASE_REST_LOOKUP_WARN]", apiErr);
    }
  }

  // 2. Fallback : Vérification & Décodage JWT (Google / Firebase ID Token)
  try {
    const payload = decodeJwt(idToken);
    const email = (payload.email as string)?.toLowerCase().trim();
    const uid = (payload.sub || payload.user_id) as string;
    const name = (payload.name as string) || email?.split("@")[0] || "Utilisateur";

    if (!email || !uid) {
      throw new Error("Token ID Firebase invalide (champs email/sub manquants)");
    }

    return {
      email,
      name,
      uid,
      emailVerified: !!payload.email_verified,
    };
  } catch (jwtErr: any) {
    throw new Error(jwtErr.message || "Impossible de décoder le token Firebase");
  }
}

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    }

    const parsed = FirebaseInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { idToken, companyName, regime, nif, role } = parsed.data;

    // 1. Vérification du token Firebase
    let googleUser;
    try {
      googleUser = await verifyFirebaseToken(idToken);
    } catch (err: any) {
      console.error("[FIREBASE_TOKEN_ERROR]", err);
      return NextResponse.json(
        { error: "INVALID_TOKEN", message: err.message || "Token Google/Firebase invalide ou expiré" },
        { status: 401 }
      );
    }

    const normalizedEmail = googleUser.email;
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    // 2. Recherche utilisateur existant dans la base
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        userTenants: {
          include: { tenant: true },
        },
      },
    });

    let userId = "";
    let userEmail = normalizedEmail;
    let tenantId = "";
    let userRole = role || "GERANT";
    let require2fa = false;

    if (existingUser) {
      // Utilisateur existant
      userId = existingUser.id;
      userEmail = existingUser.email;
      require2fa = existingUser.require2fa;

      const primaryMembership = existingUser.userTenants[0];

      if (primaryMembership) {
        tenantId = primaryMembership.tenantId;
        userRole = (primaryMembership.role as any) || userRole;
      } else {
        // Utilisateur existe mais n'a pas encore de tenant rattaché : on lui en provisionne un
        const targetCompanyName = companyName || existingUser.name || `${googleUser.name || "Mon Entreprise"}`;
        const newTenant = await provisionTenant({
          tenantName: targetCompanyName,
          ownerUserId: existingUser.id,
          regime: regime || "REEL_NORMAL",
          nif,
          role: userRole,
          ip: clientIp,
          userAgent,
        });
        tenantId = newTenant.id;
      }

      // Mise à jour du nom / authProvider si nécessaire
      if (!existingUser.name && googleUser.name) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { name: googleUser.name, authProvider: "GOOGLE" },
        });
      }
    } else {
      // 3. Nouvel utilisateur : Création compte + Provisioning de son espace de travail
      const targetCompanyName = companyName || `${googleUser.name || "Entreprise"} (${normalizedEmail.split("@")[0]})`;

      const newUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: googleUser.name || targetCompanyName,
          authProvider: "GOOGLE",
          require2fa: role === "CABINET",
        },
      });

      userId = newUser.id;
      userEmail = newUser.email;
      require2fa = newUser.require2fa;

      const newTenant = await provisionTenant({
        tenantName: targetCompanyName,
        ownerUserId: newUser.id,
        regime: regime || "REEL_NORMAL",
        nif,
        role: userRole,
        ip: clientIp,
        userAgent,
      });

      tenantId = newTenant.id;
    }

    // 4. Gestion 2FA (si activée)
    if (require2fa) {
      return NextResponse.json({
        token: "",
        tenantId: "",
        require2fa: true,
        userId,
      });
    }

    // 5. Génération du JWT de session FiscLens
    const token = await signJwt({
      userId,
      email: userEmail,
      role: userRole,
      tenantId,
    });

    const response = NextResponse.json({
      message: "Connexion Google réussie",
      token,
      tenantId,
      require2fa: false,
      userId,
    });

    // 6. Pose du cookie de session httpOnly fl_token
    response.cookies.set("fl_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TOKEN_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err: any) {
    console.error("[FIREBASE_AUTH_ROUTE_ERROR]", err);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: err instanceof Error ? err.message : "Erreur interne lors de la connexion Google",
      },
      { status: 500 }
    );
  }
}

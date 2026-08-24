export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { withGuard } from "@/lib/server/with-guard";

const TenantProfileUpdateSchema = z.object({
  name: z.string().min(2, "Le nom de l'entreprise est requis"),
  regime: z.enum(["REEL_NORMAL", "RSI", "TPU"]).default("REEL_NORMAL"),
  nif: z.string().optional().nullable(),
  rccm: z.string().optional().nullable(),
  cnssNumber: z.string().optional().nullable(),
  centreFiscal: z.string().optional().nullable(),
  formeJuridique: z.string().optional().nullable(),
  secteurActivite: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
});

export const GET = withGuard(async (_req, ctx) => {
  try {
    if (!ctx.tenantId) {
      return NextResponse.json({ error: "NO_TENANT", message: "Aucun dossier sélectionné" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: {
        id: true,
        name: true,
        regime: true,
        nif: true,
        rccm: true,
        cnssNumber: true,
        centreFiscal: true,
        formeJuridique: true,
        secteurActivite: true,
        phone: true,
        address: true,
        city: true,
        plan: true,
        exerciceOuvert: true,
        createdAt: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "TENANT_NOT_FOUND", message: "Entreprise introuvable" }, { status: 404 });
    }

    return NextResponse.json({ tenant }, { status: 200 });
  } catch (err: unknown) {
    console.error("[TENANT_PROFILE_GET_ERROR]", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Erreur serveur" }, { status: 500 });
  }
});

export const PUT = withGuard(async (req, ctx) => {
  try {
    if (!ctx.tenantId) {
      return NextResponse.json({ error: "NO_TENANT", message: "Aucun dossier sélectionné" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = TenantProfileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: parsed.error.format() },
        { status: 422 }
      );
    }

    const updated = await prisma.tenant.update({
      where: { id: ctx.tenantId },
      data: {
        name: parsed.data.name,
        regime: parsed.data.regime,
        nif: parsed.data.nif || null,
        rccm: parsed.data.rccm || null,
        cnssNumber: parsed.data.cnssNumber || null,
        centreFiscal: parsed.data.centreFiscal || "DPME Lomé",
        formeJuridique: parsed.data.formeJuridique || "SARL",
        secteurActivite: parsed.data.secteurActivite || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        city: parsed.data.city || "Lomé",
      },
    });

    return NextResponse.json(
      { message: "Fiche d'immatriculation fiscale mise à jour avec succès", tenant: updated },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[TENANT_PROFILE_PUT_ERROR]", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Erreur serveur" }, { status: 500 });
  }
});

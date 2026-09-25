export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";
import { provisionTenant } from "@/lib/server/provisioning";
import { z } from "zod";

// Schéma de validation pour l'ajout d'un nouveau dossier client par un cabinet
const createDossierSchema = z.object({
  name: z.string().min(2, "Le nom du dossier / client est requis"),
  regime: z.enum(["REEL_NORMAL", "RSI", "TPU"]).default("REEL_NORMAL"),
  nif: z.string().optional(),
  rccm: z.string().optional(),
  cnssNumber: z.string().optional(),
  centreFiscal: z.string().default("DPME Lomé"),
  formeJuridique: z.string().default("SARL"),
  secteurActivite: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().default("Lomé"),
});

/**
 * GET /api/v1/cabinet/portefeuille
 * Retourne tous les dossiers clients rattachés à l'utilisateur Cabinet (ou tous si SuperAdmin)
 * avec statistiques fiscales, volume comptable et statut d'audit.
 */
export const GET = withGuard(
  async (req: NextRequest, ctx) => {
    // Vérifier l'autorisation : Cabinet ou SuperAdmin
    const userRole = ctx.role;
    const isCabinetOrAdmin =
      ctx.isSuperAdmin || userRole === "CABINET" || userRole === "ADMIN_SYS";

    // Récupérer les identifiants de tenants accessibles par l'utilisateur
    let accessibleTenantIds: string[] = [];

    if (ctx.isSuperAdmin) {
      const all = await prisma.tenant.findMany({ select: { id: true } });
      accessibleTenantIds = all.map((t) => t.id);
    } else {
      const memberships = await prisma.userTenant.findMany({
        where: { userId: ctx.userId },
        select: { tenantId: true },
      });
      accessibleTenantIds = memberships.map((m) => m.tenantId);
    }

    if (accessibleTenantIds.length === 0) {
      return NextResponse.json({
        dossiers: [],
        stats: {
          totalDossiers: 0,
          reelNormalCount: 0,
          rsiCount: 0,
          tpuCount: 0,
          totalEcritures: 0,
          totalAnomalies: 0,
        },
        userRole,
      });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const regime = searchParams.get("regime")?.trim() || "";

    // Requête principale
    const tenants = await prisma.tenant.findMany({
      where: {
        id: { in: accessibleTenantIds },
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { nif: { contains: search, mode: "insensitive" } },
                  { city: { contains: search, mode: "insensitive" } },
                  { centreFiscal: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          regime ? { regime } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            userTenants: true,
            ecritures: true,
            anomaliesDetectees: {
              where: { statut: "A_EXAMINER" },
            },
            alerts: {
              where: { acknowledged: false },
            },
          },
        },
        ecritures: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            date: true,
            createdAt: true,
          },
        },
      },
    });

    // Calcul des KPI consolidés
    let reelNormalCount = 0;
    let rsiCount = 0;
    let tpuCount = 0;
    let totalEcritures = 0;
    let totalAnomalies = 0;

    const dossiers = tenants.map((t) => {
      if (t.regime === "REEL_NORMAL") reelNormalCount++;
      else if (t.regime === "RSI") rsiCount++;
      else if (t.regime === "TPU") tpuCount++;

      totalEcritures += t._count.ecritures;
      totalAnomalies += t._count.anomaliesDetectees;

      const lastEcriture = t.ecritures[0];

      return {
        id: t.id,
        name: t.name,
        regime: t.regime,
        nif: t.nif || "—",
        rccm: t.rccm || "—",
        formeJuridique: t.formeJuridique || "SARL",
        centreFiscal: t.centreFiscal || "DPME Lomé",
        city: t.city || "Lomé",
        phone: t.phone || "—",
        address: t.address || "—",
        exerciceOuvert: t.exerciceOuvert,
        plan: t.plan,
        userCount: t._count.userTenants,
        ecritureCount: t._count.ecritures,
        unresolvedAnomalies: t._count.anomaliesDetectees,
        pendingAlerts: t._count.alerts,
        lastActivity: lastEcriture ? lastEcriture.date : null,
        createdAt: t.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      dossiers,
      stats: {
        totalDossiers: tenants.length,
        reelNormalCount,
        rsiCount,
        tpuCount,
        totalEcritures,
        totalAnomalies,
      },
      userRole,
    });
  },
  { requireTenant: false }
);

/**
 * POST /api/v1/cabinet/portefeuille
 * Permet au cabinet de créer immédiatement un nouveau dossier client
 * avec génération automatique du plan SYSCOHADA et rattachement CABINET.
 */
export const POST = withGuard(
  async (req: NextRequest, ctx) => {
    try {
      const body = await req.json();
      const parsed = createDossierSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "INVALID_DATA", details: parsed.error.format() },
          { status: 400 }
        );
      }

      const data = parsed.data;

      // Création complète avec provisionnement SYSCOHADA
      const tenant = await provisionTenant({
        tenantName: data.name,
        ownerUserId: ctx.userId,
        regime: data.regime as any,
        nif: data.nif,
        rccm: data.rccm,
        cnssNumber: data.cnssNumber,
        centreFiscal: data.centreFiscal,
        formeJuridique: data.formeJuridique,
        secteurActivite: data.secteurActivite,
        phone: data.phone,
        address: data.address,
        city: data.city,
        role: "CABINET",
      });

      return NextResponse.json(
        {
          success: true,
          message: `Dossier client "${tenant.name}" créé avec succès`,
          tenant: {
            id: tenant.id,
            name: tenant.name,
            regime: tenant.regime,
            formeJuridique: tenant.formeJuridique,
          },
        },
        { status: 201 }
      );
    } catch (err: any) {
      console.error("[PORTFOLIO] Erreur création dossier:", err);
      return NextResponse.json(
        { error: "INTERNAL_ERROR", message: err.message || "Erreur serveur" },
        { status: 500 }
      );
    }
  },
  { requireTenant: false }
);

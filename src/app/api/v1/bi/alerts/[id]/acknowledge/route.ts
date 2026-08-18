/**
 * POST /api/v1/bi/alerts/:id/acknowledge
 * Acquitter une alerte (la marquer comme lue)
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

export const POST = withTenantGuard(
  async (req: NextRequest, tenantId: string) => {
    try {
      const url = new URL(req.url);
      const pathParts = url.pathname.split("/");
      const alertId = pathParts[pathParts.length - 2]; // Avant '/acknowledge'

      if (!alertId) {
        return NextResponse.json(
          { error: "ID alerte manquant" },
          { status: 400 }
        );
      }

      const alert = await prisma.alert.findUnique({
        where: { id: alertId },
      });

      if (!alert || alert.tenantId !== tenantId) {
        return NextResponse.json(
          { error: "Alerte non trouvée" },
          { status: 404 }
        );
      }

      const updated = await prisma.alert.update({
        where: { id: alertId },
        data: { acknowledged: true },
      });

      return NextResponse.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      console.error("Erreur acquittement alerte:", error);
      return NextResponse.json(
        { error: "Erreur serveur" },
        { status: 500 }
      );
    }
  }
);

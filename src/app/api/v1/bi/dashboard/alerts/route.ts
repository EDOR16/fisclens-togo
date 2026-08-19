export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/bi/dashboard/alerts
 * Dashboard Alertes : chute ventes, marge négative, encours dépassé, écart compta
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

export const GET = withTenantGuard(async (req: NextRequest, { tenantId }: { tenantId: string }) => {
  try {
    // Récupérer toutes les alertes non acquittées
    const alerts = await prisma.alert.findMany({
      where: {
        tenantId,
        acknowledged: false,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Générer alertes dynamiques

    // 1. Détection chute de ventes produit
    const sales = await prisma.sale.findMany({
      where: { tenantId },
      include: { product: true },
      orderBy: { date: "desc" },
    });

    const productSalesVolume = new Map<string, { current: number; previous: number }>();
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    for (const sale of sales) {
      const saleDate = new Date(sale.date);
      const productCode = sale.product.code;

      if (!productSalesVolume.has(productCode)) {
        productSalesVolume.set(productCode, { current: 0, previous: 0 });
      }

      const vol = productSalesVolume.get(productCode)!;
      if (saleDate >= thirtyDaysAgo) {
        vol.current += sale.quantity;
      } else if (saleDate >= sixtyDaysAgo) {
        vol.previous += sale.quantity;
      }
    }

    const volumeDropAlerts = [];
    for (const [code, vol] of productSalesVolume.entries()) {
      if (vol.previous > 0) {
        const change = ((vol.current - vol.previous) / vol.previous) * 100;
        if (change < -30) {
          // Chute > 30%
          volumeDropAlerts.push({
            type: "VENTE_CHUTE",
            severity: "CRITICAL",
            title: `Chute de ventes : ${code}`,
            message: `Baisse de ${Math.abs(Math.round(change))}% du volume de ventes du produit ${code}`,
          });
        }
      }
    }

    // 2. Détection marge négative
    const negativeMarginAlerts = [];
    const products = await prisma.productRef.findMany({
      where: { tenantId },
    });

    for (const product of products) {
      if (product.costAchatHT > product.priceVentHT) {
        negativeMarginAlerts.push({
          type: "MARGE_NEG",
          severity: "WARNING",
          title: `Marge négative : ${product.designation}`,
          message: `Coût d'achat (${product.costAchatHT} FCFA) > Prix de vente (${product.priceVentHT} FCFA)`,
        });
      }
    }

    // 3. Détection encours dépassé
    const encourseAlerts = [];
    const clients = await prisma.clientRef.findMany({
      where: { tenantId },
    });

    for (const client of clients) {
      const clientSales = await prisma.sale.findMany({
        where: { clientId: client.id, tenantId },
      });
      const totalAmount = clientSales.reduce((sum, s) => sum + s.montantTTC, 0);

      if (totalAmount > client.encoursAutorise) {
        encourseAlerts.push({
          type: "ENCOURS_DEPASSE",
          severity: "WARNING",
          title: `Encours dépassé : ${client.name}`,
          message: `Encours ${totalAmount} FCFA > limite ${client.encoursAutorise} FCFA`,
        });
      }
    }

    // Créer les alertes en base
    for (const alert of [...volumeDropAlerts, ...negativeMarginAlerts, ...encourseAlerts]) {
      // Vérifier si alerte similaire existe déjà
      const existing = await prisma.alert.findFirst({
        where: {
          tenantId,
          type: alert.type,
          acknowledged: false,
        },
      });

      if (!existing) {
        await prisma.alert.create({
          data: {
            tenantId,
            ...alert,
            acknowledged: false,
          },
        });
      }
    }

    // Récupérer toutes les alertes après création
    const allAlerts = await prisma.alert.findMany({
      where: {
        tenantId,
        acknowledged: false,
      },
      orderBy: { createdAt: "desc" },
    });

    // Regrouper par sévérité
    const summary = {
      critical: allAlerts.filter((a) => a.severity === "CRITICAL").length,
      warning: allAlerts.filter((a) => a.severity === "WARNING").length,
      info: allAlerts.filter((a) => a.severity === "INFO").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        alerts: allAlerts.slice(0, 20),
        summary,
      },
    });
  } catch (error) {
    console.error("Erreur dashboard alertes:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
});

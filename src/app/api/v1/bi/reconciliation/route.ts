export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/bi/reconciliation
 * Réconciliation comptable : BI vs compta
 * Vérifie cohérence CA BI (701) vs achats (601)
 * Génère une alerte si écart > seuil
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { withTenantGuard, GuardContext } from "@/lib/server/with-guard";

interface ReconciliationResult {
  salesBI: number; // Total CA BI (ventes)
  purchasesBI: number; // Total achats BI
  account701: number; // Solde du compte 701 (ventes)
  account601: number; // Solde du compte 601 (achats)
  discrepancySales: number; // Écart CA
  discrepancyPurchases: number; // Écart achats
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
}

export const GET = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    // Paramètre optionnel : seuil d'écart (en % du CA, défaut 5%)
    const url = new URL(req.url);
    const thresholdPercent = parseInt(url.searchParams.get("threshold") || "5", 10);

    // Calculs depuis les données BI
    const salesData = await prisma.sale.aggregate({
      where: { tenantId },
      _sum: { montantTTC: true },
    });
    const salesBITotal = salesData._sum.montantTTC || 0;

    const purchasesData = await prisma.purchase.aggregate({
      where: { tenantId },
      _sum: { montantTTC: true },
    });
    const purchasesBITotal = purchasesData._sum.montantTTC || 0;

    // Calculs directs en SQL depuis la comptabilité (comptes 701 et 601)
    const comptaTotals = await prisma.$queryRaw<Array<{ total701: bigint; total601: bigint }>>`
      SELECT
        COALESCE(SUM(CASE WHEN el."accountCode" LIKE '701%' THEN el.credit ELSE 0 END), 0)::bigint AS "total701",
        COALESCE(SUM(CASE WHEN el."accountCode" LIKE '601%' THEN el.debit ELSE 0 END), 0)::bigint AS "total601"
      FROM ecriture_lines el
      JOIN ecritures e ON el."ecritureId" = e.id
      WHERE e."tenantId" = ${tenantId}
        AND e.status IN ('VALIDE', 'CLOTURE')
    `;

    const account701Total = Number(comptaTotals[0]?.total701 || 0);
    const account601Total = Number(comptaTotals[0]?.total601 || 0);

    // Écarts
    const discrepancySales = Math.abs(salesBITotal - account701Total);
    const discrepancyPurchases = Math.abs(purchasesBITotal - account601Total);

    // Seuil absolu
    const thresholdSales = (salesBITotal * thresholdPercent) / 100;
    const thresholdPurchases = (purchasesBITotal * thresholdPercent) / 100;

    const alerts = [];

    if (discrepancySales > thresholdSales) {
      alerts.push({
        type: "ECART_COMPTA",
        severity: "CRITICAL",
        message: `Écart CA détecté: BI ${salesBITotal} FCFA vs Compte 701 ${account701Total} FCFA (écart: ${discrepancySales} FCFA)`,
      });
    }

    if (discrepancyPurchases > thresholdPurchases) {
      alerts.push({
        type: "ECART_COMPTA",
        severity: "CRITICAL",
        message: `Écart achats détecté: BI ${purchasesBITotal} FCFA vs Compte 601 ${account601Total} FCFA (écart: ${discrepancyPurchases} FCFA)`,
      });
    }

    // Créer les alertes en base
    for (const alert of alerts) {
      await prisma.alert.create({
        data: {
          tenantId,
          type: alert.type,
          severity: alert.severity,
          title: `Anomalie de réconciliation`,
          message: alert.message,
          acknowledged: false,
        },
      });
    }

    const result: ReconciliationResult = {
      salesBI: salesBITotal,
      purchasesBI: purchasesBITotal,
      account701: account701Total,
      account601: account601Total,
      discrepancySales,
      discrepancyPurchases,
      alerts,
    };

    return NextResponse.json({
      success: alerts.length === 0,
      data: result,
    });
  } catch (error) {
    console.error("Erreur réconciliation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
});

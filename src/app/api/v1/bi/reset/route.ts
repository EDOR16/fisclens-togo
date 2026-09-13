export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/bi/reset
 * Supprime toutes les données BI (ventes, achats, clients, produits) du tenant.
 * Utilisé pour un réimport propre depuis l'UI.
 */
import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, GuardContext } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

export const DELETE = withTenantGuard(async (_req: NextRequest, { tenantId }: GuardContext) => {
  // Ordre FK : d'abord les enfants (sale, purchase), puis les parents (clientRef, productRef)
  const [salesResult, purchasesResult] = await Promise.all([
    prisma.sale.deleteMany({ where: { tenantId } }),
    prisma.purchase.deleteMany({ where: { tenantId } }),
  ]);

  const [clientsResult, productsResult] = await Promise.all([
    prisma.clientRef.deleteMany({ where: { tenantId } }),
    prisma.productRef.deleteMany({ where: { tenantId } }),
  ]);

  return NextResponse.json({
    success: true,
    message: "Données BI réinitialisées avec succès.",
    deleted: {
      sales: salesResult.count,
      purchases: purchasesResult.count,
      clients: clientsResult.count,
      products: productsResult.count,
    },
  });
});

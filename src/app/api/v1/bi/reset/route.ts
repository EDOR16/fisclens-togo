/**
 * DELETE /api/v1/bi/reset
 * Supprime toutes les données BI (ventes, achats, clients, produits) du tenant.
 * Utilisé pour un réimport propre depuis l'UI.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;

  // Ordre FK : d'abord les enfants (sale, purchase), puis les parents (clientRef, productRef)
  const [sales, purchases, clients, products] = await Promise.all([
    prisma.sale.deleteMany({ where: { tenantId } }),
    prisma.purchase.deleteMany({ where: { tenantId } }),
  ]).then(async ([s, p]) => {
    const [c, pr] = await Promise.all([
      prisma.clientRef.deleteMany({ where: { tenantId } }),
      prisma.productRef.deleteMany({ where: { tenantId } }),
    ]);
    return [s, p, c, pr];
  });

  return NextResponse.json({
    success: true,
    message: "Données BI réinitialisées avec succès.",
    deleted: {
      sales: sales.count,
      purchases: purchases.count,
      clients: clients.count,
      products: products.count,
    },
  });
}

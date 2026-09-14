/**
 * Chargement du contexte pour les règles niveau facture (Section 7).
 * Centralise les 3 agrégations nécessaires à runInvoiceLevelDetection :
 *   1. Hashes SHA-256 des images déjà importées
 *   2. Mapping NIF -> Nom canonique (extensible)
 *   3. Historique des montants HT par fournisseur
 */

import { prisma } from "@/lib/server/prisma";

export interface InvoiceDetectionContext {
  hashesExistants: Set<string>;
  nifToNomConnus: Map<string, string>;
  historiqueParFournisseur: Map<string, number[]>;
}

/**
 * Charge le contexte depuis la base pour un tenant donné.
 * Toutes les requêtes sont scopées au tenant (isolation multi-tenant stricte).
 */
export async function loadInvoiceDetectionContext(
  tenantId: string
): Promise<InvoiceDetectionContext> {
  const [hashes, allPurchases, allSales] = await Promise.all([
    prisma.factureImageHash.findMany({
      where: { tenantId },
      select: { hashSha256: true },
    }),

    prisma.purchase.findMany({
      where: { tenantId },
      select: { supplierId: true, montantHT: true },
    }),

    prisma.sale.findMany({
      where: { tenantId },
      select: {
        montantHT: true,
        client: { select: { code: true, name: true } },
      },
    }),
  ]);

  // 1. Set des hashes existants
  const hashesExistants = new Set(hashes.map((h) => h.hashSha256));

  // 2. Mapping NIF -> Nom (vide pour l'instant, extensible via ClientRef.nif)
  const nifToNomConnus = new Map<string, string>();

  // 3. Historique des montants HT par fournisseur + par nom de client
  const historiqueParFournisseur = new Map<string, number[]>();

  for (const p of allPurchases) {
    if (!p.supplierId) continue;
    const list = historiqueParFournisseur.get(p.supplierId) ?? [];
    list.push(p.montantHT);
    historiqueParFournisseur.set(p.supplierId, list);
  }

  for (const s of allSales) {
    const key = s.client?.name;
    if (!key) continue;
    const list = historiqueParFournisseur.get(key) ?? [];
    list.push(s.montantHT);
    historiqueParFournisseur.set(key, list);
  }

  return { hashesExistants, nifToNomConnus, historiqueParFournisseur };
}
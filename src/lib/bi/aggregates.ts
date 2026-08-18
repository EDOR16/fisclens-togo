/**
 * Utilitaires d'agrégation et calcul de KPIs pour le BI
 * Agrégats SQL matérialisés pour les dashboards
 */

import { prisma } from "@/lib/server/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardKPIs {
  ca: number; // Chiffre d'affaires total (HT)
  margeBrute: number; // Marge brute (CA - coûts d'achat)
  margePercent: number; // Marge en %
  clientsActifs: number; // Nombre de clients avec ventes
  trésorerie: number; // Montant total des ventes (TTC)
  tendanceVsN1: number; // Tendance vs N-1 en %
}

export interface TopProduct {
  code: string;
  designation: string;
  volume: number; // Quantité totale
  ca: number; // CA HT
  marge: number; // Marge absolue
  margePercent: number; // Marge %
}

export interface RFMSegment {
  clientCode: string;
  clientName: string;
  recency: number; // Jours depuis dernière vente
  frequency: number; // Nombre de ventes
  monetary: number; // CA total
  rfmScore: string; // VIP, Normal, At Risk, etc
}

export interface ForecastMetrics {
  caProjected: number; // CA projeté
  trésorerieProjected: number; // Trésorerie projetée 90j
  mape: number; // Mean Absolute Percentage Error %
}

// ---------------------------------------------------------------------------
// KPIs Globaux
// ---------------------------------------------------------------------------

export async function calculateGlobalKPIs(tenantId: string): Promise<DashboardKPIs> {
  // CA HT (somme des montantHT des ventes)
  const salesAgg = await prisma.sale.aggregate({
    where: { tenantId },
    _sum: { montantHT: true },
  });
  const ca = salesAgg._sum.montantHT || 0;

  // Coûts d'achat (somme des coûts d'achat pour les produits vendus)
  const purchases = await prisma.purchase.findMany({
    where: { tenantId },
    select: { productId: true, montantHT: true },
  });
  const costAchat = purchases.reduce((sum, p) => sum + p.montantHT, 0);

  const margeBrute = ca - costAchat;
  const margePercent = ca > 0 ? Math.round((margeBrute / ca) * 100) : 0;

  // Clients actifs
  const clientsActifs = await prisma.sale.findMany({
    where: { tenantId },
    distinct: ["clientId"],
    select: { clientId: true },
  });

  // Trésorerie (montant TTC des ventes)
  const trésorerieAgg = await prisma.sale.aggregate({
    where: { tenantId },
    _sum: { montantTTC: true },
  });
  const trésorerie = trésorerieAgg._sum.montantTTC || 0;

  return {
    ca,
    margeBrute,
    margePercent,
    clientsActifs: clientsActifs.length,
    trésorerie,
    tendanceVsN1: 0, // À implémenter avec données historiques
  };
}

// ---------------------------------------------------------------------------
// Top Produits
// ---------------------------------------------------------------------------

export async function getTopProducts(
  tenantId: string,
  limit: number = 10
): Promise<TopProduct[]> {
  const sales = await prisma.sale.findMany({
    where: { tenantId },
    include: { product: true },
  });

  // Agréger par produit
  const productAgg = new Map<
    string,
    {
      code: string;
      designation: string;
      totalVolume: number;
      totalCA: number;
      costAchat: number;
    }
  >();

  for (const sale of sales) {
    const key = sale.productId;
    if (!productAgg.has(key)) {
      productAgg.set(key, {
        code: sale.product.code,
        designation: sale.product.designation,
        totalVolume: 0,
        totalCA: 0,
        costAchat: 0,
      });
    }
    const agg = productAgg.get(key)!;
    agg.totalVolume += sale.quantity;
    agg.totalCA += sale.montantHT;
    agg.costAchat += sale.product.costAchatHT * sale.quantity;
  }

  const products = Array.from(productAgg.values())
    .map((agg) => {
      const marge = agg.totalCA - agg.costAchat;
      return {
        code: agg.code,
        designation: agg.designation,
        volume: agg.totalVolume,
        ca: agg.totalCA,
        marge,
        margePercent: agg.totalCA > 0 ? Math.round((marge / agg.totalCA) * 100) : 0,
      };
    })
    .sort((a, b) => b.marge - a.marge)
    .slice(0, limit);

  return products;
}

// ---------------------------------------------------------------------------
// Segmentation RFM (Recency, Frequency, Monetary)
// ---------------------------------------------------------------------------

export async function getRFMSegmentation(
  tenantId: string
): Promise<RFMSegment[]> {
  const sales = await prisma.sale.findMany({
    where: { tenantId },
    include: { client: true },
    orderBy: { date: "desc" },
  });

  const clientAgg = new Map<
    string,
    {
      clientCode: string;
      clientName: string;
      lastDate: string;
      frequency: number;
      monetary: number;
    }
  >();

  for (const sale of sales) {
    const key = sale.clientId;
    if (!clientAgg.has(key)) {
      clientAgg.set(key, {
        clientCode: sale.client.code,
        clientName: sale.client.name,
        lastDate: sale.date,
        frequency: 0,
        monetary: 0,
      });
    }
    const agg = clientAgg.get(key)!;
    agg.frequency += 1;
    agg.monetary += sale.montantTTC;
  }

  const today = new Date();
  const segments = Array.from(clientAgg.values()).map((agg) => {
    const lastDate = new Date(agg.lastDate);
    const recency = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Scoring RFM simple
    let rfmScore = "Normal";
    if (agg.frequency >= 10 && recency <= 30) {
      rfmScore = "VIP";
    } else if (agg.frequency < 3 && recency > 90) {
      rfmScore = "At Risk";
    } else if (agg.monetary > 10000000) {
      rfmScore = "High Value";
    }

    return {
      clientCode: agg.clientCode,
      clientName: agg.clientName,
      recency,
      frequency: agg.frequency,
      monetary: agg.monetary,
      rfmScore,
    };
  });

  return segments.sort((a, b) => b.monetary - a.monetary);
}

// ---------------------------------------------------------------------------
// Top Clients (Pareto)
// ---------------------------------------------------------------------------

export async function getTopClients(
  tenantId: string,
  limit: number = 20
): Promise<Array<{
  clientCode: string;
  clientName: string;
  ca: number;
  weight: number; // % du CA total
}>> {
  const sales = await prisma.sale.findMany({
    where: { tenantId },
    include: { client: true },
  });

  const clientAgg = new Map<
    string,
    { clientCode: string; clientName: string; ca: number }
  >();

  let totalCA = 0;
  for (const sale of sales) {
    const key = sale.clientId;
    if (!clientAgg.has(key)) {
      clientAgg.set(key, {
        clientCode: sale.client.code,
        clientName: sale.client.name,
        ca: 0,
      });
    }
    const agg = clientAgg.get(key)!;
    agg.ca += sale.montantTTC;
    totalCA += sale.montantTTC;
  }

  return Array.from(clientAgg.values())
    .map((agg) => ({
      ...agg,
      weight: totalCA > 0 ? Math.round((agg.ca / totalCA) * 100) : 0,
    }))
    .sort((a, b) => b.ca - a.ca)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Analyse Achats
// ---------------------------------------------------------------------------

export async function getTopSuppliers(
  tenantId: string,
  limit: number = 10
): Promise<Array<{
  supplierId: string;
  totalAmount: number;
  orderCount: number;
}>> {
  const purchases = await prisma.purchase.findMany({
    where: { tenantId },
  });

  const supplierAgg = new Map<
    string,
    { supplierId: string; totalAmount: number; orderCount: number }
  >();

  for (const purchase of purchases) {
    const key = purchase.supplierId;
    if (!supplierAgg.has(key)) {
      supplierAgg.set(key, {
        supplierId: key,
        totalAmount: 0,
        orderCount: 0,
      });
    }
    const agg = supplierAgg.get(key)!;
    agg.totalAmount += purchase.montantTTC;
    agg.orderCount += 1;
  }

  return Array.from(supplierAgg.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Rentabilité par Catégorie
// ---------------------------------------------------------------------------

export async function getProfitabilityByCategory(
  tenantId: string
): Promise<Array<{
  category: string;
  ca: number;
  costAchat: number;
  marge: number;
  margePercent: number;
}>> {
  const sales = await prisma.sale.findMany({
    where: { tenantId },
    include: { product: true },
  });

  const categoryAgg = new Map<
    string,
    { ca: number; costAchat: number }
  >();

  for (const sale of sales) {
    const category = sale.product.category;
    if (!categoryAgg.has(category)) {
      categoryAgg.set(category, { ca: 0, costAchat: 0 });
    }
    const agg = categoryAgg.get(category)!;
    agg.ca += sale.montantHT;
    agg.costAchat += sale.product.costAchatHT * sale.quantity;
  }

  return Array.from(categoryAgg.entries()).map(([category, agg]) => {
    const marge = agg.ca - agg.costAchat;
    return {
      category,
      ca: agg.ca,
      costAchat: agg.costAchat,
      marge,
      margePercent: agg.ca > 0 ? Math.round((marge / agg.ca) * 100) : 0,
    };
  });
}

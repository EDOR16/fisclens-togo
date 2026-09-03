export const dynamic = "force-dynamic";

/**
 * POST /api/v1/bi/seed-demo
 * Injecte un jeu complet de données de test (Produits, Clients, Ventes, Achats)
 * directement dans la base de données du dossier actif (tenant).
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, GuardContext } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

export const POST = withTenantGuard(async (req: NextRequest, { tenantId }: GuardContext) => {
  try {
    // ── 1. Création des Produits de référence ───────────────────────────────
    const productsData = [
      { code: "PRD-001", designation: "Ciment CPJ 45 (Togo)", category: "Matériaux", priceVentHT: 85000, costAchatHT: 65000, margineCible: 24 },
      { code: "PRD-002", designation: "Fer à Béton Ø12 mm", category: "Matériaux", priceVentHT: 450000, costAchatHT: 350000, margineCible: 22 },
      { code: "PRD-003", designation: "Riz Parfumé 25kg", category: "Agroalimentaire", priceVentHT: 19500, costAchatHT: 15000, margineCible: 23 },
      { code: "PRD-004", designation: "Huile Végétale 20L", category: "Agroalimentaire", priceVentHT: 24000, costAchatHT: 18500, margineCible: 23 },
      { code: "PRD-005", designation: "Tissu Pagne Wax Super", category: "Textile", priceVentHT: 45000, costAchatHT: 30000, margineCible: 33 },
      { code: "PRD-006", designation: "Peinture Acrylique 20kg", category: "Chimie & BTP", priceVentHT: 38000, costAchatHT: 26000, margineCible: 32 },
      { code: "PRD-007", designation: "Générateur 5.5 kVA", category: "Équipements", priceVentHT: 680000, costAchatHT: 520000, margineCible: 24 },
      { code: "PRD-008", designation: "Câble Électrique 2.5mm²", category: "Équipements", priceVentHT: 28000, costAchatHT: 19000, margineCible: 32 },
    ];

    const productMap = new Map<string, string>(); // code -> id

    for (const p of productsData) {
      const created = await prisma.productRef.upsert({
        where: { tenantId_code: { tenantId, code: p.code } },
        update: {
          designation: p.designation,
          category: p.category,
          priceVentHT: p.priceVentHT,
          costAchatHT: p.costAchatHT,
          margineCible: p.margineCible,
        },
        create: {
          tenantId,
          code: p.code,
          designation: p.designation,
          category: p.category,
          priceVentHT: p.priceVentHT,
          costAchatHT: p.costAchatHT,
          margineCible: p.margineCible,
        },
      });
      productMap.set(p.code, created.id);
    }

    // ── 2. Création des Clients de référence ────────────────────────────────
    const clientsData = [
      { code: "CLI-001", name: "BTP Lomé Construction", segment: "Entreprise", zoneGeo: "Grand Lomé", encoursAutorise: 15000000 },
      { code: "CLI-002", name: "Supermarché Le Phare", segment: "Grossiste", zoneGeo: "Grand Lomé", encoursAutorise: 8000000 },
      { code: "CLI-003", name: "Quincaillerie Kpalimé Pro", segment: "Détaillant", zoneGeo: "Plateaux", encoursAutorise: 5000000 },
      { code: "CLI-004", name: "Société Commerciale du Nord", segment: "Grossiste", zoneGeo: "Kara", encoursAutorise: 12000000 },
      { code: "CLI-005", name: "Ets Sokodé Distribution", segment: "Détaillant", zoneGeo: "Centrale", encoursAutorise: 4000000 },
      { code: "CLI-006", name: "Savanes Négoce Dapaong", segment: "Grossiste", zoneGeo: "Savanes", encoursAutorise: 7000000 },
      { code: "CLI-007", name: "Quincaillerie Maritime Aného", segment: "Détaillant", zoneGeo: "Maritime", encoursAutorise: 3500000 },
      { code: "CLI-008", name: "ETS Afagnan & Fils", segment: "Détaillant", zoneGeo: "Maritime", encoursAutorise: 2500000 },
    ];

    const clientMap = new Map<string, string>(); // code -> id

    for (const c of clientsData) {
      const created = await prisma.clientRef.upsert({
        where: { tenantId_code: { tenantId, code: c.code } },
        update: {
          name: c.name,
          segment: c.segment,
          zoneGeo: c.zoneGeo,
          encoursAutorise: c.encoursAutorise,
        },
        create: {
          tenantId,
          code: c.code,
          name: c.name,
          segment: c.segment,
          zoneGeo: c.zoneGeo,
          encoursAutorise: c.encoursAutorise,
        },
      });
      clientMap.set(c.code, created.id);
    }

    // ── 3. Suppression éventuelle des anciennes ventes/achats démo pour éviter les doublons
    await prisma.sale.deleteMany({ where: { tenantId } });
    await prisma.purchase.deleteMany({ where: { tenantId } });

    // ── 4. Création des Ventes ──────────────────────────────────────────────
    const salesData = [
      { date: "2026-08-01", refFacture: "FAC-2026-001", clientCode: "CLI-001", productCode: "PRD-001", quantity: 50, puHT: 85000, montantHT: 4250000, tauxTVA: 18, montantTVA: 765000, montantTTC: 5015000 },
      { date: "2026-08-03", refFacture: "FAC-2026-002", clientCode: "CLI-002", productCode: "PRD-003", quantity: 100, puHT: 19500, montantHT: 1950000, tauxTVA: 18, montantTVA: 351000, montantTTC: 2301000 },
      { date: "2026-08-05", refFacture: "FAC-2026-003", clientCode: "CLI-004", productCode: "PRD-002", quantity: 10, puHT: 450000, montantHT: 4500000, tauxTVA: 18, montantTVA: 810000, montantTTC: 5310000 },
      { date: "2026-08-08", refFacture: "FAC-2026-004", clientCode: "CLI-003", productCode: "PRD-006", quantity: 30, puHT: 38000, montantHT: 1140000, tauxTVA: 18, montantTVA: 205200, montantTTC: 1345200 },
      { date: "2026-08-10", refFacture: "FAC-2026-005", clientCode: "CLI-001", productCode: "PRD-007", quantity: 2, puHT: 680000, montantHT: 1360000, tauxTVA: 18, montantTVA: 244800, montantTTC: 1604800 },
      { date: "2026-08-12", refFacture: "FAC-2026-006", clientCode: "CLI-005", productCode: "PRD-004", quantity: 60, puHT: 24000, montantHT: 1440000, tauxTVA: 18, montantTVA: 259200, montantTTC: 1699200 },
      { date: "2026-08-15", refFacture: "FAC-2026-007", clientCode: "CLI-006", productCode: "PRD-005", quantity: 40, puHT: 45000, montantHT: 1800000, tauxTVA: 18, montantTVA: 324000, montantTTC: 2124000 },
      { date: "2026-08-18", refFacture: "FAC-2026-008", clientCode: "CLI-007", productCode: "PRD-008", quantity: 25, puHT: 28000, montantHT: 700000, tauxTVA: 18, montantTVA: 126000, montantTTC: 826000 },
      { date: "2026-08-20", refFacture: "FAC-2026-009", clientCode: "CLI-002", productCode: "PRD-004", quantity: 80, puHT: 24000, montantHT: 1920000, tauxTVA: 18, montantTVA: 345600, montantTTC: 2265600 },
      { date: "2026-08-23", refFacture: "FAC-2026-010", clientCode: "CLI-004", productCode: "PRD-001", quantity: 60, puHT: 85000, montantHT: 5100000, tauxTVA: 18, montantTVA: 918000, montantTTC: 6018000 },
      { date: "2026-08-26", refFacture: "FAC-2026-011", clientCode: "CLI-003", productCode: "PRD-005", quantity: 35, puHT: 45000, montantHT: 1575000, tauxTVA: 18, montantTVA: 283500, montantTTC: 1858500 },
      { date: "2026-08-29", refFacture: "FAC-2026-012", clientCode: "CLI-008", productCode: "PRD-006", quantity: 20, puHT: 38000, montantHT: 760000, tauxTVA: 18, montantTVA: 136800, montantTTC: 896800 },
    ];

    for (const s of salesData) {
      const clientId = clientMap.get(s.clientCode);
      const productId = productMap.get(s.productCode);
      if (clientId && productId) {
        await prisma.sale.create({
          data: {
            tenantId,
            date: s.date,
            refFacture: s.refFacture,
            clientId,
            productId,
            quantity: s.quantity,
            puHT: s.puHT,
            montantHT: s.montantHT,
            tauxTVA: s.tauxTVA,
            montantTVA: s.montantTVA,
            montantTTC: s.montantTTC,
          },
        });
      }
    }

    // ── 5. Création des Achats ──────────────────────────────────────────────
    const purchasesData = [
      { date: "2026-07-25", refCommande: "CMD-2026-001", supplierId: "FOUR-CIMTOGO", productCode: "PRD-001", quantity: 150, puHT: 65000, montantHT: 9750000, tauxTVA: 18, montantTVA: 1755000, montantTTC: 11505000 },
      { date: "2026-07-28", refCommande: "CMD-2026-002", supplierId: "FOUR-SOTOTRAC", productCode: "PRD-002", quantity: 20, puHT: 350000, montantHT: 7000000, tauxTVA: 18, montantTVA: 1260000, montantTTC: 8260000 },
      { date: "2026-08-01", refCommande: "CMD-2026-003", supplierId: "FOUR-AGRO-IMPORT", productCode: "PRD-003", quantity: 200, puHT: 15000, montantHT: 3000000, tauxTVA: 18, montantTVA: 540000, montantTTC: 3540000 },
      { date: "2026-08-05", refCommande: "CMD-2026-004", supplierId: "FOUR-AGRO-IMPORT", productCode: "PRD-004", quantity: 180, puHT: 18500, montantHT: 3330000, tauxTVA: 18, montantTVA: 599400, montantTTC: 3929400 },
      { date: "2026-08-08", refCommande: "CMD-2026-005", supplierId: "FOUR-TOGO-TEXTILE", productCode: "PRD-005", quantity: 100, puHT: 30000, montantHT: 3000000, tauxTVA: 18, montantTVA: 540000, montantTTC: 3540000 },
      { date: "2026-08-12", refCommande: "CMD-2026-006", supplierId: "FOUR-COLORAMA", productCode: "PRD-006", quantity: 80, puHT: 26000, montantHT: 2080000, tauxTVA: 18, montantTVA: 374400, montantTTC: 2454400 },
      { date: "2026-08-15", refCommande: "CMD-2026-007", supplierId: "FOUR-ELECTRO-LOME", productCode: "PRD-007", quantity: 5, puHT: 520000, montantHT: 2600000, tauxTVA: 18, montantTVA: 468000, montantTTC: 3068000 },
      { date: "2026-08-18", refCommande: "CMD-2026-008", supplierId: "FOUR-ELECTRO-LOME", productCode: "PRD-008", quantity: 70, puHT: 19000, montantHT: 1330000, tauxTVA: 18, montantTVA: 239400, montantTTC: 1569400 },
    ];

    for (const p of purchasesData) {
      const productId = productMap.get(p.productCode);
      if (productId) {
        await prisma.purchase.create({
          data: {
            tenantId,
            date: p.date,
            refCommande: p.refCommande,
            supplierId: p.supplierId,
            productId,
            quantity: p.quantity,
            puHT: p.puHT,
            montantHT: p.montantHT,
            tauxTVA: p.tauxTVA,
            montantTVA: p.montantTVA,
            montantTTC: p.montantTTC,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Données de test injectées avec succès ! (8 produits, 8 clients, 12 ventes, 8 achats)",
      counts: {
        products: productsData.length,
        clients: clientsData.length,
        sales: salesData.length,
        purchases: purchasesData.length,
      },
    });
  } catch (error) {
    console.error("[BI] Erreur lors de l'injection des données de démo:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création des données de test" },
      { status: 500 }
    );
  }
});

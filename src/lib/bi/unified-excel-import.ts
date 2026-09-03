/**
 * Parser et Importateur Excel Unifié pour le Workspace BI
 * - Accepte un classeur unique multi-onglets (Produits, Clients, Ventes, Achats)
 * - Tolérant sur la casse et les accents des noms de colonnes
 * - Crée automatiquement les entités manquantes (Clients / Produits) pour éviter les rejets
 */

import { read, utils } from "xlsx";
import { prisma } from "@/lib/server/prisma";

// ─── Normalisation des clés d'objets ──────────────────────────────────────────

function normalizeRow(row: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    // Supprimer accents, espaces et minuscules
    const cleanKey = key
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s_\-\.]/g, "");
    normalized[cleanKey] = value;
  }
  return normalized;
}

function parseNumber(val: any, fallback = 0): number {
  if (val === undefined || val === null || val === "") return fallback;
  const cleaned = String(val).replace(/[\s,]/g, (m) => (m === "," ? "." : ""));
  const num = Number(cleaned);
  return isNaN(num) ? fallback : Math.round(num);
}

function parseDate(val: any): string {
  if (!val) return new Date().toISOString().split("T")[0];
  if (val instanceof Date) return val.toISOString().split("T")[0];

  // Si c'est un numéro de série Excel (ex: 45142)
  if (typeof val === "number") {
    const d = new Date((val - (25567 + 2)) * 86400 * 1000);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }

  const str = String(val).trim();
  // Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Format DD/MM/YYYY
  const parts = str.split(/[\/\-\.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }

  return new Date().toISOString().split("T")[0];
}

// ─── Importation Unifiée ──────────────────────────────────────────────────────

export interface UnifiedImportReport {
  success: boolean;
  message: string;
  counts: {
    products: number;
    clients: number;
    sales: number;
    purchases: number;
  };
  warnings: string[];
}

export async function processUnifiedExcel(
  buffer: Buffer,
  tenantId: string
): Promise<UnifiedImportReport> {
  const workbook = read(buffer, { type: "buffer", cellDates: true });
  const sheetNames = workbook.SheetNames;

  if (!sheetNames.length) {
    throw new Error("Le fichier Excel est vide.");
  }

  const report: UnifiedImportReport = {
    success: true,
    message: "",
    counts: { products: 0, clients: 0, sales: 0, purchases: 0 },
    warnings: [],
  };

  const productMap = new Map<string, string>(); // code -> id
  const clientMap = new Map<string, string>(); // code -> id

  // Charger les clients et produits existants en base
  const existingProducts = await prisma.productRef.findMany({ where: { tenantId } });
  existingProducts.forEach((p) => productMap.set(p.code.toUpperCase(), p.id));

  const existingClients = await prisma.clientRef.findMany({ where: { tenantId } });
  existingClients.forEach((c) => clientMap.set(c.code.toUpperCase(), c.id));

  // Identifier les feuilles
  const getRowsForSheet = (candidates: string[]) => {
    for (const cand of candidates) {
      const foundName = sheetNames.find(
        (s) => s.toLowerCase().trim() === cand.toLowerCase()
      );
      if (foundName) {
        const sheet = workbook.Sheets[foundName];
        if (sheet) {
          const rawRows = utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
          return rawRows.map(normalizeRow);
        }
      }
    }
    return null;
  };

  // ── 1. TRAITEMENT PRODUITS ────────────────────────────────────────────────
  const productRows = getRowsForSheet(["produits", "produit", "products", "product", "catalogue", "articles"]);
  if (productRows && productRows.length) {
    for (const r of productRows) {
      const code = String(r.code || r.codeproduit || r.ref || r.reference || "").trim().toUpperCase();
      if (!code) continue;

      const designation = String(r.designation || r.nom || r.libelle || code).trim();
      const category = String(r.categorie || r.category || r.famille || "Général").trim();
      const priceVentHT = parseNumber(r.prixventeht || r.prixvente || r.puht || r.prix, 1000);
      const costAchatHT = parseNumber(r.coutachatht || r.coutachat || r.prixachat || r.cout, Math.round(priceVentHT * 0.7));
      const margineCible = parseNumber(r.margecible || r.marge, 25);

      const p = await prisma.productRef.upsert({
        where: { tenantId_code: { tenantId, code } },
        update: { designation, category, priceVentHT, costAchatHT, margineCible },
        create: { tenantId, code, designation, category, priceVentHT, costAchatHT, margineCible },
      });
      productMap.set(code, p.id);
      report.counts.products++;
    }
  }

  // ── 2. TRAITEMENT CLIENTS ─────────────────────────────────────────────────
  const clientRows = getRowsForSheet(["clients", "client", "customers", "customer", "tiers"]);
  if (clientRows && clientRows.length) {
    for (const r of clientRows) {
      const code = String(r.code || r.codeclient || r.ref || r.reference || "").trim().toUpperCase();
      if (!code) continue;

      const name = String(r.nom || r.name || r.client || r.raisonsociale || code).trim();
      const segment = String(r.segment || r.categorie || r.type || "Standard").trim();
      const zoneGeo = String(r.zonegeo || r.zone || r.ville || r.region || "Lomé").trim();
      const encoursAutorise = parseNumber(r.encoursautorise || r.encours || r.plafond, 5000000);

      const c = await prisma.clientRef.upsert({
        where: { tenantId_code: { tenantId, code } },
        update: { name, segment, zoneGeo, encoursAutorise },
        create: { tenantId, code, name, segment, zoneGeo, encoursAutorise },
      });
      clientMap.set(code, c.id);
      report.counts.clients++;
    }
  }

  // ── 3. TRAITEMENT ACHATS ──────────────────────────────────────────────────
  const purchaseRows = getRowsForSheet(["achats", "achat", "purchases", "purchase", "commandes"]);
  if (purchaseRows && purchaseRows.length) {
    for (const [idx, r] of purchaseRows.entries()) {
      const date = parseDate(r.date);
      const refCommande = String(r.refcommande || r.ref || r.numerocommande || `CMD-${idx + 1}`).trim();
      const supplierId = String(r.codefournisseur || r.fournisseur || r.supplier || "FOUR-DIVERS").trim();
      const productCode = String(r.codearticle || r.codeproduit || r.produit || r.code || "PRD-GEN").trim().toUpperCase();

      // Si le produit n'existe pas encore, le créer à la volée !
      let productId = productMap.get(productCode);
      if (!productId) {
        const newProd = await prisma.productRef.upsert({
          where: { tenantId_code: { tenantId, code: productCode } },
          update: {},
          create: {
            tenantId,
            code: productCode,
            designation: `Produit ${productCode}`,
            category: "Général",
            priceVentHT: 10000,
            costAchatHT: 7000,
            margineCible: 30,
          },
        });
        productId = newProd.id;
        productMap.set(productCode, productId);
        report.counts.products++;
      }

      const quantity = Math.max(1, parseNumber(r.quantite || r.qte || r.nombre, 1));
      const puHT = parseNumber(r.puht || r.prixunitaire || r.prix, 5000);
      const montantHT = parseNumber(r.montantht || r.totalht, quantity * puHT);
      const tauxTVA = parseNumber(r.tauxtva || r.tva, 18);
      const montantTVA = parseNumber(r.montanttva, Math.round((montantHT * tauxTVA) / 100));
      const montantTTC = parseNumber(r.montantttc || r.totalttc, montantHT + montantTVA);

      await prisma.purchase.create({
        data: {
          tenantId,
          date,
          refCommande,
          supplierId,
          productId,
          quantity,
          puHT,
          montantHT,
          tauxTVA,
          montantTVA,
          montantTTC,
        },
      });
      report.counts.purchases++;
    }
  }

  // ── 4. TRAITEMENT VENTES ──────────────────────────────────────────────────
  // Si la feuille "Ventes" existe OU si le classeur n'a qu'une seule feuille non encore traitée
  let saleRows = getRowsForSheet(["ventes", "vente", "sales", "sale", "factures", "chiffredaffaires"]);
  if (!saleRows && sheetNames.length === 1 && !productRows && !clientRows && !purchaseRows) {
    // Cas d'un fichier simple contenant directement les ventes
    const singleSheet = workbook.Sheets[sheetNames[0]];
    if (singleSheet) {
      saleRows = utils.sheet_to_json<Record<string, any>>(singleSheet, { defval: "" }).map(normalizeRow);
    }
  }

  if (saleRows && saleRows.length) {
    for (const [idx, r] of saleRows.entries()) {
      const date = parseDate(r.date);
      const refFacture = String(r.reffacture || r.ref || r.numerofacture || `FAC-${idx + 1}`).trim();
      const clientCode = String(r.codeclient || r.client || r.code || "CLI-DIVERS").trim().toUpperCase();
      const productCode = String(r.codeproduit || r.produit || r.article || "PRD-GEN").trim().toUpperCase();

      // Création automatique du client à la volée s'il n'existe pas
      let clientId = clientMap.get(clientCode);
      if (!clientId) {
        const newClient = await prisma.clientRef.upsert({
          where: { tenantId_code: { tenantId, code: clientCode } },
          update: {},
          create: {
            tenantId,
            code: clientCode,
            name: `Client ${clientCode}`,
            segment: "Standard",
            zoneGeo: "Grand Lomé",
            encoursAutorise: 5000000,
          },
        });
        clientId = newClient.id;
        clientMap.set(clientCode, clientId);
        report.counts.clients++;
      }

      // Création automatique du produit à la volée s'il n'existe pas
      let productId = productMap.get(productCode);
      if (!productId) {
        const newProd = await prisma.productRef.upsert({
          where: { tenantId_code: { tenantId, code: productCode } },
          update: {},
          create: {
            tenantId,
            code: productCode,
            designation: `Article ${productCode}`,
            category: "Général",
            priceVentHT: 15000,
            costAchatHT: 10000,
            margineCible: 33,
          },
        });
        productId = newProd.id;
        productMap.set(productCode, productId);
        report.counts.products++;
      }

      const quantity = Math.max(1, parseNumber(r.quantite || r.qte || r.nombre, 1));
      const puHT = parseNumber(r.puht || r.prixunitaire || r.prix, 10000);
      const montantHT = parseNumber(r.montantht || r.totalht, quantity * puHT);
      const tauxTVA = parseNumber(r.tauxtva || r.tva, 18);
      const montantTVA = parseNumber(r.montanttva, Math.round((montantHT * tauxTVA) / 100));
      const montantTTC = parseNumber(r.montantttc || r.totalttc, montantHT + montantTVA);

      await prisma.sale.create({
        data: {
          tenantId,
          date,
          refFacture,
          clientId,
          productId,
          quantity,
          puHT,
          montantHT,
          tauxTVA,
          montantTVA,
          montantTTC,
        },
      });
      report.counts.sales++;
    }
  }

  const totalImported =
    report.counts.products + report.counts.clients + report.counts.sales + report.counts.purchases;

  if (totalImported === 0) {
    throw new Error(
      "Aucune ligne valide trouvée dans le fichier Excel. Assurez-vous que vos colonnes ont des en-têtes (ex: date, refFacture, codeClient, codeProduit, montantHT...)"
    );
  }

  report.message = `Import réussi : ${report.counts.sales} ventes, ${report.counts.purchases} achats, ${report.counts.products} produits et ${report.counts.clients} clients enregistrés !`;
  return report;
}

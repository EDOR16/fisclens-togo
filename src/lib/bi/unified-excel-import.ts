/**
 * Parser et Importateur Excel Unifié pour le Workspace BI
 * - Accepte un classeur unique multi-onglets (Produits, Clients, Ventes, Achats)
 * - Tolérant sur la casse et les accents des noms de colonnes
 * - Crée automatiquement les entités manquantes (Clients / Produits) pour éviter les rejets
 * - Insertions en batch (createMany) pour les gros volumes
 */

import { read, utils } from "xlsx";
import { prisma } from "@/lib/server/prisma";
import { normalizeTogoRegion } from "@/lib/bi/togo-regions";

// ─── Taille des lots d'insertion ───────────────────────────────────────────
const BATCH_SIZE = 1000;

// ─── Normalisation des clés d'objets ───────────────────────────────────────

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
  if (typeof val === "number") return isNaN(val) ? fallback : Math.round(val);
  let str = String(val).trim().replace(/\s/g, "");
  if (str.includes(",") && str.includes(".")) {
    if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      str = str.replace(/,/g, "");
    }
  } else if (str.includes(",")) {
    str = str.replace(",", ".");
  }
  const num = Number(str);
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

/** Insérer un tableau en lots de BATCH_SIZE via createMany */
async function insertInBatches<T extends object>(
  items: T[],
  inserter: (batch: T[]) => Promise<any>
): Promise<void> {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    await inserter(items.slice(i, i + BATCH_SIZE));
  }
}

// ─── Importation Unifiée ───────────────────────────────────────────────────

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
  const workbook = read(buffer, {
    type: "buffer",
    cellDates: false,
    dense: true,
    cellStyles: false,
    cellFormula: false,
    cellHTML: false,
  });
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

  // ── PURGE : on efface les données BI précédentes pour éviter les doublons ──
  // Ordre : Sales/Purchases en premier (FK vers clientRef/productRef), puis refs
  await prisma.sale.deleteMany({ where: { tenantId } });
  await prisma.purchase.deleteMany({ where: { tenantId } });
  await prisma.clientRef.deleteMany({ where: { tenantId } });
  await prisma.productRef.deleteMany({ where: { tenantId } });

  const productMap = new Map<string, string>(); // code -> id
  const clientMap = new Map<string, string>(); // code -> id

  // Identifier les feuilles
  const getRowsForSheet = (candidates: string[]) => {
    for (const cand of candidates) {
      const candNorm = cand
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s_\-\.]/g, "");

      const foundName = sheetNames.find((s) => {
        const sNorm = s
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[\s_\-\.]/g, "");
        return sNorm === candNorm || sNorm.includes(candNorm) || candNorm.includes(sNorm);
      });

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

  // ── 1. TRAITEMENT PRODUITS ───────────────────────────────────────────────
  const productRows = getRowsForSheet([
    "catalogue_produits",
    "catalogueproduits",
    "produits",
    "produit",
    "products",
    "product",
    "catalogue",
    "articles",
  ]);
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

  // ── 2. TRAITEMENT CLIENTS ────────────────────────────────────────────────
  const clientRows = getRowsForSheet([
    "repertoire_clients",
    "repertoireclients",
    "clients",
    "client",
    "customers",
    "customer",
    "tiers",
  ]);
  if (clientRows && clientRows.length) {
    for (const r of clientRows) {
      const code = String(r.code || r.codeclient || r.ref || r.reference || "").trim().toUpperCase();
      if (!code) continue;

      const name = String(r.nom || r.name || r.client || r.raisonsociale || code).trim();
      const segment = String(r.segment || r.categorie || r.type || "Standard").trim();
      const rawZone = String(r.zonegeo || r.zone || r.ville || r.region || "Maritime").trim();
      const zoneGeo = normalizeTogoRegion(rawZone);
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

  // ── 3. TRAITEMENT ACHATS ─────────────────────────────────────────────────
  const purchaseRows = getRowsForSheet([
    "achats",
    "achat",
    "purchases",
    "purchase",
    "commandes",
  ]);
  if (purchaseRows && purchaseRows.length) {
    // Passe 1 : résolution des produits manquants (création en lot)
    const newProductCodes = new Set<string>();
    for (const r of purchaseRows) {
      const productCode = String(r.codearticle || r.codeproduit || r.produit || r.code || "PRD-GEN").trim().toUpperCase();
      if (!productMap.has(productCode)) newProductCodes.add(productCode);
    }
    if (newProductCodes.size > 0) {
      const toCreate = Array.from(newProductCodes).map((code) => ({
        tenantId,
        code,
        designation: `Produit ${code}`,
        category: "Général",
        priceVentHT: 10000,
        costAchatHT: 7000,
        margineCible: 30,
      }));
      await prisma.productRef.createMany({ data: toCreate, skipDuplicates: true });
      const created = await prisma.productRef.findMany({
        where: { tenantId, code: { in: Array.from(newProductCodes) } },
        select: { id: true, code: true },
      });
      for (const p of created) productMap.set(p.code, p.id);
      report.counts.products += created.length;
    }

    // Passe 2 : construction du batch
    type PurchaseData = {
      tenantId: string; date: string; refCommande: string; supplierId: string;
      productId: string; quantity: number; puHT: number; montantHT: number;
      tauxTVA: number; montantTVA: number; montantTTC: number;
    };
    const purchaseBatch: PurchaseData[] = [];

    for (const [idx, r] of purchaseRows.entries()) {
      const date = parseDate(r.date);
      const refCommande = String(r.refcommande || r.ref || r.numerocommande || `CMD-${idx + 1}`).trim();
      const supplierId = String(r.codefournisseur || r.fournisseur || r.supplier || "FOUR-DIVERS").trim();
      const productCode = String(r.codearticle || r.codeproduit || r.produit || r.code || "PRD-GEN").trim().toUpperCase();
      const productId = productMap.get(productCode)!;

      const quantity = Math.max(1, parseNumber(r.quantite || r.qte || r.nombre, 1));
      const puHT = parseNumber(r.puht || r.prixunitaire || r.prix, 5000);
      const montantHT = parseNumber(r.montantht || r.totalht, quantity * puHT);
      const tauxTVA = parseNumber(r.tauxtva || r.tva, 18);
      const montantTVA = parseNumber(r.montanttva, Math.round((montantHT * tauxTVA) / 100));
      const montantTTC = parseNumber(r.montantttc || r.totalttc, montantHT + montantTVA);

      purchaseBatch.push({ tenantId, date, refCommande, supplierId, productId, quantity, puHT, montantHT, tauxTVA, montantTVA, montantTTC });
    }

    // Passe 3 : insertion en lots
    await insertInBatches(purchaseBatch, (batch) =>
      prisma.purchase.createMany({ data: batch, skipDuplicates: false })
    );
    report.counts.purchases += purchaseBatch.length;
  }

  // ── 4. TRAITEMENT VENTES ─────────────────────────────────────────────────
  // Si la feuille "Ventes" existe OU si le classeur n'a qu'une seule feuille non encore traitée
  let saleRows = getRowsForSheet([
    "ventes",
    "vente",
    "sales",
    "sale",
    "factures",
    "chiffredaffaires",
  ]);
  if (!saleRows && sheetNames.length === 1 && !productRows && !clientRows && !purchaseRows) {
    // Cas d'un fichier simple contenant directement les ventes
    const singleSheet = workbook.Sheets[sheetNames[0]];
    if (singleSheet) {
      saleRows = utils.sheet_to_json<Record<string, any>>(singleSheet, { defval: "" }).map(normalizeRow);
    }
  }

  if (saleRows && saleRows.length) {
    // Passe 1 : résolution des clients/produits manquants (création en lot)
    const newClientCodes = new Set<string>();
    const newSaleProductCodes = new Set<string>();
    const zoneByClientCode = new Map<string, string>();

    for (const r of saleRows) {
      const clientCode = String(r.codeClient || r.codeclient || r.client || r.code || "CLI-DIVERS").trim().toUpperCase();
      const productCode = String(r.codeproduit || r.produit || r.article || "PRD-GEN").trim().toUpperCase();
      if (!clientMap.has(clientCode)) {
        newClientCodes.add(clientCode);
        if (!zoneByClientCode.has(clientCode)) {
          const saleZone = String(r.zonegeo || r.zone || r.ville || r.region || "").trim();
          zoneByClientCode.set(clientCode, saleZone ? normalizeTogoRegion(saleZone) : "Maritime");
        }
      }
      if (!productMap.has(productCode)) newSaleProductCodes.add(productCode);
    }

    if (newClientCodes.size > 0) {
      const toCreateClients = Array.from(newClientCodes).map((code) => ({
        tenantId,
        code,
        name: `Client ${code}`,
        segment: "Standard",
        zoneGeo: zoneByClientCode.get(code) ?? "Maritime",
        encoursAutorise: 5000000,
      }));
      await prisma.clientRef.createMany({ data: toCreateClients, skipDuplicates: true });
      const createdClients = await prisma.clientRef.findMany({
        where: { tenantId, code: { in: Array.from(newClientCodes) } },
        select: { id: true, code: true },
      });
      for (const c of createdClients) clientMap.set(c.code, c.id);
      report.counts.clients += createdClients.length;
    }

    if (newSaleProductCodes.size > 0) {
      const toCreateProducts = Array.from(newSaleProductCodes).map((code) => ({
        tenantId,
        code,
        designation: `Article ${code}`,
        category: "Général",
        priceVentHT: 15000,
        costAchatHT: 10000,
        margineCible: 33,
      }));
      await prisma.productRef.createMany({ data: toCreateProducts, skipDuplicates: true });
      const createdProds = await prisma.productRef.findMany({
        where: { tenantId, code: { in: Array.from(newSaleProductCodes) } },
        select: { id: true, code: true },
      });
      for (const p of createdProds) productMap.set(p.code, p.id);
      report.counts.products += createdProds.length;
    }

    // Passe 2 : construction du batch
    type SaleData = {
      tenantId: string; date: string; refFacture: string; clientId: string;
      productId: string; quantity: number; puHT: number; montantHT: number;
      tauxTVA: number; montantTVA: number; montantTTC: number;
    };
    const saleBatch: SaleData[] = [];

    for (const [idx, r] of saleRows.entries()) {
      const date = parseDate(r.date);
      const refFacture = String(r.reffacture || r.ref || r.numerofacture || `FAC-${idx + 1}`).trim();
      const clientCode = String(r.codeClient || r.codeclient || r.client || r.code || "CLI-DIVERS").trim().toUpperCase();
      const productCode = String(r.codeproduit || r.produit || r.article || "PRD-GEN").trim().toUpperCase();
      const clientId = clientMap.get(clientCode)!;
      const productId = productMap.get(productCode)!;

      const quantity = Math.max(1, parseNumber(r.quantite || r.qte || r.nombre, 1));
      const puHT = parseNumber(r.puht || r.prixunitaire || r.prix, 10000);
      const montantHT = parseNumber(r.montantht || r.totalht, quantity * puHT);
      const tauxTVA = parseNumber(r.tauxtva || r.tva, 18);
      const montantTVA = parseNumber(r.montanttva, Math.round((montantHT * tauxTVA) / 100));
      const montantTTC = parseNumber(r.montantttc || r.totalttc, montantHT + montantTVA);

      saleBatch.push({ tenantId, date, refFacture, clientId, productId, quantity, puHT, montantHT, tauxTVA, montantTVA, montantTTC });
    }

    // Passe 3 : insertion en lots de BATCH_SIZE
    await insertInBatches(saleBatch, (batch) =>
      prisma.sale.createMany({ data: batch, skipDuplicates: false })
    );
    report.counts.sales += saleBatch.length;
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

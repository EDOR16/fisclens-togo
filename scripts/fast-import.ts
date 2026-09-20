import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import { prisma } from "../src/lib/server/prisma";

function normalizeTogoRegion(val: string): string {
  const s = (val || "").toLowerCase();
  if (s.includes("kara")) return "Kara";
  if (s.includes("plateau") || s.includes("atakpame")) return "Plateaux";
  if (s.includes("savane") || s.includes("dapaong")) return "Savanes";
  if (s.includes("centrale") || s.includes("sokode")) return "Centrale";
  return "Maritime";
}

function parseDateStr(val: any): string {
  if (!val) return "2026-01-15";
  if (val instanceof Date) return val.toISOString().split("T")[0];
  if (typeof val === "number") {
    const d = new Date((val - (25567 + 2)) * 86400 * 1000);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const matchFR = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (matchFR) {
    return `${matchFR[3]}-${matchFR[2].padStart(2, "0")}-${matchFR[1].padStart(2, "0")}`;
  }
  return "2026-01-15";
}

async function main() {
  console.log("Lecture du fichier Excel...");
  const filePath = path.join(process.cwd(), "FiscLens_AutoPlusTogo_10000_Ventes.xlsx");
  const buffer = fs.readFileSync(filePath);
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });

  const tenants = await prisma.tenant.findMany();
  for (const tenant of tenants) {
    const tenantId = tenant.id;
    console.log(`\n======================================================`);
    console.log(`Traitement du tenant : ${tenant.name} (${tenantId})`);
    console.log(`======================================================`);

    console.log("Nettoyage des anciennes données BI...");
    await prisma.sale.deleteMany({ where: { tenantId } });
    await prisma.purchase.deleteMany({ where: { tenantId } });
    await prisma.clientRef.deleteMany({ where: { tenantId } });
    await prisma.productRef.deleteMany({ where: { tenantId } });

    // 1. Produits (Catalogue_Vehicules)
    console.log("Import des produits...");
    const rawProds: any[] = XLSX.utils.sheet_to_json(wb.Sheets["Catalogue_Vehicules"] || []);
    const prodsData = rawProds.map((r) => ({
      tenantId,
      code: String(r.Code || r.code).trim().toUpperCase(),
      designation: `${r.Marque || ""} ${r.Modele || ""}`.trim() || String(r.Code),
      category: String(r.Categorie || "Véhicule"),
      priceVentHT: Math.round(Number(r.PrixVenteHT || 0)),
      costAchatHT: Math.round(Number(r.CoutAchatHT || 0)),
      margineCible: Math.round(Number(r.MargePct || 25)),
    }));
    await prisma.productRef.createMany({ data: prodsData, skipDuplicates: true });
    const allProds = await prisma.productRef.findMany({ where: { tenantId }, select: { id: true, code: true } });
    const prodMap = new Map(allProds.map((p) => [p.code, p.id]));
    console.log(`✅ ${allProds.length} produits enregistrés.`);

    // 2. Clients (Repertoire_Clients)
    console.log("Import des clients...");
    const rawClients: any[] = XLSX.utils.sheet_to_json(wb.Sheets["Repertoire_Clients"] || []);
    const clientsData = rawClients.map((r) => ({
      tenantId,
      code: String(r.Code || r.code).trim().toUpperCase(),
      name: String(r.Nom || r.nom || r.Code).trim(),
      segment: String(r.Segment || "Particulier").trim(),
      zoneGeo: normalizeTogoRegion(String(r.Region || r.Ville || "Maritime")),
      encoursAutorise: Math.round(Number(r.EncoursAutorise || 15000000)),
    }));
    for (let i = 0; i < clientsData.length; i += 1000) {
      await prisma.clientRef.createMany({ data: clientsData.slice(i, i + 1000), skipDuplicates: true });
    }
    const allClients = await prisma.clientRef.findMany({ where: { tenantId }, select: { id: true, code: true } });
    const clientMap = new Map(allClients.map((c) => [c.code, c.id]));
    console.log(`✅ ${allClients.length} clients enregistrés.`);

    // 3. Achats (Achats_Vehicules + Achats_Pieces)
    console.log("Import des achats...");
    const rawAchatsVeh: any[] = XLSX.utils.sheet_to_json(wb.Sheets["Achats_Vehicules"] || []);
    const rawAchatsPcs: any[] = XLSX.utils.sheet_to_json(wb.Sheets["Achats_Pieces"] || []);
    const rawAchats = [...rawAchatsVeh, ...rawAchatsPcs];

    const defaultProdId = allProds[0]?.id;
    const achatsData = rawAchats.map((r, idx) => {
      const pCode = String(r.CodeVehicule || r.Code || "").trim().toUpperCase();
      const productId = prodMap.get(pCode) || defaultProdId;
      const quantity = Math.max(1, Math.round(Number(r.Quantite || 1)));
      const puHT = Math.round(Number(r.PrixUnitaireHT || 1000000));
      const montantHT = Math.round(Number(r.MontantHT || quantity * puHT));
      const tauxTVA = Math.round(Number(r.TauxTVA || 18));
      const montantTVA = Math.round(Number(r.MontantTVA || (montantHT * tauxTVA) / 100));
      const montantTTC = Math.round(Number(r.MontantTTC || montantHT + montantTVA));

      return {
        tenantId,
        date: parseDateStr(r.DateCommande || r.Date),
        refCommande: String(r.NumCommande || `CMD-${idx + 1}`),
        supplierId: String(r.CodeFournisseur || "FOUR-DIVERS"),
        productId,
        quantity,
        puHT,
        montantHT,
        tauxTVA,
        montantTVA,
        montantTTC,
      };
    });

    for (let i = 0; i < achatsData.length; i += 1000) {
      await prisma.purchase.createMany({ data: achatsData.slice(i, i + 1000) });
    }
    console.log(`✅ ${achatsData.length} achats enregistrés.`);

    // 4. Ventes (Ventes)
    console.log("Import des 10 000 ventes avec dates réelles...");
    const rawVentes: any[] = XLSX.utils.sheet_to_json(wb.Sheets["Ventes"] || []);
    const defaultClientId = allClients[0]?.id;

    const ventesData = rawVentes.map((r, idx) => {
      const cCode = String(r.CodeClient || "").trim().toUpperCase();
      const pCode = String(r.CodeVehicule || "").trim().toUpperCase();
      const clientId = clientMap.get(cCode) || defaultClientId;
      const productId = prodMap.get(pCode) || defaultProdId;
      const quantity = Math.max(1, Math.round(Number(r.Quantite || 1)));
      const puHT = Math.round(Number(r.PrixUnitaireHT || 5000000));
      const montantHT = Math.round(Number(r.MontantHT || quantity * puHT));
      const tauxTVA = Math.round(Number(r.TauxTVA || 18));
      const montantTVA = Math.round(Number(r.MontantTVA || (montantHT * tauxTVA) / 100));
      const montantTTC = Math.round(Number(r.MontantTTC || montantHT + montantTVA));

      return {
        tenantId,
        date: parseDateStr(r.DateVente || r.Date),
        refFacture: String(r.NumFacture || `FAC-${idx + 1}`),
        clientId,
        productId,
        quantity,
        puHT,
        montantHT,
        tauxTVA,
        montantTVA,
        montantTTC,
      };
    });

    for (let i = 0; i < ventesData.length; i += 1000) {
      await prisma.sale.createMany({ data: ventesData.slice(i, i + 1000) });
    }
    console.log(`✅ ${ventesData.length} ventes enregistrées pour ${tenant.name} !`);
  }
}

main()
  .catch((err) => {
    console.error("❌ Erreur:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

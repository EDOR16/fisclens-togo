/**
 * Générateur de jeu de données Excel — Concessionnaire Automobile Togo
 * ─────────────────────────────────────────────────────────────────────
 * Produit un fichier Excel multi-onglets de ~10 000 ventes sur 3 ans
 * avec toutes les données comptables et fiscales nécessaires :
 * CA, TVA, IS/IMF, IRPP, CNSS, Patente, SAV.
 *
 * Usage : npx tsx scripts/generate-auto-dealer-dataset.ts
 */

import * as XLSX from "xlsx";
import * as path from "path";

// ═══════════════════════════════════════════════════════════════════
// SEED POUR REPRODUCTIBILITÉ (LCG — Linear Congruential Generator)
// ═══════════════════════════════════════════════════════════════════
let seed = 20260914;
const random = (): number => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const randInt = (min: number, max: number): number =>
  Math.floor(random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)];
const chance = (pct: number): boolean => random() < pct / 100;

// ═══════════════════════════════════════════════════════════════════
// DONNÉES DE BASE TOGO
// ═══════════════════════════════════════════════════════════════════

const REGIONS = ["Maritime", "Plateaux", "Centrale", "Kara", "Savanes"];
const REGION_POIDS = [50, 15, 12, 13, 10]; // % distribution des ventes

const VILLES_PAR_REGION: Record<string, string[]> = {
  Maritime: ["Lomé", "Aného", "Tsévié", "Vogan", "Tabligbo"],
  Plateaux: ["Atakpamé", "Kpalimé", "Notsé", "Badou", "Adéta"],
  Centrale: ["Sokodé", "Blitta", "Tchamba", "Sotouboua"],
  Kara: ["Kara", "Bassar", "Bafilo", "Kandé"],
  Savanes: ["Dapaong", "Mango", "Cinkassé", "Tandjouaré"],
};

// Marques & modèles avec prix de vente TTC réalistes Togo (FCFA)
const MARQUES_MODELES: Array<{
  marque: string;
  modele: string;
  categorie: "CITADINE" | "BERLINE" | "SUV" | "PICKUP" | "UTILITAIRE" | "LUXE";
  prixHT: number;
  coutAchat: number;
}> = [
  // CITADINES (entrée de gamme, très populaires au Togo)
  { marque: "Suzuki", modele: "Alto", categorie: "CITADINE", prixHT: 5_500_000, coutAchat: 4_200_000 },
  { marque: "Suzuki", modele: "Swift", categorie: "CITADINE", prixHT: 7_800_000, coutAchat: 6_000_000 },
  { marque: "Toyota", modele: "Aygo", categorie: "CITADINE", prixHT: 8_500_000, coutAchat: 6_500_000 },
  { marque: "Kia", modele: "Picanto", categorie: "CITADINE", prixHT: 7_500_000, coutAchat: 5_800_000 },
  { marque: "Hyundai", modele: "i10", categorie: "CITADINE", prixHT: 8_200_000, coutAchat: 6_300_000 },

  // BERLINES
  { marque: "Toyota", modele: "Corolla", categorie: "BERLINE", prixHT: 15_500_000, coutAchat: 12_000_000 },
  { marque: "Toyota", modele: "Camry", categorie: "BERLINE", prixHT: 22_000_000, coutAchat: 17_000_000 },
  { marque: "Honda", modele: "Civic", categorie: "BERLINE", prixHT: 16_800_000, coutAchat: 13_000_000 },
  { marque: "Nissan", modele: "Sentra", categorie: "BERLINE", prixHT: 14_500_000, coutAchat: 11_200_000 },
  { marque: "Hyundai", modele: "Elantra", categorie: "BERLINE", prixHT: 15_200_000, coutAchat: 11_800_000 },
  { marque: "Kia", modele: "Rio", categorie: "BERLINE", prixHT: 12_500_000, coutAchat: 9_700_000 },
  { marque: "Peugeot", modele: "301", categorie: "BERLINE", prixHT: 13_800_000, coutAchat: 10_700_000 },
  { marque: "Renault", modele: "Logan", categorie: "BERLINE", prixHT: 9_500_000, coutAchat: 7_300_000 },

  // SUV (segment en forte croissance)
  { marque: "Toyota", modele: "RAV4", categorie: "SUV", prixHT: 28_000_000, coutAchat: 22_000_000 },
  { marque: "Toyota", modele: "Land Cruiser Prado", categorie: "SUV", prixHT: 45_000_000, coutAchat: 35_000_000 },
  { marque: "Toyota", modele: "Highlander", categorie: "SUV", prixHT: 38_000_000, coutAchat: 30_000_000 },
  { marque: "Nissan", modele: "Qashqai", categorie: "SUV", prixHT: 24_500_000, coutAchat: 19_000_000 },
  { marque: "Nissan", modele: "X-Trail", categorie: "SUV", prixHT: 29_000_000, coutAchat: 22_500_000 },
  { marque: "Hyundai", modele: "Tucson", categorie: "SUV", prixHT: 26_500_000, coutAchat: 20_500_000 },
  { marque: "Kia", modele: "Sportage", categorie: "SUV", prixHT: 27_500_000, coutAchat: 21_300_000 },
  { marque: "Mitsubishi", modele: "Outlander", categorie: "SUV", prixHT: 25_800_000, coutAchat: 20_000_000 },

  // PICKUP (très demandés au Togo)
  { marque: "Toyota", modele: "Hilux", categorie: "PICKUP", prixHT: 32_000_000, coutAchat: 25_000_000 },
  { marque: "Nissan", modele: "Navara", categorie: "PICKUP", prixHT: 30_500_000, coutAchat: 23_800_000 },
  { marque: "Mitsubishi", modele: "L200", categorie: "PICKUP", prixHT: 28_500_000, coutAchat: 22_200_000 },
  { marque: "Ford", modele: "Ranger", categorie: "PICKUP", prixHT: 33_500_000, coutAchat: 26_000_000 },

  // UTILITAIRES
  { marque: "Toyota", modele: "Hiace", categorie: "UTILITAIRE", prixHT: 26_000_000, coutAchat: 20_200_000 },
  { marque: "Peugeot", modele: "Partner", categorie: "UTILITAIRE", prixHT: 15_500_000, coutAchat: 12_000_000 },
  { marque: "Renault", modele: "Kangoo", categorie: "UTILITAIRE", prixHT: 14_200_000, coutAchat: 11_000_000 },

  // LUXE
  { marque: "Mercedes", modele: "Classe C", categorie: "LUXE", prixHT: 42_000_000, coutAchat: 33_000_000 },
  { marque: "Mercedes", modele: "Classe E", categorie: "LUXE", prixHT: 58_000_000, coutAchat: 45_500_000 },
  { marque: "Mercedes", modele: "GLE", categorie: "LUXE", prixHT: 78_000_000, coutAchat: 61_000_000 },
  { marque: "BMW", modele: "Série 3", categorie: "LUXE", prixHT: 45_000_000, coutAchat: 35_000_000 },
  { marque: "BMW", modele: "X5", categorie: "LUXE", prixHT: 82_000_000, coutAchat: 64_000_000 },
  { marque: "Audi", modele: "A4", categorie: "LUXE", prixHT: 44_500_000, coutAchat: 35_000_000 },
  { marque: "Audi", modele: "Q5", categorie: "LUXE", prixHT: 62_000_000, coutAchat: 48_500_000 },
];

// Poids relatifs des marques au Togo (Toyota domine)
const MARQUE_POIDS: Record<string, number> = {
  Toyota: 40, Nissan: 12, Hyundai: 11, Kia: 9, Suzuki: 6,
  Honda: 4, Peugeot: 4, Renault: 3, Mitsubishi: 3,
  Mercedes: 3, BMW: 2, Audi: 2, Ford: 1,
};

const COULEURS = ["Blanc", "Noir", "Gris", "Bleu", "Rouge", "Argent", "Beige", "Marron", "Vert", "Jaune"];
const COULEUR_POIDS = [30, 22, 18, 8, 5, 8, 4, 2, 2, 1];

const PRENOMS_M = ["Kossi", "Yaovi", "Komlan", "Kodjo", "Kwame", "Kwaku", "Mensah", "Ablavi", "Kossigan", "Yao", "Mawuli", "Edem", "Selom", "Koffi", "Essiom", "Nicolas", "Pierre", "Jean", "Marc", "Joseph", "Emmanuel", "Franck", "Serge", "Patrick", "Bertrand"];
const PRENOMS_F = ["Akouvi", "Afi", "Ama", "Akossiwa", "Yawa", "Essi", "Dede", "Mawusi", "Sena", "Adjovi", "Ayaba", "Aicha", "Fatima", "Grace", "Victoire", "Céline", "Marie", "Claire", "Sylvie", "Nathalie", "Estelle", "Chantal", "Bernadette", "Joséphine", "Adjo"];
const NOMS = ["MENSAH", "KOUASSI", "AGBEKO", "ADJOVI", "DOSSEH", "AYIVI", "KOFFI", "AMOUZOU", "KPODAR", "LAWSON", "AGOSSOU", "SEWAVI", "AZIABOR", "TCHALLA", "GNASSINGBE", "TOSSOU", "HOUNKPATI", "ADJALLE", "BELLO", "SAMBIANI", "OURO-DJERI", "TCHAMDJA", "KPANTE", "NAPO", "LARE", "DJOUMA", "ZOURE", "YOVO", "AMEGAN", "DOVONOU"];

const SEGMENTS_CLIENT = ["Particulier", "Entreprise", "État/ONG", "Revendeur"];
const SEGMENT_POIDS = [55, 25, 10, 10];

const MODES_PAIEMENT = ["Comptant", "Virement bancaire", "Chèque", "Crédit 30j", "Crédit 60j", "Crédit 90j", "Crédit 6 mois", "Leasing 24 mois", "Mobile Money (T-Money/Flooz)"];
const MODE_POIDS = [25, 20, 8, 15, 12, 8, 5, 3, 4];

const FOURNISSEURS_PIECES = [
  { code: "FOUR-TOYOTA-JP", nom: "Toyota Tsusho Afrique", pays: "Japon", type: "CONSTRUCTEUR" },
  { code: "FOUR-NISSAN-JP", nom: "Nissan Trading Europe", pays: "France", type: "CONSTRUCTEUR" },
  { code: "FOUR-HYUNDAI-KR", nom: "Hyundai Motor Company Africa", pays: "Corée du Sud", type: "CONSTRUCTEUR" },
  { code: "FOUR-KIA-KR", nom: "Kia Motors West Africa", pays: "Corée du Sud", type: "CONSTRUCTEUR" },
  { code: "FOUR-BOSCH-DE", nom: "Bosch Automotive Togo", pays: "Allemagne", type: "EQUIPEMENTIER" },
  { code: "FOUR-MICHELIN-FR", nom: "Michelin Afrique de l'Ouest", pays: "France", type: "EQUIPEMENTIER" },
  { code: "FOUR-VALEO-FR", nom: "Valeo Service Afrique", pays: "France", type: "EQUIPEMENTIER" },
  { code: "FOUR-CASTROL-UK", nom: "Castrol Lubrifiants Togo", pays: "Royaume-Uni", type: "CONSOMMABLE" },
  { code: "FOUR-LOCAL-LOME", nom: "Togo Auto Pièces (Lomé)", pays: "Togo", type: "DISTRIBUTEUR_LOCAL" },
  { code: "FOUR-LOCAL-COTONOU", nom: "Bénin Auto Import (Cotonou)", pays: "Bénin", type: "DISTRIBUTEUR_REGIONAL" },
  { code: "FOUR-LOCAL-ACCRA", nom: "Ghana Auto Parts (Accra)", pays: "Ghana", type: "DISTRIBUTEUR_REGIONAL" },
];

const CATEGORIES_PIECES = [
  { code: "PNEU", designation: "Pneumatiques (4 saisons, toutes marques)", prixAchat: 45_000, prixVente: 85_000 },
  { code: "FREIN", designation: "Plaquettes et disques de frein", prixAchat: 25_000, prixVente: 55_000 },
  { code: "HUILE", designation: "Huile moteur 5L (10W40, 5W30)", prixAchat: 18_000, prixVente: 35_000 },
  { code: "FILTRE", designation: "Filtres à air / huile / carburant", prixAchat: 8_000, prixVente: 18_000 },
  { code: "BATTERIE", designation: "Batterie 12V 70Ah (DIN / JIS)", prixAchat: 65_000, prixVente: 120_000 },
  { code: "AMORTISSEUR", designation: "Amortisseurs avant/arrière", prixAchat: 55_000, prixVente: 110_000 },
  { code: "COURROIE", designation: "Courroie de distribution + galets", prixAchat: 42_000, prixVente: 85_000 },
  { code: "PHARE", designation: "Phares avant LED / ampoules H4", prixAchat: 75_000, prixVente: 145_000 },
  { code: "RETROVISEUR", designation: "Rétroviseurs électriques", prixAchat: 35_000, prixVente: 75_000 },
  { code: "BOUGIE", designation: "Bougies d'allumage (lot de 4)", prixAchat: 12_000, prixVente: 28_000 },
  { code: "ALTERNATEUR", designation: "Alternateurs et démarreurs", prixAchat: 85_000, prixVente: 165_000 },
  { code: "RADIATEUR", designation: "Radiateurs moteur et climatisation", prixAchat: 95_000, prixVente: 185_000 },
  { code: "ECHAPPEMENT", designation: "Lignes d'échappement + catalyseurs", prixAchat: 68_000, prixVente: 135_000 },
  { code: "EMBRAYAGE", designation: "Kits d'embrayage complets", prixAchat: 95_000, prixVente: 185_000 },
  { code: "SUSPENSION", designation: "Rotules, silentblocs, barres stabilisatrices", prixAchat: 22_000, prixVente: 48_000 },
];

// ═══════════════════════════════════════════════════════════════════
// GÉNÉRATEURS
// ═══════════════════════════════════════════════════════════════════

function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function genererFicheEntreprise() {
  return [
    { Parametre: "Raison Sociale", Detail: "AUTO PLUS TOGO SARL" },
    { Parametre: "Forme Juridique", Detail: "SARL au capital de 50 000 000 FCFA" },
    { Parametre: "NIF", Detail: "1001234567" },
    { Parametre: "RCCM", Detail: "TG-LOM-2019-B-0842" },
    { Parametre: "Siège Social", Detail: "Boulevard du 30 Août, Zone Portuaire, Lomé" },
    { Parametre: "Secteur d'Activité", Detail: "Concession automobile — Vente véhicules neufs & occasion" },
    { Parametre: "Régime Fiscal", Detail: "Réel Normal — DGE Lomé" },
    { Parametre: "Banque Principale", Detail: "Ecobank Togo — Compte 012047658201" },
    { Parametre: "Effectif", Detail: "15 employés permanents + 5 mécaniciens" },
    { Parametre: "Période Couverte", Detail: "01/01/2024 au 31/12/2026 (3 exercices)" },
    { Parametre: "TVA Taux Normal", Detail: "18% (véhicules neufs)" },
    { Parametre: "TVA Taux Réduit", Detail: "0% (véhicules occasion < 5 ans — LF 2026 art. 8)" },
    { Parametre: "IS Taux", Detail: "27% (CGI art. 113)" },
    { Parametre: "IMF Taux", Detail: "1% du CA HT, plancher 20 000 FCFA (CGI art. 120)" },
    { Parametre: "Patente", Detail: "Basée sur CA selon barème CGI art. 250-255" },
    { Parametre: "IRPP Barème", Detail: "8 tranches progressives 0% à 35% (CGI art. 74)" },
    { Parametre: "CNSS Patronale", Detail: "17.5% (Prestations familiales + risques pro + vieillesse)" },
    { Parametre: "AMU Patronale", Detail: "5% (Décret 2023-096/PR)" },
  ];
}

function genererCatalogue() {
  const rows: any[] = [];
  let idx = 1;
  for (const m of MARQUES_MODELES) {
    const prixTTC = Math.round(m.prixHT * 1.18);
    const margePct = Math.round(((m.prixHT - m.coutAchat) / m.prixHT) * 100);
    rows.push({
      Code: `VEH-${m.marque.toUpperCase().slice(0, 3)}-${String(idx).padStart(3, "0")}`,
      Marque: m.marque,
      Modele: m.modele,
      Categorie: m.categorie,
      PrixVenteHT: m.prixHT,
      PrixVenteTTC: prixTTC,
      CoutAchatHT: m.coutAchat,
      MargeUnitaireHT: m.prixHT - m.coutAchat,
      MargePct: margePct,
      TVAApplicable: "18%",
    });
    idx++;
  }
  return rows;
}

function genererFournisseurs() {
  return FOURNISSEURS_PIECES.map((f) => ({
    Code: f.code,
    Nom: f.nom,
    Pays: f.pays,
    Type: f.type,
    NIF: `TG${randInt(1000000000, 9999999999)}`,
    Contact: `+228 ${randInt(20, 99)} ${randInt(10, 99)} ${randInt(10, 99)} ${randInt(10, 99)}`,
    DelaiLivraisonJours: f.pays === "Togo" ? randInt(1, 3) : f.type === "CONSTRUCTEUR" ? randInt(45, 90) : randInt(15, 45),
  }));
}

function genererClients(nb: number) {
  const rows: any[] = [];
  for (let i = 0; i < nb; i++) {
    const sexe = chance(65) ? "M" : "F";
    const prenom = sexe === "M" ? pick(PRENOMS_M) : pick(PRENOMS_F);
    const nom = pick(NOMS);
    const age = randInt(22, 68);
    const region = weightedPick(REGIONS, REGION_POIDS);
    const ville = pick(VILLES_PAR_REGION[region]);
    const segment = weightedPick(SEGMENTS_CLIENT, SEGMENT_POIDS);
    const code = `CLI-${String(i + 1).padStart(5, "0")}`;
    const encoursMax = segment === "Entreprise" ? 50_000_000 : segment === "État/ONG" ? 80_000_000 : segment === "Revendeur" ? 30_000_000 : 15_000_000;
    rows.push({
      Code: code,
      Nom: `${prenom} ${nom}`,
      Sexe: sexe,
      Age: age,
      TrancheAge: age < 30 ? "18-29" : age < 40 ? "30-39" : age < 50 ? "40-49" : age < 60 ? "50-59" : "60+",
      Region: region,
      Ville: ville,
      Segment: segment,
      NIF: segment !== "Particulier" ? `TG${randInt(1000000000, 9999999999)}` : "",
      Telephone: `+228 ${randInt(90, 99)} ${randInt(10, 99)} ${randInt(10, 99)} ${randInt(10, 99)}`,
      Email: `${prenom.toLowerCase()}.${nom.toLowerCase()}@${pick(["gmail.com", "yahoo.fr", "outlook.com", "pro.tg"])}`,
      EncoursAutorise: encoursMax,
      DateInscription: `20${randInt(20, 24)}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
    });
  }
  return rows;
}

function genererVentes(nb: number, clients: any[], catalogue: any[]) {
  const rows: any[] = [];
  const dateDebut = new Date("2024-01-01");
  const dateFin = new Date("2026-12-31");
  const dureeJours = Math.floor((dateFin.getTime() - dateDebut.getTime()) / 86400000);

  for (let i = 0; i < nb; i++) {
    // Date aléatoire avec saisonnalité (plus de ventes en fin d'année)
    let jours = randInt(0, dureeJours);
    const date = new Date(dateDebut.getTime() + jours * 86400000);
    const mois = date.getMonth() + 1;
    // Boost des ventes en novembre-décembre (prime fin d'année)
    if (chance(25) && (mois === 11 || mois === 12)) {
      jours = randInt(0, dureeJours);
    }
    const dateVente = new Date(dateDebut.getTime() + jours * 86400000);

    const client = pick(clients);
    const vehicule = pick(catalogue);
    const couleur = weightedPick(COULEURS, COULEUR_POIDS);
    const quantite = 1;
    const prixHT = vehicule.PrixVenteHT;
    const tauxTVA = 18; // Véhicules neufs
    const montantHT = prixHT * quantite;
    const montantTVA = Math.round((montantHT * tauxTVA) / 100);
    const montantTTC = montantHT + montantTVA;
    const coutAchat = vehicule.CoutAchatHT * quantite;
    const margeNette = montantHT - coutAchat;

    const modePaiement = weightedPick(MODES_PAIEMENT, MODE_POIDS);
    const dureeSolde = modePaiement.includes("90j") ? 90 : modePaiement.includes("60j") ? 60 : modePaiement.includes("30j") ? 30 : modePaiement.includes("6 mois") ? 180 : modePaiement.includes("24 mois") ? 720 : 0;
    const dateReglement = new Date(dateVente.getTime() + dureeSolde * 86400000);
    const statutPaiement = dureeSolde === 0 ? "PAYE_IMMEDIAT" : chance(85) ? "REGLE" : "EN_COURS";

    rows.push({
      DateVente: dateVente.toISOString().slice(0, 10),
      NumFacture: `FAC-AUTO-${dateVente.getFullYear()}-${String(i + 1).padStart(6, "0")}`,
      CodeClient: client.Code,
      NomClient: client.Nom,
      SexeClient: client.Sexe,
      AgeClient: client.Age,
      RegionClient: client.Region,
      VilleClient: client.Ville,
      SegmentClient: client.Segment,
      CodeVehicule: vehicule.Code,
      Marque: vehicule.Marque,
      Modele: vehicule.Modele,
      Categorie: vehicule.Categorie,
      Couleur: couleur,
      Quantite: quantite,
      PrixUnitaireHT: prixHT,
      MontantHT: montantHT,
      TauxTVA: tauxTVA,
      MontantTVA: montantTVA,
      MontantTTC: montantTTC,
      CoutAchatHT: coutAchat,
      MargeNetteHT: margeNette,
      MargePct: Math.round((margeNette / montantHT) * 100),
      ModePaiement: modePaiement,
      DureeSoldeJours: dureeSolde,
      DateEcheanceReglement: dateReglement.toISOString().slice(0, 10),
      StatutPaiement: statutPaiement,
      Vendeur: pick(["AGBEKO Kossi", "MENSAH Yao", "KOUASSI Afi", "DOSSEH Komlan", "AYIVI Akouvi"]),
    });
  }
  return rows;
}

function genererAchats(ventes: any[], fournisseurs: any[]) {
  const rows: any[] = [];
  // Regrouper les ventes par mois et par modèle pour simuler des commandes groupées
  const commandesParMois = new Map<string, any[]>();
  for (const v of ventes) {
    const mois = v.DateVente.slice(0, 7);
    if (!commandesParMois.has(mois)) commandesParMois.set(mois, []);
    commandesParMois.get(mois)!.push(v);
  }

  let idx = 1;
  for (const [mois, ventesMois] of commandesParMois.entries()) {
    // Regrouper par véhicule
    const parVehicule = new Map<string, { qte: number; cout: number; modele: any }>();
    for (const v of ventesMois) {
      const key = v.CodeVehicule;
      const existing = parVehicule.get(key) || { qte: 0, cout: 0, modele: v };
      existing.qte += v.Quantite;
      existing.cout = v.CoutAchatHT;
      parVehicule.set(key, existing);
    }

    for (const [codeVeh, data] of parVehicule.entries()) {
      const fournisseur = pick(fournisseurs.filter((f: any) => f.Type === "CONSTRUCTEUR"));

      // ── Contrainte INT4 PostgreSQL : un montant HT doit rester < 2 000 000 000 FCFA
      //    (limite INT4 = 2 147 483 647, on garde une marge de sécurité)
      // Plafond INT4 : le montant TTC (= HT + TVA 18%) doit rester < 2 147 483 647
      const INT4_MAX_SAFE_TTC = 2_000_000_000;
      const coutTTCUnitaire = Math.round(data.cout * 1.18);
      const qteMaxParCommande = Math.max(1, Math.floor(INT4_MAX_SAFE_TTC / coutTTCUnitaire));

      let qteRestante = Math.ceil(data.qte * 1.15); // Surstock 15%
      let idxCmd = 0;

      // Découper en plusieurs commandes si la quantité dépasse la limite INT4
      while (qteRestante > 0) {
        const qteCmd = Math.min(qteRestante, qteMaxParCommande);
        const montantHT = data.cout * qteCmd;
        const montantTVA = Math.round(montantHT * 0.18);

        const suffixe = idxCmd === 0 ? "" : `-${String(idxCmd + 1).padStart(2, "0")}`;

        rows.push({
          DateCommande: `${mois}-01`,
          NumCommande: `CMD-VEH-${mois.replace("-", "")}-${String(idx).padStart(4, "0")}${suffixe}`,
          CodeFournisseur: fournisseur.Code,
          NomFournisseur: fournisseur.Nom,
          PaysFournisseur: fournisseur.Pays,
          CodeVehicule: codeVeh,
          Marque: data.modele.Marque,
          Modele: data.modele.Modele,
          Quantite: qteCmd,
          PrixUnitaireHT: data.cout,
          MontantHT: montantHT,
          TauxTVA: 18,
          MontantTVA: montantTVA,
          MontantTTC: montantHT + montantTVA,
          DelaiLivraisonJours: fournisseur.DelaiLivraisonJours,
          Incoterm: fournisseur.Pays === "Togo" ? "EXW" : "CIF Lomé",
        });

        qteRestante -= qteCmd;
        idx++;
        idxCmd++;
      }
    }
  }
  return rows;
}

function genererAchatsPieces(ventes: any[], fournisseurs: any[]) {
  const rows: any[] = [];
  let idx = 1;
  const mois = Array.from(new Set(ventes.map((v) => v.DateVente.slice(0, 7))));

  for (const m of mois) {
    // 5 à 10 commandes de pièces par mois
    const nb = randInt(5, 10);
    for (let i = 0; i < nb; i++) {
      const piece = pick(CATEGORIES_PIECES);
      const fournisseur = pick(fournisseurs.filter((f: any) => f.Type === "DISTRIBUTEUR_LOCAL" || f.Type === "DISTRIBUTEUR_REGIONAL" || f.Type === "EQUIPEMENTIER"));
      const qte = randInt(2, 30);
      const montantHT = piece.prixAchat * qte;
      const montantTVA = Math.round(montantHT * 0.18);
      rows.push({
        DateCommande: `${m}-${String(randInt(1, 28)).padStart(2, "0")}`,
        NumCommande: `CMD-PCS-${m.replace("-", "")}-${String(idx).padStart(4, "0")}`,
        CodeFournisseur: fournisseur.Code,
        NomFournisseur: fournisseur.Nom,
        CategoriePiece: piece.code,
        Designation: piece.designation,
        Quantite: qte,
        PrixUnitaireHT: piece.prixAchat,
        MontantHT: montantHT,
        TauxTVA: 18,
        MontantTVA: montantTVA,
        MontantTTC: montantHT + montantTVA,
      });
      idx++;
    }
  }
  return rows;
}

function genererEcritures(ventes: any[], achats: any[], achatsPieces: any[], salaires: any[]) {
  const rows: any[] = [];

  // ── Ventes : 3 lignes par vente
  for (const v of ventes) {
    rows.push({ Journal: "VENTES", Date: v.DateVente, Piece: v.NumFacture, Compte: "411100", Libelle: `Client ${v.NomClient}`, Debit: v.MontantTTC, Credit: 0 });
    rows.push({ Journal: "VENTES", Date: v.DateVente, Piece: v.NumFacture, Compte: "701100", Libelle: `Vente ${v.Marque} ${v.Modele} ${v.Couleur}`, Debit: 0, Credit: v.MontantHT });
    rows.push({ Journal: "VENTES", Date: v.DateVente, Piece: v.NumFacture, Compte: "443100", Libelle: `TVA facturée 18%`, Debit: 0, Credit: v.MontantTVA });
  }

  // ── Achats véhicules : 3 lignes par commande
  for (const a of achats) {
    rows.push({ Journal: "ACHATS", Date: a.DateCommande, Piece: a.NumCommande, Compte: "601100", Libelle: `Achat ${a.Quantite}x ${a.Marque} ${a.Modele}`, Debit: a.MontantHT, Credit: 0 });
    rows.push({ Journal: "ACHATS", Date: a.DateCommande, Piece: a.NumCommande, Compte: "445200", Libelle: `TVA déductible 18%`, Debit: a.MontantTVA, Credit: 0 });
    rows.push({ Journal: "ACHATS", Date: a.DateCommande, Piece: a.NumCommande, Compte: "401100", Libelle: `Fournisseur ${a.NomFournisseur}`, Debit: 0, Credit: a.MontantTTC });
  }

  // ── Achats pièces : 3 lignes par commande
  for (const a of achatsPieces) {
    rows.push({ Journal: "ACHATS", Date: a.DateCommande, Piece: a.NumCommande, Compte: "604700", Libelle: `${a.Designation}`, Debit: a.MontantHT, Credit: 0 });
    rows.push({ Journal: "ACHATS", Date: a.DateCommande, Piece: a.NumCommande, Compte: "445200", Libelle: `TVA déductible 18%`, Debit: a.MontantTVA, Credit: 0 });
    rows.push({ Journal: "ACHATS", Date: a.DateCommande, Piece: a.NumCommande, Compte: "401100", Libelle: `Fournisseur ${a.NomFournisseur}`, Debit: 0, Credit: a.MontantTTC });
  }

  // ── Salaires : 1 écriture par mois
  for (const s of salaires) {
    rows.push({ Journal: "PAIE", Date: s.Date, Piece: s.Piece, Compte: "661100", Libelle: `Salaires bruts ${s.Mois}`, Debit: s.TotalBrut, Credit: 0 });
    rows.push({ Journal: "PAIE", Date: s.Date, Piece: s.Piece, Compte: "664100", Libelle: `CNSS patronale 17.5%`, Debit: s.CnssPatronale, Credit: 0 });
    rows.push({ Journal: "PAIE", Date: s.Date, Piece: s.Piece, Compte: "664300", Libelle: `AMU patronale 5%`, Debit: s.AmuPatronale, Credit: 0 });
    rows.push({ Journal: "PAIE", Date: s.Date, Piece: s.Piece, Compte: "431100", Libelle: `CNSS ouvrière 4%`, Debit: 0, Credit: s.CnssSalariale });
    rows.push({ Journal: "PAIE", Date: s.Date, Piece: s.Piece, Compte: "431200", Libelle: `CNSS patronale 17.5%`, Debit: 0, Credit: s.CnssPatronale });
    rows.push({ Journal: "PAIE", Date: s.Date, Piece: s.Piece, Compte: "433300", Libelle: `AMU ouvrière 5%`, Debit: 0, Credit: s.AmuSalariale });
    rows.push({ Journal: "PAIE", Date: s.Date, Piece: s.Piece, Compte: "433500", Libelle: `AMU patronale 5%`, Debit: 0, Credit: s.AmuPatronale });
    rows.push({ Journal: "PAIE", Date: s.Date, Piece: s.Piece, Compte: "442100", Libelle: `IRPP retenu`, Debit: 0, Credit: s.Irpp });
    rows.push({ Journal: "PAIE", Date: s.Date, Piece: s.Piece, Compte: "421100", Libelle: `Net à payer`, Debit: 0, Credit: s.NetAPayer });
  }

  return rows;
}

function genererSalaires() {
  const rows: any[] = [];
  const moisList = [];
  for (let y = 2024; y <= 2026; y++) {
    for (let m = 1; m <= 12; m++) {
      moisList.push({ year: y, month: m });
    }
  }

  for (const { year, month } of moisList) {
    // Masse salariale brute variable selon effectif
    const brutTotal = randInt(4_500_000, 6_500_000);
    const cnssSalariale = Math.round(brutTotal * 0.04);
    const cnssPatronale = Math.round(brutTotal * 0.175);
    const amuSalariale = Math.round(brutTotal * 0.05);
    const amuPatronale = Math.round(brutTotal * 0.05);
    const irpp = Math.round(brutTotal * 0.07); // ~7% moyen après abattement
    const netAPayer = brutTotal - cnssSalariale - amuSalariale - irpp;

    rows.push({
      Date: `${year}-${String(month).padStart(2, "0")}-30`,
      Piece: `PAIE-${year}-${String(month).padStart(2, "0")}`,
      Mois: `${year}-${String(month).padStart(2, "0")}`,
      NbEmployes: 15,
      TotalBrut: brutTotal,
      CnssSalariale: cnssSalariale,
      CnssPatronale: cnssPatronale,
      AmuSalariale: amuSalariale,
      AmuPatronale: amuPatronale,
      Irpp: irpp,
      NetAPayer: netAPayer,
      CoutTotalEmployeur: brutTotal + cnssPatronale + amuPatronale,
    });
  }
  return rows;
}

function genererRecapFiscal(ventes: any[], achats: any[], achatsPieces: any[], salaires: any[]) {
  const rows: any[] = [];

  const caHT = ventes.reduce((s, v) => s + v.MontantHT, 0);
  const tvaCollectee = ventes.reduce((s, v) => s + v.MontantTVA, 0);
  const achatsHT = achats.reduce((s, a) => s + a.MontantHT, 0);
  const achatsPiecesHT = achatsPieces.reduce((s, a) => s + a.MontantHT, 0);
  const tvaDeductibleAchats = achats.reduce((s, a) => s + a.MontantTVA, 0);
  const tvaDeductiblePieces = achatsPieces.reduce((s, a) => s + a.MontantTVA, 0);
  const tvaDeductible = tvaDeductibleAchats + tvaDeductiblePieces;
  const tvaNette = Math.max(0, tvaCollectee - tvaDeductible);

  const salairesTotal = salaires.reduce((s, x) => s + x.TotalBrut, 0);
  const chargesPatronales = salaires.reduce((s, x) => s + x.CnssPatronale + x.AmuPatronale, 0);
  const irppTotal = salaires.reduce((s, x) => s + x.Irpp, 0);

  const coutAchatsTotal = achatsHT + achatsPiecesHT;
  const margeBrute = caHT - coutAchatsTotal;
  const autresCharges = Math.round(salairesTotal * 0.15); // Charges externes estimation
  const resultatComptable = margeBrute - salairesTotal - chargesPatronales - autresCharges;
  const resultatFiscal = Math.max(0, resultatComptable);

  const isTheorique = Math.round(resultatFiscal * 0.27);
  const imfTheorique = Math.max(20_000, Math.round(caHT * 0.01));
  const impotRetenu = isTheorique >= imfTheorique ? "IS" : "IMF";
  const impotExigible = Math.max(isTheorique, imfTheorique);

  const patenteBarème = Math.round(caHT * 0.0070); // ~0.7% du CA
  const patentePlancher = 200_000;
  const patente = Math.max(patenteBarème, patentePlancher);

  rows.push({ Rubrique: "CA HT total (3 exercices)", Montant: caHT, Reference: "Comptes 70x" });
  rows.push({ Rubrique: "TVA collectée sur ventes", Montant: tvaCollectee, Reference: "Comptes 443x — CGI art. 195" });
  rows.push({ Rubrique: "Achats véhicules HT", Montant: achatsHT, Reference: "Comptes 601x" });
  rows.push({ Rubrique: "Achats pièces détachées HT", Montant: achatsPiecesHT, Reference: "Comptes 604x" });
  rows.push({ Rubrique: "TVA déductible totale", Montant: tvaDeductible, Reference: "Comptes 445x — CGI art. 197" });
  rows.push({ Rubrique: "TVA nette à reverser OTR", Montant: tvaNette, Reference: "TVA collectée − TVA déductible" });
  rows.push({ Rubrique: "Masse salariale brute (36 mois)", Montant: salairesTotal, Reference: "Comptes 661x" });
  rows.push({ Rubrique: "Charges patronales CNSS+AMU", Montant: chargesPatronales, Reference: "Comptes 664x — CNSS 17.5% + AMU 5%" });
  rows.push({ Rubrique: "IRPP total retenu", Montant: irppTotal, Reference: "Comptes 442x — CGI art. 74" });
  rows.push({ Rubrique: "Marge brute commerciale", Montant: margeBrute, Reference: "CA − Coût d'achat" });
  rows.push({ Rubrique: "Résultat comptable estimé", Montant: resultatComptable, Reference: "Produits − Charges" });
  rows.push({ Rubrique: "IS théorique 27%", Montant: isTheorique, Reference: "CGI art. 113" });
  rows.push({ Rubrique: "IMF théorique 1% du CA", Montant: imfTheorique, Reference: "CGI art. 120, plancher 20 000" });
  rows.push({ Rubrique: `Impôt exigible (${impotRetenu})`, Montant: impotExigible, Reference: "Max(IS, IMF)" });
  rows.push({ Rubrique: "Patente annuelle estimée", Montant: patente, Reference: "CGI art. 250-255" });

  return rows;
}

// ═══════════════════════════════════════════════════════════════════
// EXÉCUTION
// ═══════════════════════════════════════════════════════════════════

async function main() {
  console.log("🚗 Génération du jeu de données Concessionnaire Auto Togo...\n");

  console.log("📋 Fiche entreprise...");
  const fiche = genererFicheEntreprise();

  console.log("🚙 Catalogue véhicules...");
  const catalogue = genererCatalogue();

  console.log("🏭 Fournisseurs pièces...");
  const fournisseurs = genererFournisseurs();

  console.log("👥 Clients (3 000)...");
  const clients = genererClients(3_000);

  console.log("💰 Ventes (10 000)...");
  const ventes = genererVentes(10_000, clients, catalogue);

  console.log("📦 Achats véhicules...");
  const achats = genererAchats(ventes, fournisseurs);

  console.log("🔧 Achats pièces...");
  const achatsPieces = genererAchatsPieces(ventes, fournisseurs);

  console.log("💼 Salaires mensuels (36 mois)...");
  const salaires = genererSalaires();

  console.log("📚 Écritures comptables SYSCOHADA...");
  const ecritures = genererEcritures(ventes, achats, achatsPieces, salaires);

  console.log("📊 Récapitulatif fiscal...");
  const recap = genererRecapFiscal(ventes, achats, achatsPieces, salaires);

  console.log("\n📁 Création du fichier Excel multi-onglets...");
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fiche), "Fiche_Entreprise");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(catalogue), "Catalogue_Vehicules");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fournisseurs), "Fournisseurs_Pieces");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clients), "Repertoire_Clients");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ventes), "Ventes");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(achats), "Achats_Vehicules");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(achatsPieces), "Achats_Pieces");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salaires), "Salaires_Mensuels");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ecritures), "Ecritures_Comptables");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recap), "Recap_Fiscal");

  const outputPath = path.join(process.cwd(), "FiscLens_AutoPlusTogo_10000_Ventes.xlsx");
  XLSX.writeFile(wb, outputPath);

  console.log("\n✅ Fichier généré : " + outputPath);
  console.log("\n📊 Résumé :");
  console.log("  • Clients              : " + clients.length);
  console.log("  • Ventes               : " + ventes.length);
  console.log("  • Achats véhicules     : " + achats.length);
  console.log("  • Achats pièces        : " + achatsPieces.length);
  console.log("  • Salaires mensuels    : " + salaires.length);
  console.log("  • Écritures comptables : " + ecritures.length);
  console.log("  • Onglets Excel        : 10");
}

main().catch(console.error);
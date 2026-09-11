/**
 * Jeu d'essai opérationnel haute densité (1 mois complet — Août 2026)
 * Conçu pour les Data Analysts et les Experts-Comptables
 * 
 * Entreprise : AFRIQ-TECH DISTRIB SARL
 * NIF OTR : 1000845921 | RCCM : TG-LOM-2021-B-1452 | Régime : Réel Normal
 * Siège : 142 Boulevard du 13 Janvier, Tokoin, Lomé (Région Maritime)
 * Activité : Importation, distribution et intégration informatique, serveurs & réseaux
 * Période : 01/08/2026 au 31/08/2026 (1 mois complet)
 * Couverture : 5 Régions du Togo (Maritime, Plateaux, Centrale, Kara, Savanes)
 */

export interface TestEcritureLine {
  Journal: "ACHATS" | "VENTES" | "BANQUE" | "CAISSE" | "OD" | "PAIE";
  Date: string;
  Piece: string;
  Compte: string;
  Libelle: string;
  Debit: number;
  Credit: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CATALOGUE PRODUITS & SERVICES (14 ARTICLES)
// ─────────────────────────────────────────────────────────────────────────────

export const TEST_PRODUITS_1MOIS = [
  { code: "PRD-LAP-01", designation: "HP ProBook 450 G9 Core i5 16Go SSD 512Go", categorie: "Informatique", prixVenteHT: 450000, coutAchatHT: 315000, margeCible: 30 },
  { code: "PRD-LAP-02", designation: "Dell Vostro 3520 Core i7 16Go SSD 1To", categorie: "Informatique", prixVenteHT: 650000, coutAchatHT: 455000, margeCible: 30 },
  { code: "PRD-LAP-03", designation: "Lenovo ThinkPad L14 Gen 3 Core i5 16Go SSD", categorie: "Informatique", prixVenteHT: 520000, coutAchatHT: 370000, margeCible: 29 },
  { code: "PRD-SRV-06", designation: "Serveur Dell PowerEdge T150 Xeon E-2324G", categorie: "Serveurs & Réseau", prixVenteHT: 1200000, coutAchatHT: 850000, margeCible: 29 },
  { code: "PRD-SRV-07", designation: "Serveur Rack HP ProLiant DL360 Gen10 Xeon", categorie: "Serveurs & Réseau", prixVenteHT: 2400000, coutAchatHT: 1750000, margeCible: 27 },
  { code: "PRD-OND-05", designation: "Onduleur APC Smart-UPS 1500VA LCD 230V", categorie: "Énergie", prixVenteHT: 280000, coutAchatHT: 190000, margeCible: 32 },
  { code: "PRD-OND-08", designation: "Onduleur APC Back-UPS 650VA 230V Bureau", categorie: "Énergie", prixVenteHT: 65000, coutAchatHT: 42000, margeCible: 35 },
  { code: "PRD-IMP-04", designation: "Imprimante Multifonction Epson EcoTank L3250", categorie: "Bureautique", prixVenteHT: 195000, coutAchatHT: 135000, margeCible: 31 },
  { code: "PRD-IMP-09", designation: "Imprimante Laser Pro HP LaserJet M404dn", categorie: "Bureautique", prixVenteHT: 260000, coutAchatHT: 180000, margeCible: 31 },
  { code: "PRD-ECR-03", designation: "Moniteur Professionnel Dell 24 FHD IPS", categorie: "Périphériques", prixVenteHT: 110000, coutAchatHT: 75000, margeCible: 32 },
  { code: "PRD-CAB-07", designation: "Bobine Câble Réseau Blindé RJ45 Cat6 305m", categorie: "Réseau", prixVenteHT: 65000, coutAchatHT: 42000, margeCible: 35 },
  { code: "PRD-SWI-10", designation: "Switch Cisco Gigabit 24 Ports PoE+ Managé", categorie: "Réseau", prixVenteHT: 420000, coutAchatHT: 295000, margeCible: 30 },
  { code: "PRD-TON-08", designation: "Toner Noir Haute Capacité Multi-modèles", categorie: "Consommables", prixVenteHT: 45000, coutAchatHT: 28000, margeCible: 38 },
  { code: "PRD-SRV-MNT", designation: "Prestation Intégration Réseau & Maintenance", categorie: "Services", prixVenteHT: 350000, coutAchatHT: 100000, margeCible: 71 },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. RÉPERTOIRE CLIENTS (14 CLIENTS — 5 RÉGIONS TOGO)
// ─────────────────────────────────────────────────────────────────────────────

export const TEST_CLIENTS_1MOIS = [
  // Région Maritime (Lomé & Préfectures côtières)
  { code: "CLI-SOGEA", nom: "SOGEA SATOM Togo SA (BTP & Génie Civil)", segment: "Grand Compte", zoneGeo: "Maritime", encoursAutorise: 25000000 },
  { code: "CLI-TOTAL", nom: "TOTALENERGIES MARKETING TOGO", segment: "Grand Compte", zoneGeo: "Maritime", encoursAutorise: 30000000 },
  { code: "CLI-SOTOTO", nom: "Société Togolaise de Transport (SOTOTO)", segment: "PME", zoneGeo: "Maritime", encoursAutorise: 15000000 },
  { code: "CLI-HORIZON", nom: "Cabinet Conseil Horizon & Associés", segment: "Tertiaire", zoneGeo: "Maritime", encoursAutorise: 8000000 },
  { code: "CLI-PHARM", nom: "Société Togolaise de Pharmacie Nyékonakpoè", segment: "PME", zoneGeo: "Maritime", encoursAutorise: 10000000 },
  { code: "CLI-ANEHO", nom: "Eco-Agri Maritime Distribution Aného", segment: "PME", zoneGeo: "Maritime", encoursAutorise: 7000000 },

  // Région des Plateaux (Kpalimé, Atakpamé)
  { code: "CLI-PLATEAU", nom: "Comptoir Commercial des Plateaux (Kpalimé)", segment: "Revendeur", zoneGeo: "Plateaux", encoursAutorise: 12000000 },
  { code: "CLI-ATAK", nom: "Atakpamé Multi-Services & Matériaux", segment: "PME", zoneGeo: "Plateaux", encoursAutorise: 8000000 },

  // Région Centrale (Sokodé, Blitta)
  { code: "CLI-AGROK", nom: "Centrale Agro-Pastorale du Centre (Sokodé)", segment: "PME", zoneGeo: "Centrale", encoursAutorise: 10000000 },
  { code: "CLI-BLITTA", nom: "Coopérative Moderne de Blitta", segment: "PME", zoneGeo: "Centrale", encoursAutorise: 6000000 },

  // Région de la Kara (Kara, Bassar)
  { code: "CLI-KARA-T", nom: "Kara Tech Solutions SARL (Kara Ville)", segment: "Revendeur", zoneGeo: "Kara", encoursAutorise: 10000000 },
  { code: "CLI-BASSAR", nom: "Comptoir Équipements de Bassar", segment: "PME", zoneGeo: "Kara", encoursAutorise: 5000000 },

  // Région des Savanes (Dapaong, Mango)
  { code: "CLI-SAVAN", nom: "Consortium Savanes Équipements (Dapaong)", segment: "PME", zoneGeo: "Savanes", encoursAutorise: 8000000 },
  { code: "CLI-MANGO", nom: "Agro-Bureautique de l'Oti (Mango)", segment: "Revendeur", zoneGeo: "Savanes", encoursAutorise: 5000000 },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. VENTES DÉTAILLÉES BI (35 FACTURES / LIGNES DE VENTES SUR AOÛT 2026)
// ─────────────────────────────────────────────────────────────────────────────

export const TEST_VENTES_BI_1MOIS = [
  // 03/08 : SOGEA SATOM (Maritime)
  { date: "2026-08-03", refFacture: "FAC-VTE-2026-0801", codeClient: "CLI-SOGEA", codeProduit: "PRD-LAP-01", quantite: 4, puHT: 450000, montantHT: 1800000, tauxTVA: 18, montantTVA: 324000, montantTTC: 2124000 },
  { date: "2026-08-03", refFacture: "FAC-VTE-2026-0801", codeClient: "CLI-SOGEA", codeProduit: "PRD-ECR-03", quantite: 4, puHT: 110000, montantHT: 440000, tauxTVA: 18, montantTVA: 79200, montantTTC: 519200 },
  { date: "2026-08-03", refFacture: "FAC-VTE-2026-0801", codeClient: "CLI-SOGEA", codeProduit: "PRD-OND-05", quantite: 2, puHT: 280000, montantHT: 560000, tauxTVA: 18, montantTVA: 100800, montantTTC: 660800 },

  // 05/08 : TOTALENERGIES (Maritime)
  { date: "2026-08-05", refFacture: "FAC-VTE-2026-0802", codeClient: "CLI-TOTAL", codeProduit: "PRD-SRV-06", quantite: 2, puHT: 1200000, montantHT: 2400000, tauxTVA: 18, montantTVA: 432000, montantTTC: 2832000 },
  { date: "2026-08-05", refFacture: "FAC-VTE-2026-0802", codeClient: "CLI-TOTAL", codeProduit: "PRD-OND-05", quantite: 2, puHT: 280000, montantHT: 560000, tauxTVA: 18, montantTVA: 100800, montantTTC: 660800 },

  // 07/08 : Société Togolaise de Pharmacie (Maritime)
  { date: "2026-08-07", refFacture: "FAC-VTE-2026-0803", codeClient: "CLI-PHARM", codeProduit: "PRD-LAP-03", quantite: 2, puHT: 520000, montantHT: 1040000, tauxTVA: 18, montantTVA: 187200, montantTTC: 1227200 },
  { date: "2026-08-07", refFacture: "FAC-VTE-2026-0803", codeClient: "CLI-PHARM", codeProduit: "PRD-IMP-09", quantite: 1, puHT: 260000, montantHT: 260000, tauxTVA: 18, montantTVA: 46800, montantTTC: 306800 },

  // 10/08 : Comptoir des Plateaux (Plateaux - Kpalimé)
  { date: "2026-08-10", refFacture: "FAC-VTE-2026-0804", codeClient: "CLI-PLATEAU", codeProduit: "PRD-LAP-01", quantite: 3, puHT: 450000, montantHT: 1350000, tauxTVA: 18, montantTVA: 243000, montantTTC: 1593000 },
  { date: "2026-08-10", refFacture: "FAC-VTE-2026-0804", codeClient: "CLI-PLATEAU", codeProduit: "PRD-IMP-04", quantite: 2, puHT: 195000, montantHT: 390000, tauxTVA: 18, montantTVA: 70200, montantTTC: 460200 },

  // 12/08 : SOTOTO Transport (Maritime)
  { date: "2026-08-12", refFacture: "FAC-VTE-2026-0805", codeClient: "CLI-SOTOTO", codeProduit: "PRD-LAP-02", quantite: 2, puHT: 650000, montantHT: 1300000, tauxTVA: 18, montantTVA: 234000, montantTTC: 1534000 },
  { date: "2026-08-12", refFacture: "FAC-VTE-2026-0805", codeClient: "CLI-SOTOTO", codeProduit: "PRD-IMP-04", quantite: 2, puHT: 195000, montantHT: 390000, tauxTVA: 18, montantTVA: 70200, montantTTC: 460200 },
  { date: "2026-08-12", refFacture: "FAC-VTE-2026-0805", codeClient: "CLI-SOTOTO", codeProduit: "PRD-TON-08", quantite: 4, puHT: 45000, montantHT: 180000, tauxTVA: 18, montantTVA: 32400, montantTTC: 212400 },

  // 14/08 : Atakpamé Multi-Services (Plateaux)
  { date: "2026-08-14", refFacture: "FAC-VTE-2026-0806", codeClient: "CLI-ATAK", codeProduit: "PRD-LAP-01", quantite: 2, puHT: 450000, montantHT: 900000, tauxTVA: 18, montantTVA: 162000, montantTTC: 1062000 },
  { date: "2026-08-14", refFacture: "FAC-VTE-2026-0806", codeClient: "CLI-ATAK", codeProduit: "PRD-OND-08", quantite: 4, puHT: 65000, montantHT: 260000, tauxTVA: 18, montantTVA: 46800, montantTTC: 306800 },

  // 17/08 : Centrale Agro-Pastorale (Centrale - Sokodé)
  { date: "2026-08-17", refFacture: "FAC-VTE-2026-0807", codeClient: "CLI-AGROK", codeProduit: "PRD-LAP-02", quantite: 1, puHT: 650000, montantHT: 650000, tauxTVA: 18, montantTVA: 117000, montantTTC: 767000 },
  { date: "2026-08-17", refFacture: "FAC-VTE-2026-0807", codeClient: "CLI-AGROK", codeProduit: "PRD-OND-05", quantite: 1, puHT: 280000, montantHT: 280000, tauxTVA: 18, montantTVA: 50400, montantTTC: 330400 },
  { date: "2026-08-17", refFacture: "FAC-VTE-2026-0807", codeClient: "CLI-AGROK", codeProduit: "PRD-IMP-04", quantite: 1, puHT: 195000, montantHT: 195000, tauxTVA: 18, montantTVA: 35100, montantTTC: 230100 },

  // 18/08 : Cabinet Conseil Horizon & Associés (Maritime)
  { date: "2026-08-18", refFacture: "FAC-VTE-2026-0808", codeClient: "CLI-HORIZON", codeProduit: "PRD-LAP-02", quantite: 1, puHT: 650000, montantHT: 650000, tauxTVA: 18, montantTVA: 117000, montantTTC: 767000 },
  { date: "2026-08-18", refFacture: "FAC-VTE-2026-0808", codeClient: "CLI-HORIZON", codeProduit: "PRD-ECR-03", quantite: 1, puHT: 110000, montantHT: 110000, tauxTVA: 18, montantTVA: 19800, montantTTC: 129800 },

  // 19/08 : Coopérative Moderne de Blitta (Centrale)
  { date: "2026-08-19", refFacture: "FAC-VTE-2026-0809", codeClient: "CLI-BLITTA", codeProduit: "PRD-LAP-01", quantite: 1, puHT: 450000, montantHT: 450000, tauxTVA: 18, montantTVA: 81000, montantTTC: 531000 },
  { date: "2026-08-19", refFacture: "FAC-VTE-2026-0809", codeClient: "CLI-BLITTA", codeProduit: "PRD-IMP-04", quantite: 1, puHT: 195000, montantHT: 195000, tauxTVA: 18, montantTVA: 35100, montantTTC: 230100 },

  // 20/08 : Kara Tech Solutions (Kara Ville)
  { date: "2026-08-20", refFacture: "FAC-VTE-2026-0810", codeClient: "CLI-KARA-T", codeProduit: "PRD-LAP-01", quantite: 2, puHT: 450000, montantHT: 900000, tauxTVA: 18, montantTVA: 162000, montantTTC: 1062000 },
  { date: "2026-08-20", refFacture: "FAC-VTE-2026-0810", codeClient: "CLI-KARA-T", codeProduit: "PRD-CAB-07", quantite: 3, puHT: 65000, montantHT: 195000, tauxTVA: 18, montantTVA: 35100, montantTTC: 230100 },
  { date: "2026-08-20", refFacture: "FAC-VTE-2026-0810", codeClient: "CLI-KARA-T", codeProduit: "PRD-OND-05", quantite: 2, puHT: 280000, montantHT: 560000, tauxTVA: 18, montantTVA: 100800, montantTTC: 660800 },

  // 21/08 : Comptoir Équipements de Bassar (Kara)
  { date: "2026-08-21", refFacture: "FAC-VTE-2026-0811", codeClient: "CLI-BASSAR", codeProduit: "PRD-LAP-03", quantite: 1, puHT: 520000, montantHT: 520000, tauxTVA: 18, montantTVA: 93600, montantTTC: 613600 },
  { date: "2026-08-21", refFacture: "FAC-VTE-2026-0811", codeClient: "CLI-BASSAR", codeProduit: "PRD-OND-08", quantite: 2, puHT: 65000, montantHT: 130000, tauxTVA: 18, montantTVA: 23400, montantTTC: 153400 },

  // 24/08 : Consortium Savanes Équipements (Dapaong - Savanes)
  { date: "2026-08-24", refFacture: "FAC-VTE-2026-0812", codeClient: "CLI-SAVAN", codeProduit: "PRD-LAP-01", quantite: 2, puHT: 450000, montantHT: 900000, tauxTVA: 18, montantTVA: 162000, montantTTC: 1062000 },
  { date: "2026-08-24", refFacture: "FAC-VTE-2026-0812", codeClient: "CLI-SAVAN", codeProduit: "PRD-IMP-04", quantite: 1, puHT: 195000, montantHT: 195000, tauxTVA: 18, montantTVA: 35100, montantTTC: 230100 },
  { date: "2026-08-24", refFacture: "FAC-VTE-2026-0812", codeClient: "CLI-SAVAN", codeProduit: "PRD-OND-05", quantite: 2, puHT: 280000, montantHT: 560000, tauxTVA: 18, montantTVA: 100800, montantTTC: 660800 },

  // 25/08 : Agro-Bureautique de l'Oti (Mango - Savanes)
  { date: "2026-08-25", refFacture: "FAC-VTE-2026-0813", codeClient: "CLI-MANGO", codeProduit: "PRD-LAP-01", quantite: 1, puHT: 450000, montantHT: 450000, tauxTVA: 18, montantTVA: 81000, montantTTC: 531000 },
  { date: "2026-08-25", refFacture: "FAC-VTE-2026-0813", codeClient: "CLI-MANGO", codeProduit: "PRD-IMP-09", quantite: 1, puHT: 260000, montantHT: 260000, tauxTVA: 18, montantTVA: 46800, montantTTC: 306800 },

  // 26/08 : Eco-Agri Maritime Distribution Aného (Maritime)
  { date: "2026-08-26", refFacture: "FAC-VTE-2026-0814", codeClient: "CLI-ANEHO", codeProduit: "PRD-LAP-02", quantite: 1, puHT: 650000, montantHT: 650000, tauxTVA: 18, montantTVA: 117000, montantTTC: 767000 },
  { date: "2026-08-26", refFacture: "FAC-VTE-2026-0814", codeClient: "CLI-ANEHO", codeProduit: "PRD-OND-08", quantite: 2, puHT: 65000, montantHT: 130000, tauxTVA: 18, montantTVA: 23400, montantTTC: 153400 },

  // 27/08 : SOGEA SATOM Togo (Deuxième commande du mois - Maritime)
  { date: "2026-08-27", refFacture: "FAC-VTE-2026-0815", codeClient: "CLI-SOGEA", codeProduit: "PRD-LAP-02", quantite: 3, puHT: 650000, montantHT: 1950000, tauxTVA: 18, montantTVA: 351000, montantTTC: 2301000 },
  { date: "2026-08-27", refFacture: "FAC-VTE-2026-0815", codeClient: "CLI-SOGEA", codeProduit: "PRD-ECR-03", quantite: 3, puHT: 110000, montantHT: 330000, tauxTVA: 18, montantTVA: 59400, montantTTC: 389400 },
  { date: "2026-08-27", refFacture: "FAC-VTE-2026-0815", codeClient: "CLI-SOGEA", codeProduit: "PRD-CAB-07", quantite: 6, puHT: 65000, montantHT: 390000, tauxTVA: 18, montantTVA: 70200, montantTTC: 460200 },

  // 28/08 : TOTALENERGIES (Deuxième commande : Équipements Réseau & Maintenance - Maritime)
  { date: "2026-08-28", refFacture: "FAC-VTE-2026-0816", codeClient: "CLI-TOTAL", codeProduit: "PRD-SWI-10", quantite: 2, puHT: 420000, montantHT: 840000, tauxTVA: 18, montantTVA: 151200, montantTTC: 991200 },
  { date: "2026-08-28", refFacture: "FAC-VTE-2026-0816", codeClient: "CLI-TOTAL", codeProduit: "PRD-SRV-MNT", quantite: 2, puHT: 350000, montantHT: 700000, tauxTVA: 18, montantTVA: 126000, montantTTC: 826000 },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. ACHATS DÉTAILLÉS BI (10 COMMANDES D'APPROVISIONNEMENT SUR AOÛT 2026)
// ─────────────────────────────────────────────────────────────────────────────

export const TEST_ACHATS_BI_1MOIS = [
  // 01/08 : Stock initial ordinateurs et écrans
  { date: "2026-08-01", refCommande: "CMD-2026-0801", codeFournisseur: "FOUR-TECH-LOME", codeArticle: "PRD-LAP-01", quantite: 10, puHT: 315000, montantHT: 3150000, tauxTVA: 18, montantTVA: 567000, montantTTC: 3717000 },
  { date: "2026-08-01", refCommande: "CMD-2026-0801", codeFournisseur: "FOUR-TECH-LOME", codeArticle: "PRD-ECR-03", quantite: 10, puHT: 75000, montantHT: 750000, tauxTVA: 18, montantTVA: 135000, montantTTC: 885000 },

  // 04/08 : Serveurs Dell et câbles réseau Cat6
  { date: "2026-08-04", refCommande: "CMD-2026-0802", codeFournisseur: "FOUR-DISTRIB-AFRICA", codeArticle: "PRD-SRV-06", quantite: 3, puHT: 850000, montantHT: 2550000, tauxTVA: 18, montantTVA: 459000, montantTTC: 3009000 },
  { date: "2026-08-04", refCommande: "CMD-2026-0802", codeFournisseur: "FOUR-DISTRIB-AFRICA", codeArticle: "PRD-CAB-07", quantite: 15, puHT: 42000, montantHT: 630000, tauxTVA: 18, montantTVA: 113400, montantTTC: 743400 },

  // 08/08 : Portables Dell Vostro & Lenovo ThinkPad
  { date: "2026-08-08", refCommande: "CMD-2026-0803", codeFournisseur: "FOUR-TECH-LOME", codeArticle: "PRD-LAP-02", quantite: 8, puHT: 455000, montantHT: 3640000, tauxTVA: 18, montantTVA: 655200, montantTTC: 4295200 },
  { date: "2026-08-08", refCommande: "CMD-2026-0803", codeFournisseur: "FOUR-TECH-LOME", codeArticle: "PRD-LAP-03", quantite: 5, puHT: 370000, montantHT: 1850000, tauxTVA: 18, montantTVA: 333000, montantTTC: 2183000 },

  // 13/08 : Onduleurs APC Smart-UPS et Back-UPS
  { date: "2026-08-13", refCommande: "CMD-2026-0804", codeFournisseur: "FOUR-DISTRIB-AFRICA", codeArticle: "PRD-OND-05", quantite: 10, puHT: 190000, montantHT: 1900000, tauxTVA: 18, montantTVA: 342000, montantTTC: 2242000 },
  { date: "2026-08-13", refCommande: "CMD-2026-0804", codeFournisseur: "FOUR-DISTRIB-AFRICA", codeArticle: "PRD-OND-08", quantite: 15, puHT: 42000, montantHT: 630000, tauxTVA: 18, montantTVA: 113400, montantTTC: 743400 },

  // 18/08 : Imprimantes Epson, HP LaserJet et Toners
  { date: "2026-08-18", refCommande: "CMD-2026-0805", codeFournisseur: "FOUR-GLOBAL-IMPORT", codeArticle: "PRD-IMP-04", quantite: 8, puHT: 135000, montantHT: 1080000, tauxTVA: 18, montantTVA: 194400, montantTTC: 1274400 },
  { date: "2026-08-18", refCommande: "CMD-2026-0805", codeFournisseur: "FOUR-GLOBAL-IMPORT", codeArticle: "PRD-IMP-09", quantite: 4, puHT: 180000, montantHT: 720000, tauxTVA: 18, montantTVA: 129600, montantTTC: 849600 },
  { date: "2026-08-18", refCommande: "CMD-2026-0805", codeFournisseur: "FOUR-GLOBAL-IMPORT", codeArticle: "PRD-TON-08", quantite: 30, puHT: 28000, montantHT: 840000, tauxTVA: 18, montantTVA: 151200, montantTTC: 991200 },

  // 22/08 : Switches Cisco Gigabit PoE+
  { date: "2026-08-22", refCommande: "CMD-2026-0806", codeFournisseur: "FOUR-DISTRIB-AFRICA", codeArticle: "PRD-SWI-10", quantite: 4, puHT: 295000, montantHT: 1180000, tauxTVA: 18, montantTVA: 212400, montantTTC: 1392400 },
];

// ─────────────────────────────────────────────────────────────────────────────
// 5. ÉCRITURES COMPTABLES SYSCOHADA (45 ÉCRITURES / 115 LIGNES ÉQUILIBRÉES)
// ─────────────────────────────────────────────────────────────────────────────

export const TEST_ECRITURES_1MOIS: TestEcritureLine[] = [
  // ── 01/08 : Loyer commercial Lomé Tokoin avec Retenue 10% CGI art. 195 ──
  { Journal: "ACHATS", Date: "2026-08-01", Piece: "FAC-ACH-2026-0801", Compte: "621100", Libelle: "Loyer commercial siège Lomé Tokoin - SCI Prestige Golfe (Août 2026)", Debit: 600000, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-01", Piece: "FAC-ACH-2026-0801", Compte: "442100", Libelle: "État Togo - Retenue à la source 10% s/loyer commercial (CGI art. 195)", Debit: 0, Credit: 60000 },
  { Journal: "ACHATS", Date: "2026-08-01", Piece: "FAC-ACH-2026-0801", Compte: "401100", Libelle: "Fournisseur SCI Prestige Golfe Lomé (Net à payer)", Debit: 0, Credit: 540000 },

  // ── 01/08 : Achat stock informatique CMD-2026-0801 (FOUR-TECH-LOME) ──
  { Journal: "ACHATS", Date: "2026-08-01", Piece: "FAC-ACH-2026-0802", Compte: "601100", Libelle: "Achat stock : 10x HP ProBook + 10x Moniteurs Dell 24 FHD HT", Debit: 3900000, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-01", Piece: "FAC-ACH-2026-0802", Compte: "445200", Libelle: "État Togo - TVA déductible 18% s/achats matériel info", Debit: 702000, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-01", Piece: "FAC-ACH-2026-0802", Compte: "401100", Libelle: "Fournisseur Comptoir Général Info Lomé (Fact. F-CGI-2026-892)", Debit: 0, Credit: 4602000 },

  // ── 02/08 : Virement bancaire règlement loyer ──
  { Journal: "BANQUE", Date: "2026-08-02", Piece: "VIR-BQ-2026-0801", Compte: "401100", Libelle: "Règlement net loyer SCI Prestige Golfe", Debit: 540000, Credit: 0 },
  { Journal: "BANQUE", Date: "2026-08-02", Piece: "VIR-BQ-2026-0801", Compte: "521100", Libelle: "Virement émis compte Ecobank Togo (N° 012019482710)", Debit: 0, Credit: 540000 },

  // ── 03/08 : Vente SOGEA SATOM Togo (Maritime) ──
  { Journal: "VENTES", Date: "2026-08-03", Piece: "FAC-VTE-2026-0801", Compte: "411100", Libelle: "Client SOGEA SATOM Togo SA (Lomé Port - Maritime)", Debit: 3304000, Credit: 0 },
  { Journal: "VENTES", Date: "2026-08-03", Piece: "FAC-VTE-2026-0801", Compte: "701100", Libelle: "Vente 4x HP ProBook + 4x Écrans Dell + 2x Onduleurs APC HT", Debit: 0, Credit: 2800000 },
  { Journal: "VENTES", Date: "2026-08-03", Piece: "FAC-VTE-2026-0801", Compte: "443100", Libelle: "État Togo - TVA facturée collectée 18% s/ventes SOGEA", Debit: 0, Credit: 504000 },

  // ── 04/08 : Achat serveurs & câbles CMD-2026-0802 (Africa IT Distribution) ──
  { Journal: "ACHATS", Date: "2026-08-04", Piece: "FAC-ACH-2026-0803", Compte: "601100", Libelle: "Achat 3x Serveurs Dell PowerEdge T150 + 15x Bobines RJ45 Cat6 HT", Debit: 3180000, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-04", Piece: "FAC-ACH-2026-0803", Compte: "445200", Libelle: "État Togo - TVA déductible 18% s/serveurs & réseaux", Debit: 572400, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-04", Piece: "FAC-ACH-2026-0803", Compte: "401100", Libelle: "Fournisseur Africa IT Distribution Togo (Hedzranawoé Lomé)", Debit: 0, Credit: 3752400 },

  // ── 05/08 : Vente TOTALENERGIES MARKETING TOGO (Maritime) ──
  { Journal: "VENTES", Date: "2026-08-05", Piece: "FAC-VTE-2026-0802", Compte: "411100", Libelle: "Client TOTALENERGIES TOGO (Boulevard Circulaire Lomé - Maritime)", Debit: 3492800, Credit: 0 },
  { Journal: "VENTES", Date: "2026-08-05", Piece: "FAC-VTE-2026-0802", Compte: "701100", Libelle: "Vente 2x Serveurs Dell PowerEdge T150 + 2x Onduleurs APC 1500VA HT", Debit: 0, Credit: 2960000 },
  { Journal: "VENTES", Date: "2026-08-05", Piece: "FAC-VTE-2026-0802", Compte: "443100", Libelle: "État Togo - TVA facturée collectée 18% s/ventes TOTALENERGIES", Debit: 0, Credit: 532800 },

  // ── 06/08 : Retrait DAB Ecobank pour approvisionnement caisse ──
  { Journal: "BANQUE", Date: "2026-08-06", Piece: "RET-DAB-2026-0801", Compte: "571100", Libelle: "Alimentation caisse centrale par retrait espèces DAB Ecobank", Debit: 400000, Credit: 0 },
  { Journal: "BANQUE", Date: "2026-08-06", Piece: "RET-DAB-2026-0801", Compte: "521100", Libelle: "Débit retrait espèces compte courant Ecobank Togo", Debit: 0, Credit: 400000 },

  // ── 07/08 : Vente Société Togolaise de Pharmacie (Maritime) ──
  { Journal: "VENTES", Date: "2026-08-07", Piece: "FAC-VTE-2026-0803", Compte: "411100", Libelle: "Client Société Togolaise de Pharmacie (Nyékonakpoè Lomé)", Debit: 1534000, Credit: 0 },
  { Journal: "VENTES", Date: "2026-08-07", Piece: "FAC-VTE-2026-0803", Compte: "701100", Libelle: "Vente 2x Lenovo ThinkPad L14 + 1x Imprimante HP LaserJet HT", Debit: 0, Credit: 1300000 },
  { Journal: "VENTES", Date: "2026-08-07", Piece: "FAC-VTE-2026-0803", Compte: "443100", Libelle: "État Togo - TVA facturée collectée 18% s/ventes Pharmacie", Debit: 0, Credit: 234000 },

  // ── 08/08 : Achat PC portables Dell & Lenovo CMD-2026-0803 (FOUR-TECH-LOME) ──
  { Journal: "ACHATS", Date: "2026-08-08", Piece: "FAC-ACH-2026-0804", Compte: "601100", Libelle: "Achat 8x Dell Vostro i7 + 5x Lenovo ThinkPad i5 HT", Debit: 5490000, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-08", Piece: "FAC-ACH-2026-0804", Compte: "445200", Libelle: "État Togo - TVA déductible 18% s/achats portables", Debit: 988200, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-08", Piece: "FAC-ACH-2026-0804", Compte: "401100", Libelle: "Fournisseur Comptoir Général Info Lomé (Fact. F-CGI-2026-904)", Debit: 0, Credit: 6478200 },

  // ── 09/08 : Dépenses de caisse (Fournitures + timbres fiscaux OTR) ──
  { Journal: "CAISSE", Date: "2026-08-09", Piece: "PC-CAI-2026-0801", Compte: "604700", Libelle: "Papeterie et fournitures de bureau pour le siège Tokoin", Debit: 65000, Credit: 0 },
  { Journal: "CAISSE", Date: "2026-08-09", Piece: "PC-CAI-2026-0801", Compte: "631100", Libelle: "Achat timbres fiscaux quittances Commissariat des Impôts OTR", Debit: 25000, Credit: 0 },
  { Journal: "CAISSE", Date: "2026-08-09", Piece: "PC-CAI-2026-0801", Compte: "571100", Libelle: "Sortie espèces caisse centrale", Debit: 0, Credit: 90000 },

  // ── 10/08 : Encaissement virement SOGEA SATOM Togo (FAC-VTE-2026-0801) ──
  { Journal: "BANQUE", Date: "2026-08-10", Piece: "VIR-BQ-2026-0802", Compte: "521100", Libelle: "Virement reçu SOGEA SATOM Togo SA sur compte Ecobank", Debit: 3304000, Credit: 0 },
  { Journal: "BANQUE", Date: "2026-08-10", Piece: "VIR-BQ-2026-0802", Compte: "411100", Libelle: "Règlement complet facture FAC-VTE-2026-0801 SOGEA SATOM", Debit: 0, Credit: 3304000 },

  // ── 10/08 : Vente Région des Plateaux - Comptoir des Plateaux (Kpalimé) ──
  { Journal: "VENTES", Date: "2026-08-10", Piece: "FAC-VTE-2026-0804", Compte: "411100", Libelle: "Client Comptoir Commercial des Plateaux (Kpalimé - Plateaux)", Debit: 2053200, Credit: 0 },
  { Journal: "VENTES", Date: "2026-08-10", Piece: "FAC-VTE-2026-0804", Compte: "701100", Libelle: "Vente 3x HP ProBook + 2x Imprimantes Epson EcoTank HT", Debit: 0, Credit: 1740000 },
  { Journal: "VENTES", Date: "2026-08-10", Piece: "FAC-VTE-2026-0804", Compte: "443100", Libelle: "État Togo - TVA facturée collectée 18% s/ventes Kpalimé", Debit: 0, Credit: 313200 },

  // ── 11/08 : Virement paiement acompte fournisseur Comptoir Général Info Lomé ──
  { Journal: "BANQUE", Date: "2026-08-11", Piece: "VIR-BQ-2026-0803", Compte: "401100", Libelle: "Paiement acompte fournisseur Comptoir Général Info Lomé", Debit: 3000000, Credit: 0 },
  { Journal: "BANQUE", Date: "2026-08-11", Piece: "VIR-BQ-2026-0803", Compte: "521100", Libelle: "Virement émis par Ecobank Togo", Debit: 0, Credit: 3000000 },

  // ── 12/08 : Vente SOTOTO Transport Zone Franche Lomé (Maritime) ──
  { Journal: "VENTES", Date: "2026-08-12", Piece: "FAC-VTE-2026-0805", Compte: "411100", Libelle: "Client SOTOTO Transport (Zone Franche Lomé - Maritime)", Debit: 2206600, Credit: 0 },
  { Journal: "VENTES", Date: "2026-08-12", Piece: "FAC-VTE-2026-0805", Compte: "701100", Libelle: "Vente 2x Dell Vostro i7 + 2x Imprimantes Epson + 4x Toners HT", Debit: 0, Credit: 1870000 },
  { Journal: "VENTES", Date: "2026-08-12", Piece: "FAC-VTE-2026-0805", Compte: "443100", Libelle: "État Togo - TVA facturée collectée 18% s/ventes SOTOTO", Debit: 0, Credit: 336600 },

  // ── 13/08 : Achat onduleurs APC CMD-2026-0804 (Africa IT Distribution) ──
  { Journal: "ACHATS", Date: "2026-08-13", Piece: "FAC-ACH-2026-0805", Compte: "601100", Libelle: "Achat 10x Onduleurs APC Smart-UPS 1500VA + 15x Back-UPS 650VA HT", Debit: 2530000, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-13", Piece: "FAC-ACH-2026-0805", Compte: "445200", Libelle: "État Togo - TVA déductible 18% s/achats onduleurs APC", Debit: 455400, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-13", Piece: "FAC-ACH-2026-0805", Compte: "401100", Libelle: "Fournisseur Africa IT Distribution Togo (Fact. F-AIT-2026-312)", Debit: 0, Credit: 2985400 },

  // ── 14/08 : Vente Atakpamé Multi-Services (Plateaux) ──
  { Journal: "VENTES", Date: "2026-08-14", Piece: "FAC-VTE-2026-0806", Compte: "411100", Libelle: "Client Atakpamé Multi-Services (Atakpamé - Plateaux)", Debit: 1368800, Credit: 0 },
  { Journal: "VENTES", Date: "2026-08-14", Piece: "FAC-VTE-2026-0806", Compte: "701100", Libelle: "Vente 2x HP ProBook + 4x Onduleurs APC 650VA HT", Debit: 0, Credit: 1160000 },
  { Journal: "VENTES", Date: "2026-08-14", Piece: "FAC-VTE-2026-0806", Compte: "443100", Libelle: "État Togo - TVA facturée collectée 18% s/ventes Atakpamé", Debit: 0, Credit: 208800 },

  // ── 14/08 : Facture Électricité CEET Lomé Siège & Paiement bancaire ──
  { Journal: "ACHATS", Date: "2026-08-14", Piece: "FAC-ACH-2026-0806", Compte: "605100", Libelle: "Consommation électricité CEET Lomé siège Tokoin (Août 2026)", Debit: 320000, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-14", Piece: "FAC-ACH-2026-0806", Compte: "445200", Libelle: "État Togo - TVA déductible 18% s/électricité CEET", Debit: 57600, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-14", Piece: "FAC-ACH-2026-0806", Compte: "401100", Libelle: "Fournisseur public CEET Togo (Facture N° E-2026-08-0419)", Debit: 0, Credit: 377600 },
  { Journal: "BANQUE", Date: "2026-08-14", Piece: "VIR-BQ-2026-0804", Compte: "401100", Libelle: "Règlement facture CEET Togo par virement bancaire", Debit: 377600, Credit: 0 },
  { Journal: "BANQUE", Date: "2026-08-14", Piece: "VIR-BQ-2026-0804", Compte: "521100", Libelle: "Virement émis compte Ecobank Togo vers CEET", Debit: 0, Credit: 377600 },

  // ── 15/08 : Télérèglement OTR - TVA due du mois de Juillet 2026 ──
  { Journal: "BANQUE", Date: "2026-08-15", Piece: "VIR-BQ-2026-0805", Compte: "445600", Libelle: "Télérèglement déclaration TVA Juillet 2026 au Commissariat Impôts OTR", Debit: 580000, Credit: 0 },
  { Journal: "BANQUE", Date: "2026-08-15", Piece: "VIR-BQ-2026-0805", Compte: "521100", Libelle: "Débit télérèglement fiscal plateforme e-Tax OTR Togo", Debit: 0, Credit: 580000 },

  // ── 17/08 : Encaissement virement TOTALENERGIES TOGO (FAC-VTE-2026-0802) ──
  { Journal: "BANQUE", Date: "2026-08-17", Piece: "VIR-BQ-2026-0806", Compte: "521100", Libelle: "Virement reçu TOTALENERGIES TOGO sur compte Ecobank", Debit: 3492800, Credit: 0 },
  { Journal: "BANQUE", Date: "2026-08-17", Piece: "VIR-BQ-2026-0806", Compte: "411100", Libelle: "Règlement complet facture serveurs FAC-VTE-2026-0802 TOTALENERGIES", Debit: 0, Credit: 3492800 },

  // ── 17/08 : Vente Région Centrale - Centrale Agro-Pastorale (Sokodé) ──
  { Journal: "VENTES", Date: "2026-08-17", Piece: "FAC-VTE-2026-0807", Compte: "411100", Libelle: "Client Centrale Agro-Pastorale (Sokodé - Centrale)", Debit: 1327500, Credit: 0 },
  { Journal: "VENTES", Date: "2026-08-17", Piece: "FAC-VTE-2026-0807", Compte: "701100", Libelle: "Vente 1x Dell Vostro + 1x Onduleur APC + 1x Imprimante Epson HT", Debit: 0, Credit: 1125000 },
  { Journal: "VENTES", Date: "2026-08-17", Piece: "FAC-VTE-2026-0807", Compte: "443100", Libelle: "État Togo - TVA facturée collectée 18% s/ventes Sokodé", Debit: 0, Credit: 202500 },

  // ── 18/08 : Achat imprimantes & toners CMD-2026-0805 (Global Import & Fret) ──
  { Journal: "ACHATS", Date: "2026-08-18", Piece: "FAC-ACH-2026-0807", Compte: "601100", Libelle: "Achat 8x Epson L3250 + 4x HP LaserJet + 30x Toners Noirs HT", Debit: 2640000, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-18", Piece: "FAC-ACH-2026-0807", Compte: "445200", Libelle: "État Togo - TVA déductible 18% s/achats imprimantes et toners", Debit: 475200, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-18", Piece: "FAC-ACH-2026-0807", Compte: "401100", Libelle: "Fournisseur Global Import & Fret Maritime Togo (Fact. G-2026-104)", Debit: 0, Credit: 3115200 },

  // ── 18/08 : Vente Cabinet Conseil Horizon & Associés (Maritime) ──
  { Journal: "VENTES", Date: "2026-08-18", Piece: "FAC-VTE-2026-0808", Compte: "411100", Libelle: "Client Cabinet Horizon & Associés (Tokoin Lomé - Maritime)", Debit: 896800, Credit: 0 },
  { Journal: "VENTES", Date: "2026-08-18", Piece: "FAC-VTE-2026-0808", Compte: "701100", Libelle: "Vente 1x Portable Dell Vostro Core i7 + 1x Écran Dell 24 FHD HT", Debit: 0, Credit: 760000 },
  { Journal: "VENTES", Date: "2026-08-18", Piece: "FAC-VTE-2026-0808", Compte: "443100", Libelle: "État Togo - TVA facturée collectée 18% s/ventes Cabinet Horizon", Debit: 0, Credit: 136800 },

  // ── 19/08 : Vente Coopérative Moderne de Blitta (Centrale) ──
  { Journal: "VENTES", Date: "2026-08-19", Piece: "FAC-VTE-2026-0809", Compte: "411100", Libelle: "Client Coopérative Moderne de Blitta (Blitta - Centrale)", Debit: 761100, Credit: 0 },
  { Journal: "VENTES", Date: "2026-08-19", Piece: "FAC-VTE-2026-0809", Compte: "701100", Libelle: "Vente 1x HP ProBook + 1x Imprimante Epson EcoTank HT", Debit: 0, Credit: 645000 },
  { Journal: "VENTES", Date: "2026-08-19", Piece: "FAC-VTE-2026-0809", Compte: "443100", Libelle: "État Togo - TVA facturée collectée 18% s/ventes Blitta", Debit: 0, Credit: 116100 },

  // ── 20/08 : Vente Kara Tech Solutions SARL (Région Kara) ──
  { Journal: "VENTES", Date: "2026-08-20", Piece: "FAC-VTE-2026-0810", Compte: "411100", Libelle: "Client Kara Tech Solutions SARL (Centre-ville Kara - Kara)", Debit: 1952900, Credit: 0 },
  { Journal: "VENTES", Date: "2026-08-20", Piece: "FAC-VTE-2026-0810", Compte: "701100", Libelle: "Vente 2x HP ProBook + 3x Câbles RJ45 + 2x Onduleurs APC HT", Debit: 0, Credit: 1655000 },
  { Journal: "VENTES", Date: "2026-08-20", Piece: "FAC-VTE-2026-0810", Compte: "443100", Libelle: "État Togo - TVA facturée collectée 18% s/ventes Kara", Debit: 0, Credit: 297900 },

  // ── 21/08 : Encaissement virement SOTOTO Transport (FAC-VTE-2026-0805) ──
  { Journal: "BANQUE", Date: "2026-08-21", Piece: "VIR-BQ-2026-0807", Compte: "521100", Libelle: "Virement reçu Société SOTOTO Zone Franche Lomé sur Ecobank", Debit: 2206600, Credit: 0 },
  { Journal: "BANQUE", Date: "2026-08-21", Piece: "VIR-BQ-2026-0807", Compte: "411100", Libelle: "Règlement complet facture FAC-VTE-2026-0805 SOTOTO", Debit: 0, Credit: 2206600 },

  // ── 21/08 : Vente Comptoir Équipements de Bassar (Kara) ──
  { Journal: "VENTES", Date: "2026-08-21", Piece: "FAC-VTE-2026-0811", Compte: "411100", Libelle: "Client Comptoir Équipements de Bassar (Bassar - Kara)", Debit: 767000, Credit: 0 },
  { Journal: "VENTES", Date: "2026-08-21", Piece: "FAC-VTE-2026-0811", Compte: "701100", Libelle: "Vente 1x Lenovo ThinkPad + 2x Onduleurs 650VA HT", Debit: 0, Credit: 650000 },
  { Journal: "VENTES", Date: "2026-08-21", Piece: "FAC-VTE-2026-0811", Compte: "443100", Libelle: "État Togo - TVA facturée collectée 18% s/ventes Bassar", Debit: 0, Credit: 117000 },

  // ── 22/08 : Achat Switches Cisco CMD-2026-0806 (Africa IT Distribution) ──
  { Journal: "ACHATS", Date: "2026-08-22", Piece: "FAC-ACH-2026-0808", Compte: "601100", Libelle: "Achat 4x Switches Cisco Gigabit 24 Ports PoE+ Managés HT", Debit: 1180000, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-22", Piece: "FAC-ACH-2026-0808", Compte: "445200", Libelle: "État Togo - TVA déductible 18% s/switches Cisco", Debit: 212400, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-22", Piece: "FAC-ACH-2026-0808", Compte: "401100", Libelle: "Fournisseur Africa IT Distribution Togo (Fact. F-AIT-2026-340)", Debit: 0, Credit: 1392400 },

  // ── 22/08 : Facture TOGOCOM Fibre optique 100 Mbps & Télécoms ──
  { Journal: "ACHATS", Date: "2026-08-22", Piece: "FAC-ACH-2026-0809", Compte: "628100", Libelle: "Abonnement internet très haut débit Fibre 100 Mbps & télécoms TOGOCOM Siège", Debit: 150000, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-22", Piece: "FAC-ACH-2026-0809", Compte: "445200", Libelle: "État Togo - TVA déductible 18% s/télécoms TOGOCOM", Debit: 27000, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-22", Piece: "FAC-ACH-2026-0809", Compte: "401100", Libelle: "Fournisseur opérateur TOGOCOM (Facture N° FIB-2026-08-88)", Debit: 0, Credit: 177000 },

  // ── 23/08 : Virement bancaire règlement fournisseur Africa IT Distribution Togo ──
  { Journal: "BANQUE", Date: "2026-08-23", Piece: "VIR-BQ-2026-0808", Compte: "401100", Libelle: "Règlement partiel factures Africa IT Distribution", Debit: 3500000, Credit: 0 },
  { Journal: "BANQUE", Date: "2026-08-23", Piece: "VIR-BQ-2026-0808", Compte: "521100", Libelle: "Virement émis compte Ecobank Togo", Debit: 0, Credit: 3500000 },

  // ── 24/08 : Vente Région des Savanes - Consortium Savanes (Dapaong) ──
  { Journal: "VENTES", Date: "2026-08-24", Piece: "FAC-VTE-2026-0812", Compte: "411100", Libelle: "Client Consortium Savanes Équipements (Dapaong - Savanes)", Debit: 1952900, Credit: 0 },
  { Journal: "VENTES", Date: "2026-08-24", Piece: "FAC-VTE-2026-0812", Compte: "701100", Libelle: "Vente 2x HP ProBook + 1x Imprimante Epson + 2x Onduleurs APC HT", Debit: 0, Credit: 1655000 },
  { Journal: "VENTES", Date: "2026-08-24", Piece: "FAC-VTE-2026-0812", Compte: "443100", Libelle: "État Togo - TVA facturée collectée 18% s/ventes Dapaong", Debit: 0, Credit: 297900 },

  // ── 25/08 : Vente Agro-Bureautique de l'Oti (Mango - Savanes) ──
  { Journal: "VENTES", Date: "2026-08-25", Piece: "FAC-VTE-2026-0813", Compte: "411100", Libelle: "Client Agro-Bureautique de l'Oti (Mango - Savanes)", Debit: 837800, Credit: 0 },
  { Journal: "VENTES", Date: "2026-08-25", Piece: "FAC-VTE-2026-0813", Compte: "701100", Libelle: "Vente 1x HP ProBook + 1x Imprimante HP LaserJet Pro HT", Debit: 0, Credit: 710000 },
  { Journal: "VENTES", Date: "2026-08-25", Piece: "FAC-VTE-2026-0813", Compte: "443100", Libelle: "État Togo - TVA facturée collectée 18% s/ventes Mango", Debit: 0, Credit: 127800 },

  // ── 25/08 : Encaissement virement Comptoir des Plateaux (Kpalimé) ──
  { Journal: "BANQUE", Date: "2026-08-25", Piece: "VIR-BQ-2026-0809", Compte: "521100", Libelle: "Virement reçu Comptoir Commercial des Plateaux Kpalimé sur Ecobank", Debit: 2053200, Credit: 0 },
  { Journal: "BANQUE", Date: "2026-08-25", Piece: "VIR-BQ-2026-0809", Compte: "411100", Libelle: "Règlement complet facture FAC-VTE-2026-0804 Comptoir Plateaux", Debit: 0, Credit: 2053200 },

  // ── 26/08 : Vente Eco-Agri Maritime Distribution (Aného - Maritime) ──
  { Journal: "VENTES", Date: "2026-08-26", Piece: "FAC-VTE-2026-0814", Compte: "411100", Libelle: "Client Eco-Agri Maritime Distribution (Aného - Maritime)", Debit: 920400, Credit: 0 },
  { Journal: "VENTES", Date: "2026-08-26", Piece: "FAC-VTE-2026-0814", Compte: "701100", Libelle: "Vente 1x Dell Vostro i7 + 2x Onduleurs Back-UPS 650VA HT", Debit: 0, Credit: 780000 },
  { Journal: "VENTES", Date: "2026-08-26", Piece: "FAC-VTE-2026-0814", Compte: "443100", Libelle: "État Togo - TVA facturée collectée 18% s/ventes Aného", Debit: 0, Credit: 140400 },

  // ── 26/08 : Honoraires Cabinet d'Expertise Comptable Alfa (Retenue 5% BNC CGI art. 195/207) ──
  { Journal: "ACHATS", Date: "2026-08-26", Piece: "FAC-ACH-2026-0810", Compte: "632100", Libelle: "Honoraires audit fiscal préventif & revue comptes - Cabinet Alfa Lomé", Debit: 750000, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-26", Piece: "FAC-ACH-2026-0810", Compte: "445200", Libelle: "État Togo - TVA déductible 18% s/honoraires audit Cabinet Alfa", Debit: 135000, Credit: 0 },
  { Journal: "ACHATS", Date: "2026-08-26", Piece: "FAC-ACH-2026-0810", Compte: "442100", Libelle: "État Togo - Retenue source 5% s/honoraires BNC (CGI Togo art. 195/207)", Debit: 0, Credit: 37500 },
  { Journal: "ACHATS", Date: "2026-08-26", Piece: "FAC-ACH-2026-0810", Compte: "401100", Libelle: "Fournisseur Cabinet d'Expertise Alfa Lomé (Net à payer honoraires)", Debit: 0, Credit: 847500 },

  // ── 27/08 : Vente SOGEA SATOM Togo - Commande n°2 (Maritime) ──
  { Journal: "VENTES", Date: "2026-08-27", Piece: "FAC-VTE-2026-0815", Compte: "411100", Libelle: "Client SOGEA SATOM Togo SA (Cde n°2 Chantiers Lomé - Maritime)", Debit: 3150600, Credit: 0 },
  { Journal: "VENTES", Date: "2026-08-27", Piece: "FAC-VTE-2026-0815", Compte: "701100", Libelle: "Vente 3x Dell Vostro i7 + 3x Écrans Dell 24 + 6x Bobines Câbles Cat6 HT", Debit: 0, Credit: 2670000 },
  { Journal: "VENTES", Date: "2026-08-27", Piece: "FAC-VTE-2026-0815", Compte: "443100", Libelle: "État Togo - TVA facturée collectée 18% s/ventes SOGEA Cde 2", Debit: 0, Credit: 480600 },

  // ── 28/08 : Vente TOTALENERGIES (Deuxième commande : Switches & Maintenance Réseau) ──
  { Journal: "VENTES", Date: "2026-08-28", Piece: "FAC-VTE-2026-0816", Compte: "411100", Libelle: "Client TOTALENERGIES TOGO (Cde n°2 Réseau Siège Lomé)", Debit: 1817200, Credit: 0 },
  { Journal: "VENTES", Date: "2026-08-28", Piece: "FAC-VTE-2026-0816", Compte: "701100", Libelle: "Vente 2x Switches Cisco Gigabit PoE+ Managés HT", Debit: 0, Credit: 840000 },
  { Journal: "VENTES", Date: "2026-08-28", Piece: "FAC-VTE-2026-0816", Compte: "706100", Libelle: "Prestation d'intégration réseau & paramétrage VLANs HT", Debit: 0, Credit: 700000 },
  { Journal: "VENTES", Date: "2026-08-28", Piece: "FAC-VTE-2026-0816", Compte: "443100", Libelle: "État Togo - TVA facturée collectée 18% s/équipements & services", Debit: 0, Credit: 277200 },

  // ── 28/08 : Virement bancaire règlement TOGOCOM et Cabinet Alfa ──
  { Journal: "BANQUE", Date: "2026-08-28", Piece: "VIR-BQ-2026-0810", Compte: "401100", Libelle: "Règlement virement facture TOGOCOM Fibre", Debit: 177000, Credit: 0 },
  { Journal: "BANQUE", Date: "2026-08-28", Piece: "VIR-BQ-2026-0810", Compte: "401100", Libelle: "Règlement virement net honoraires Cabinet Alfa Lomé", Debit: 847500, Credit: 0 },
  { Journal: "BANQUE", Date: "2026-08-28", Piece: "VIR-BQ-2026-0810", Compte: "521100", Libelle: "Virement groupé fournisseurs émis via Ecobank Togo", Debit: 0, Credit: 1024500 },

  // ── 29/08 : Frais bancaires et agios Ecobank Togo ──
  { Journal: "BANQUE", Date: "2026-08-29", Piece: "AGI-BQ-2026-0801", Compte: "627100", Libelle: "Frais de tenue de compte & commissions virements d'Août Ecobank", Debit: 45000, Credit: 0 },
  { Journal: "BANQUE", Date: "2026-08-29", Piece: "AGI-BQ-2026-0801", Compte: "445200", Libelle: "État Togo - TVA déductible 18% s/services bancaires", Debit: 8100, Credit: 0 },
  { Journal: "BANQUE", Date: "2026-08-29", Piece: "AGI-BQ-2026-0801", Compte: "521100", Libelle: "Prélèvement automatique mensuel frais Ecobank Togo", Debit: 0, Credit: 53100 },

  // ── 30/08 : Paie du mois d'Août 2026 (7 salariés AFRIQ-TECH : CNSS 19%, AMU 10%, IRPP OTR) ──
  { Journal: "PAIE", Date: "2026-08-30", Piece: "PAIE-2026-0801", Compte: "661100", Libelle: "Salaires bruts du personnel AFRIQ-TECH (7 employés) - Août 2026", Debit: 3500000, Credit: 0 },
  { Journal: "PAIE", Date: "2026-08-30", Piece: "PAIE-2026-0801", Compte: "663100", Libelle: "Charges patronales CNSS Togo (15%) et AMU Togo (5%)", Debit: 700000, Credit: 0 },
  { Journal: "PAIE", Date: "2026-08-30", Piece: "PAIE-2026-0801", Compte: "431100", Libelle: "CNSS Togo cotisations globales dues (19% : ouvrière 4% + patronale 15%)", Debit: 0, Credit: 665000 },
  { Journal: "PAIE", Date: "2026-08-30", Piece: "PAIE-2026-0801", Compte: "438100", Libelle: "AMU Togo cotisations globales dues (10% : salariale 5% + patronale 5%)", Debit: 0, Credit: 350000 },
  { Journal: "PAIE", Date: "2026-08-30", Piece: "PAIE-2026-0801", Compte: "442100", Libelle: "État Togo - Retenues IRPP s/salaires selon barème officiel CGI Togo", Debit: 0, Credit: 245000 },
  { Journal: "PAIE", Date: "2026-08-30", Piece: "PAIE-2026-0801", Compte: "421100", Libelle: "Personnel AFRIQ-TECH, Rémunérations nettes dues à payer", Debit: 0, Credit: 2940000 },

  // ── 30/08 (après-midi) : Virement bancaire groupé des salaires nets ──
  { Journal: "BANQUE", Date: "2026-08-30", Piece: "VIR-BQ-2026-0811", Compte: "421100", Libelle: "Paiement salaires nets Août 2026 (7 salariés AFRIQ-TECH)", Debit: 2940000, Credit: 0 },
  { Journal: "BANQUE", Date: "2026-08-30", Piece: "VIR-BQ-2026-0811", Compte: "521100", Libelle: "Ordre de virement groupé de paie exécuté par Ecobank Togo", Debit: 0, Credit: 2940000 },

  // ── 31/08 : Dotation mensuelle aux amortissements matériel ──
  { Journal: "OD", Date: "2026-08-31", Piece: "OD-2026-0801", Compte: "681300", Libelle: "Dotation mensuelle amortissements matériel informatique & mobilier Lomé", Debit: 350000, Credit: 0 },
  { Journal: "OD", Date: "2026-08-31", Piece: "OD-2026-0801", Compte: "281830", Libelle: "Amortissement cumulé matériel informatique et agencements", Debit: 0, Credit: 350000 },
];

// ─────────────────────────────────────────────────────────────────────────────
// 6. SYNTHÈSE GLOBALE FISCALE, RENTABILITÉ & IS (ANALYSE POUR DATA ANALYST)
// ─────────────────────────────────────────────────────────────────────────────

export const FICHE_SOCIETE = [
  { Parametre: "Raison Sociale", Detail: "AFRIQ-TECH DISTRIB SARL" },
  { Parametre: "Forme Juridique", Detail: "SARL au capital de 10 000 000 FCFA entièrement libéré" },
  { Parametre: "NIF (Numéro d'Identification Fiscale)", Detail: "1000845921 (OTR Togo)" },
  { Parametre: "RCCM (Registre du Commerce)", Detail: "TG-LOM-2021-B-1452" },
  { Parametre: "Siège Social", Detail: "142 Boulevard du 13 Janvier, Tokoin Trésor, Lomé (Région Maritime)" },
  { Parametre: "Secteur d'Activité", Detail: "Distribution & Intégration de matériel informatique, serveurs et réseaux" },
  { Parametre: "Régime Fiscal OTR", Detail: "Réel Normal — Centre des Moyennes Entreprises (CME Lomé)" },
  { Parametre: "Banque Principale", Detail: "Ecobank Togo — Agence Tokoin (Compte : 012019482710)" },
  { Parametre: "Effectif Salarié", Detail: "7 employés permanents (Direction, Ingénieurs réseaux, Commerciaux)" },
  { Parametre: "Période Simulée", Detail: "Du 01 Août 2026 au 31 Août 2026 (1 mois complet)" },
  { Parametre: "Équilibre Comptable Total", Detail: "Total Débit = 46 288 300 FCFA | Total Crédit = 46 288 300 FCFA (Écart = 0 FCFA)" },
  { Parametre: "Chiffre d'Affaires HT (Classe 7)", Detail: "23 245 000 FCFA (Ventes matériels : 22 545 000 + Services : 700 000)" },
  { Parametre: "TVA Facturée Collectée 18% (443100)", Detail: "4 184 100 FCFA" },
  { Parametre: "Achats de Marchandises HT (601100)", Detail: "18 920 000 FCFA (Stock Dell, HP, Lenovo, Cisco, Epson, APC)" },
  { Parametre: "TVA Déductible s/Achats & Biens (445200)", Detail: "3 630 300 FCFA" },
  { Parametre: "TVA Nette Due du Mois d'Août (à payer au 15/09)", Detail: "553 800 FCFA (TVA Collectée 4 184 100 - TVA Déductible 3 630 300)" },
  { Parametre: "Retenues à la Source Opérées (442100)", Detail: "Retenue loyer 10% (60 000) + Retenue BNC 5% honoraires (37 500) = 97 500 FCFA" },
  { Parametre: "Charges d'Exploitation & Personnel (Classe 6)", Detail: "Achats (18 920 000) + Loyer (600 000) + CEET (320 000) + Télécom (150 000) + Audit (750 000) + Salaires bruts (3 500 000) + Charges patronales (700 000) + Amortissements (350 000) = 25 335 000 FCFA" },
  { Parametre: "Marge Commerciale Brute (BI)", Detail: "4 325 000 FCFA (Taux de marge moyen : 29.5%)" },
  { Parametre: "Taux d'Impôt sur les Sociétés (IS Togo)", Detail: "27% du bénéfice fiscal (CGI art. 110) avec minimum forfaitaire (IMF 0.5% du CA = 116 225 FCFA)" },
  { Parametre: "Régions Couvertes", Detail: "Maritime (Lomé, Aného), Plateaux (Kpalimé, Atakpamé), Centrale (Sokodé, Blitta), Kara (Kara, Bassar), Savanes (Dapaong, Mango)" },
];

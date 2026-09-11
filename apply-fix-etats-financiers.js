/**
 * apply-fix-etats-financiers.js
 * ---------------------------------------------------------------
 * Corrige 2 bugs confirmés dans src/app/api/v1/accounting/etats-financiers/route.ts :
 *
 * 1) Mapping charges/produits inversé (constat n°13 du rapport d'audit) :
 *    - 66 (personnel) était classé "Charges financières" -> reclassé en exploitation
 *    - 67 (frais financiers) était classé "Charges exceptionnelles/HAO" -> reclassé en financier
 *    - 68 (dotations d'exploitation, libellé explicite dans SYSCOHADA_OFFICIAL_ACCOUNTS)
 *      était classé "Charges exceptionnelles/HAO" -> reclassé en exploitation
 *    - Produits financiers réels (75x, ex "Produits financiers et intérêts reçus")
 *      étaient cherchés à tort sur le préfixe 76 (inexistant dans le plan réel)
 *    - Les vraies charges/produits HAO (classe 8 : 81/82/83/84/85, qui existent
 *      dans SYSCOHADA_OFFICIAL_ACCOUNTS) n'étaient JAMAIS pris en compte, ce qui
 *      aurait faussé le résultat net (pas seulement sa ventilation) dès qu'une
 *      vraie opération HAO existe.
 *
 * 2) Collision de code d'amortissement (constat n°14) :
 *    "28" + code.slice(2) faisait pointer 211000 (Terrains) ET 241000
 *    (Matériel de bureau) vers le même compte "281000". Remplacé par une
 *    dérivation qui préserve le chiffre distinctif, vérifiée contre les
 *    vrais comptes seedés (213000->281300, 218000->281800, 241000->284100).
 *
 * Usage (PowerShell, depuis la racine du projet) :
 *   node .\apply-fix-etats-financiers.js
 * ---------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function readFile(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) {
    throw new Error(`Fichier introuvable : ${relPath} (chemin résolu : ${full})`);
  }
  return { full, content: fs.readFileSync(full, "utf8") };
}

function applyReplace(relPath, oldStr, newStr, label) {
  const { full, content } = readFile(relPath);
  if (!content.includes(oldStr)) {
    throw new Error(
      `[${label}] Le texte attendu n'a pas été trouvé tel quel dans ${relPath}.\n` +
      `Le fichier a probablement changé depuis l'audit - vérifie-le manuellement avant de relancer.`
    );
  }
  const occurrences = content.split(oldStr).length - 1;
  if (occurrences > 1) {
    throw new Error(
      `[${label}] Le texte attendu apparaît ${occurrences} fois dans ${relPath} - remplacement ambigu, arrêt par sécurité.`
    );
  }
  const updated = content.replace(oldStr, newStr);
  fs.writeFileSync(full, updated, "utf8");
  console.log(`✔ [${label}] ${relPath} mis à jour.`);
}

try {
  const routePath = path.join("src", "app", "api", "v1", "accounting", "etats-financiers", "route.ts");

  // ------------------------------------------------------------
  // 1) Mapping charges/produits : exploitation / financier / HAO
  // ------------------------------------------------------------
  const oldClassification = `  // === COMPTE DE RÉSULTAT ===
  const chExplLines = accounts
    .filter((a) => a.classe === 6 && !a.code.startsWith("66") && !a.code.startsWith("67") && !a.code.startsWith("68") && a.solde > 0)
    .map((a) => toLine(a, a.solde));
  const chFinLines = accounts
    .filter((a) => a.classe === 6 && a.code.startsWith("66") && a.solde > 0)
    .map((a) => toLine(a, a.solde));
  const chExcLines = accounts
    .filter((a) => a.classe === 6 && (a.code.startsWith("67") || a.code.startsWith("68")) && a.solde > 0)
    .map((a) => toLine(a, a.solde));

  const prExplLines = accounts
    .filter((a) => a.classe === 7 && !a.code.startsWith("76") && !a.code.startsWith("77") && !a.code.startsWith("78") && !a.code.startsWith("79") && a.solde < 0)
    .map((a) => toLine(a));
  const prFinLines = accounts
    .filter((a) => a.classe === 7 && a.code.startsWith("76") && a.solde < 0)
    .map((a) => toLine(a));
  const prExcLines = accounts
    .filter((a) => a.classe === 7 && (a.code.startsWith("77") || a.code.startsWith("78") || a.code.startsWith("79")) && a.solde < 0)
    .map((a) => toLine(a));`;

  const newClassification = `  // === COMPTE DE RÉSULTAT ===
  // Charges d'exploitation : classe 6 hors frais financiers (67).
  // 66 (personnel) et 68 (dotations "d'exploitation" — libellé explicite dans
  // SYSCOHADA_OFFICIAL_ACCOUNTS : "Dotations aux amortissements d'exploitation")
  // restent en exploitation, pas en financier ni en HAO.
  const chExplLines = accounts
    .filter((a) => a.classe === 6 && !a.code.startsWith("67") && a.solde > 0)
    .map((a) => toLine(a, a.solde));
  const chFinLines = accounts
    .filter((a) => a.classe === 6 && a.code.startsWith("67") && a.solde > 0)
    .map((a) => toLine(a, a.solde));
  // Charges HAO réelles : classe 8 (81 valeurs comptables cessions, 83 charges HAO,
  // 85 dotations HAO) — comptes réellement seedés dans SYSCOHADA_OFFICIAL_ACCOUNTS,
  // jamais pris en compte auparavant alors qu'ils existent dans le plan comptable.
  const chExcLines = accounts
    .filter((a) => a.classe === 8 && (a.code.startsWith("81") || a.code.startsWith("83") || a.code.startsWith("85")) && a.solde > 0)
    .map((a) => toLine(a, a.solde));

  // Produits d'exploitation : classe 7 hors produits financiers réels (75x, ex
  // "751100 Produits financiers et intérêts reçus" dans SYSCOHADA_OFFICIAL_ACCOUNTS).
  // Le préfixe "76" cherché auparavant ne correspond à aucun compte du plan réel.
  const prExplLines = accounts
    .filter((a) => a.classe === 7 && !a.code.startsWith("75") && a.solde < 0)
    .map((a) => toLine(a));
  const prFinLines = accounts
    .filter((a) => a.classe === 7 && a.code.startsWith("75") && a.solde < 0)
    .map((a) => toLine(a));
  // Produits HAO réels : classe 8 (82 produits de cessions, 84 produits HAO).
  const prExcLines = accounts
    .filter((a) => a.classe === 8 && (a.code.startsWith("82") || a.code.startsWith("84")) && a.solde < 0)
    .map((a) => toLine(a));`;

  applyReplace(routePath, oldClassification, newClassification, "Mapping charges/produits 6/7/8");

  // ------------------------------------------------------------
  // 2) Collision de code d'amortissement
  // ------------------------------------------------------------
  const oldAmort = `      const amortCode = "28" + a.code.slice(2);`;

  const newAmort = `      // Dérivation vérifiée contre les vrais comptes seedés (SYSCOHADA_OFFICIAL_ACCOUNTS) :
      // 213000 (Bâtiments) -> 281300, 218000 (Matériel transport) -> 281800,
      // 241000 (Matériel bureau) -> 284100. L'ancienne version ("28"+code.slice(2))
      // perdait le chiffre distinctif en position 1 et faisait collisionner
      // 211000 (Terrains) et 241000 (Matériel de bureau) sur le même "281000".
      const amortCode = "28" + a.code.slice(1, 3) + a.code.slice(4);`;

  applyReplace(routePath, oldAmort, newAmort, "Collision code amortissement");

  console.log("\n✅ Correctif appliqué avec succès sur etats-financiers/route.ts.");
  console.log("   Prochaine étape : npx tsc --noEmit puis vérifier le Compte de Résultat et le Bilan");
  console.log("   sur un dossier ayant de vraies charges de personnel (66), des frais financiers (67)");
  console.log("   et si possible une opération HAO (classe 8), pour confirmer visuellement la ventilation.");
} catch (err) {
  console.error("\n✗ Échec de l'application du correctif :");
  console.error(err.message);
  process.exit(1);
}

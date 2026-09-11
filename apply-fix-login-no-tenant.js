/**
 * apply-fix-login-no-tenant.js
 * ---------------------------------------------------------------
 * Corrige login/route.ts : un utilisateur sans aucune adhésion à un
 * tenant (userTenants vide) recevait un 200 OK avec tenantId: "",
 * ce qui cassait silencieusement tous les modules protégés
 * (TENANT_REQUIRED en cascade). Il reçoit désormais une erreur
 * explicite NO_TENANT_ASSIGNED (403), sauf s'il est super-admin
 * (cohérent avec le traitement déjà fait dans with-guard.ts).
 *
 * Usage (depuis la racine du projet) :
 *   node apply-fix-login-no-tenant.js
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
            `Le fichier a probablement changé depuis l'audit — vérifie-le manuellement avant de relancer.`
        );
    }
    const occurrences = content.split(oldStr).length - 1;
    if (occurrences > 1) {
        throw new Error(
            `[${label}] Le texte attendu apparaît ${occurrences} fois dans ${relPath} — remplacement ambigu, arrêt par sécurité.`
        );
    }
    const updated = content.replace(oldStr, newStr);
    fs.writeFileSync(full, updated, "utf8");
    console.log(`✔ [${label}] ${relPath} mis à jour.`);
}

try {
    const loginPath = path.join("src", "app", "api", "v1", "auth", "login", "route.ts");

    const oldBlock = `    // 4. Préparation contexte
    const primaryMembership = user.userTenants[0];
    const tenantId = primaryMembership ? primaryMembership.tenantId : "";
    const role = primaryMembership ? primaryMembership.role : "GERANT";`;

    const newBlock = `    // 4. Préparation contexte
    const primaryMembership = user.userTenants[0];

    // Un utilisateur sans aucune adhésion à un tenant ne peut pas se connecter
    // normalement (sauf super-admin, traité comme dans with-guard.ts).
    if (!primaryMembership && !user.isSuperAdmin) {
      return NextResponse.json(
        {
          error: "NO_TENANT_ASSIGNED",
          message: "Ce compte n'est rattaché à aucun dossier. Contactez un administrateur.",
        },
        { status: 403 }
      );
    }

    const tenantId = primaryMembership ? primaryMembership.tenantId : "";
    const role = primaryMembership ? primaryMembership.role : "ADMIN_SYS";`;

    applyReplace(loginPath, oldBlock, newBlock, "login/route.ts");

    console.log("\n✅ Correctif appliqué avec succès sur login/route.ts.");
    console.log("   Prochaine étape : npx tsc --noEmit puis vérifier :");
    console.log("   1) qu'un compte SANS tenant reçoit bien 403 NO_TENANT_ASSIGNED à la connexion");
    console.log("   2) qu'un compte super-admin peut toujours se connecter sans tenant");
    console.log("   3) qu'un compte normal AVEC tenant se connecte toujours normalement");
} catch (err) {
    console.error("\n✗ Échec de l'application du correctif :");
    console.error(err.message);
    process.exit(1);
}
// test-upload.js
// Reproduit exactement le flux d'upload de handleUnifiedFileImport,
// avec le vrai package @vercel/blob/client déjà utilisé par l'app.
// Nécessite que `npm run dev` tourne en parallèle (localhost:3000).
//
// Usage :
//   node test-upload.js "C:\chemin\vers\ton_fichier_20mo.xlsx"

const fs = require("fs");
const path = require("path");

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node test-upload.js "<chemin_du_fichier>"');
    process.exit(1);
  }
  if (!fs.existsSync(filePath)) {
    console.error("Fichier introuvable :", filePath);
    process.exit(1);
  }

  const { upload } = require("@vercel/blob/client");

  const fileName = path.basename(filePath);
  const buffer = fs.readFileSync(filePath);
  const sizeMo = (buffer.length / 1024 / 1024).toFixed(2);

  console.log(`Fichier : ${fileName} (${sizeMo} Mo)`);
  console.log("Envoi vers /api/v1/bi/import/upload-token puis Vercel Blob...");

  const t0 = Date.now();
  try {
    const blob = await upload(fileName, buffer, {
      access: "public",
      handleUploadUrl: "http://localhost:3000/api/v1/bi/import/upload-token",
    });
    const t = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n✅ SUCCÈS en ${t}s`);
    console.log("URL du blob :", blob.url);
  } catch (err) {
    const t = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n❌ ÉCHEC après ${t}s`);
    console.error("Message :", err && err.message);
    console.error("Détail complet :");
    console.error(err);
  }
}

main();
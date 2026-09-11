const fs = require("fs");
const path = require("path");
const ROOT = process.cwd();

function readFile(relPath) {
    const full = path.join(ROOT, relPath);
    if (!fs.existsSync(full)) throw new Error(`Fichier introuvable : ${relPath}`);
    return { full, content: fs.readFileSync(full, "utf8") };
}

function applyReplace(relPath, oldStr, newStr, label) {
    const { full, content } = readFile(relPath);
    if (!content.includes(oldStr)) {
        throw new Error(`[${label}] Texte attendu introuvable dans ${relPath}. Vérifie le fichier manuellement.`);
    }
    if (content.split(oldStr).length - 1 > 1) {
        throw new Error(`[${label}] Texte trouvé plusieurs fois — arrêt par sécurité.`);
    }
    fs.writeFileSync(full, content.replace(oldStr, newStr), "utf8");
    console.log(`✔ [${label}] ${relPath} mis à jour.`);
}

try {
    const p = path.join("src", "lib", "bi", "unified-excel-import.ts");

    const oldBlock = `  const getRowsForSheet = (candidates: string[]) => {
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
  };`;

    const newBlock = `  function normalizeSheetName(s: string): string {
    return s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .replace(/[\\s_\\-\\.]/g, "");
  }

  const getRowsForSheet = (candidates: string[]) => {
    const normalizedCandidates = candidates.map(normalizeSheetName);
    const foundName = sheetNames.find((s) => {
      const norm = normalizeSheetName(s);
      return normalizedCandidates.some((c) => norm === c || norm.includes(c));
    });
    if (foundName) {
      const sheet = workbook.Sheets[foundName];
      if (sheet) {
        const rawRows = utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
        return rawRows.map(normalizeRow);
      }
    }
    return null;
  };`;

    applyReplace(p, oldBlock, newBlock, "unified-excel-import.ts");
    console.log("\n✅ Correctif appliqué. Prochaine étape : npx tsc --noEmit puis réimporter le fichier.");
} catch (err) {
    console.error("\n✗ Échec :", err.message);
    process.exit(1);
}
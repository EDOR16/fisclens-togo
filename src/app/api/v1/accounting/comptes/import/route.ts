export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { withGuard } from "@/lib/server/with-guard";

type CsvRow = { code: string; libelle: string; classe: string; nature: string; sens_normal: string; postable: string; splittable: string; source: string };
const required = ["code", "libelle", "classe", "nature", "sens_normal", "postable", "splittable", "source"] as const;
const truthy = (value: string) => value === "1" || value.toLowerCase() === "true";

function parseCsv(input: string): CsvRow[] {
  const lines = input.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const header = lines.shift()?.split(";").map((value) => value.trim());
  if (!header || required.some((column) => !header.includes(column))) throw new Error("En-têtes CSV incomplets");
  return lines.map((line) => Object.fromEntries(header.map((key, index) => [key, line.split(";")[index]?.trim() ?? ""])) as CsvRow);
}

function validate(rows: CsvRow[]) {
  if (!rows.length) throw new Error("Le fichier ne contient aucun compte");
  const codes = new Set<string>();
  for (const row of rows) {
    if (!/^[1-8]\d*$/.test(row.code) || Number(row.classe) !== Number(row.code[0])) throw new Error(`Classe invalide pour ${row.code}`);
    if (!row.libelle || !row.source || !/OHADA/i.test(row.source)) throw new Error(`Libellé ou source OHADA manquant pour ${row.code}`);
    if (codes.has(row.code)) throw new Error(`Code dupliqué : ${row.code}`);
    codes.add(row.code);
    const expectedNature = Number(row.classe) <= 5 ? "BILAN" : Number(row.classe) <= 7 ? "RESULTAT" : "HORS_BILAN";
    if (row.nature !== expectedNature) throw new Error(`Nature incohérente pour ${row.code}`);
    if (!/^(DEBIT|CREDIT)$/.test(row.sens_normal)) throw new Error(`Sens normal invalide pour ${row.code}`);
  }
  for (const row of rows.filter((row) => row.code.length > 2)) {
    if (!codes.has(row.code.slice(0, 2))) throw new Error(`Racine ${row.code.slice(0, 2)} absente pour ${row.code}`);
  }
}

export const POST = withGuard(async (request: NextRequest, { user }) => {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "FILE_REQUIRED", message: "Fichier CSV requis" }, { status: 400 });
  try {
    const rows = parseCsv(await file.text());
    validate(rows);
    await prisma.$transaction(rows.map((row) => prisma.syscohadaRef.upsert({
      where: { code: row.code },
      update: { libelle: row.libelle, classe: Number(row.classe), nature: row.nature, sensNormal: row.sens_normal, postable: truthy(row.postable), splittable: truthy(row.splittable), source: row.source },
      create: { code: row.code, libelle: row.libelle, classe: Number(row.classe), nature: row.nature, sensNormal: row.sens_normal, postable: truthy(row.postable), splittable: truthy(row.splittable), source: row.source },
    })));
    await prisma.auditLog.create({ data: { userId: user.userId, action: "IMPORT_SYSCOHADA_REF", entity: "SYSCOHADA_REF", details: JSON.stringify({ rows: rows.length, filename: file.name }) } });
    return NextResponse.json({ imported: rows.length });
  } catch (error) {
    return NextResponse.json({ error: "INVALID_SYSCOHADA_FILE", message: error instanceof Error ? error.message : "Fichier invalide" }, { status: 422 });
  }
}, { roles: ["ADMIN_SYS"] });

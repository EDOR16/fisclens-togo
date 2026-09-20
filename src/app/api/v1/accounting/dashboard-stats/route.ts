export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  // Exécuter l'agrégation comptable, les écritures récentes et le comptage en parallèle
  const [aggRows, recentEcritures, totalEcrituresCount]: [any[], any[], number] = await Promise.all([
    prisma.$queryRaw<Array<{
      chiffreAffaires: number;
      totalCharges: number;
      tresorerie: number;
      encoursClientsRaw: number;
      encoursFournisseursRaw: number;
      tvaCollecteeRaw: number;
      tvaDeductibleRaw: number;
      achatsDirects: number;
      chargesStructure: number;
      chargesFinancieres: number;
      amortissements: number;
    }>>`
      SELECT
        COALESCE(SUM(CASE WHEN l."accountCode" LIKE '7%' THEN l.credit - l.debit ELSE 0 END), 0)::float AS "chiffreAffaires",
        COALESCE(SUM(CASE WHEN l."accountCode" LIKE '6%' THEN l.debit - l.credit ELSE 0 END), 0)::float AS "totalCharges",
        COALESCE(SUM(CASE WHEN l."accountCode" LIKE '5%' THEN l.debit - l.credit ELSE 0 END), 0)::float AS "tresorerie",
        COALESCE(SUM(CASE WHEN l."accountCode" LIKE '411%' THEN l.debit - l.credit ELSE 0 END), 0)::float AS "encoursClientsRaw",
        COALESCE(SUM(CASE WHEN l."accountCode" LIKE '401%' THEN l.credit - l.debit ELSE 0 END), 0)::float AS "encoursFournisseursRaw",
        COALESCE(SUM(CASE WHEN l."accountCode" LIKE '443%' THEN l.credit - l.debit ELSE 0 END), 0)::float AS "tvaCollecteeRaw",
        COALESCE(SUM(CASE WHEN (l."accountCode" LIKE '4451%' OR l."accountCode" LIKE '4452%' OR l."accountCode" LIKE '4453%' OR l."accountCode" LIKE '4454%') THEN l.debit - l.credit ELSE 0 END), 0)::float AS "tvaDeductibleRaw",
        COALESCE(SUM(CASE WHEN l."accountCode" LIKE '60%' THEN l.debit - l.credit ELSE 0 END), 0)::float AS "achatsDirects",
        COALESCE(SUM(CASE WHEN l."accountCode" ~ '^(61|62|63|64|65|66)' THEN l.debit - l.credit ELSE 0 END), 0)::float AS "chargesStructure",
        COALESCE(SUM(CASE WHEN l."accountCode" LIKE '67%' THEN l.debit - l.credit ELSE 0 END), 0)::float AS "chargesFinancieres",
        COALESCE(SUM(CASE WHEN l."accountCode" LIKE '68%' THEN l.debit - l.credit ELSE 0 END), 0)::float AS "amortissements"
      FROM ecriture_lines l
      JOIN ecritures e ON l."ecritureId" = e.id
      WHERE e."tenantId" = ${tenantId}
        AND e.status IN ('VALIDE', 'CLOTURE')
    `,
    prisma.ecriture.findMany({
      where: { tenantId },
      include: {
        lines: true,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 10,
    }),
    prisma.ecriture.count({
      where: { tenantId },
    }),
  ]);

  const agg = aggRows[0] || {};
  const chiffreAffaires = Number(agg.chiffreAffaires || 0);
  const totalCharges = Number(agg.totalCharges || 0);
  const achatsDirects = Number(agg.achatsDirects || 0);
  const chargesStructure = Number(agg.chargesStructure || 0);
  const chargesFinancieres = Number(agg.chargesFinancieres || 0);
  const amortissements = Number(agg.amortissements || 0);

  // ── Résultat net RÉEL = CA − Achats − Charges structure − Amortissements − Charges financières
  const margeBrute = chiffreAffaires - achatsDirects;
  const resultatNet = chiffreAffaires - achatsDirects - chargesStructure - amortissements - chargesFinancieres;
  const tauxMargeNette = chiffreAffaires > 0 ? (resultatNet / chiffreAffaires) * 100 : 0;

  const tresorerie = Number(agg.tresorerie || 0);
  const encoursClients = Math.max(0, Number(agg.encoursClientsRaw || 0));
  const encoursFournisseurs = Math.max(0, Number(agg.encoursFournisseursRaw || 0));
  const tvaCollectee = Math.max(0, Number(agg.tvaCollecteeRaw || 0));
  const tvaDeductible = Math.max(0, Number(agg.tvaDeductibleRaw || 0));
  const tvaADeclarer = Math.max(0, tvaCollectee - tvaDeductible);
  const creditTva = Math.max(0, tvaDeductible - tvaCollectee);

  const formattedRecent = recentEcritures.map((e) => {
    const debit = e.lines.reduce((s: number, l: any) => s + Number(l.debit), 0);
    const credit = e.lines.reduce((s: number, l: any) => s + Number(l.credit), 0);
    return {
      id: e.id,
      date: e.date,
      piece: e.piece,
      journal: e.journal,
      libelle: e.libelle || e.lines[0]?.libelle || `Écriture ${e.piece}`,
      debit,
      credit,
      status: e.status,
    };
  });

  return NextResponse.json({
    chiffreAffaires,
    totalCharges,
    achatsDirects,
    chargesStructure,
    chargesFinancieres,
    amortissements,
    margeBrute,
    resultatNet,
    tauxMargeNette,
    tresorerie,
    encoursClients,
    encoursFournisseurs,
    tvaCollectee,
    tvaDeductible,
    tvaADeclarer,
    creditTva,
    totalEcrituresCount,
    recentEntries: formattedRecent,
  });
});

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";
import {
  runFullAnomalyDetection,
  runInvoiceLevelDetection,
  RawEcritureForAudit,
  RawSaleForAudit,
  RawInvoiceForAudit,
} from "@/lib/controle/anomaly-rules";
import { loadInvoiceDetectionContext } from "@/lib/controle/invoice-context";
import { SeveriteAnomalie, StatutAnomalie, TypeAnomalie } from "@prisma/client";

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  // 1. Récupération des écritures du tenant avec leurs lignes
  const ecritures = await prisma.ecriture.findMany({
    where: { tenantId },
    include: { lines: true },
    orderBy: { date: "desc" },
  });

  // 2. Récupération des ventes pour rapprochement TVA si disponibles
  const sales = await prisma.sale.findMany({
    where: { tenantId },
    select: {
      id: true,
      date: true,
      refFacture: true,
      montantHT: true,
      tauxTVA: true,
      montantTVA: true,
      montantTTC: true,
    },
  });

  // 3. Charger le plan comptable du dossier (pour détecter comptes inexistants)
  const planComptes = await prisma.comptePlan.findMany({
    where: { tenantId },
    select: { code: true },
  });
  const comptesValides = new Set(planComptes.map((c) => c.code));

  // 3bis. Exécution du moteur de règles métier FiscLens Togo (LPF / SYSCOHADA)
  const auditResult = runFullAnomalyDetection(
    ecritures as RawEcritureForAudit[],
    sales as RawSaleForAudit[],
    undefined,
    comptesValides
  );

  // 3bis. Détection niveau facture (Section 7 — OCR / import / cohérence TVA)
  const [invoiceContext, purchases] = await Promise.all([
    loadInvoiceDetectionContext(tenantId),
    prisma.purchase.findMany({
      where: { tenantId },
      select: {
        id: true,
        date: true,
        refCommande: true,
        supplierId: true,
        montantHT: true,
        tauxTVA: true,
        montantTVA: true,
        montantTTC: true,
      },
    }),
  ]);

  const facturesForAudit: RawInvoiceForAudit[] = [
    ...sales.map((s) => ({
      id: s.id,
      source: "SALE" as const,
      numeroPiece: s.refFacture,
      date: s.date,
      tiersNom: "Client",
      tiersNif: null,
      montantHT: s.montantHT,
      tauxTVA: s.tauxTVA,
      montantTVA: s.montantTVA,
      montantTTC: s.montantTTC,
      imageHash: null,
      sourceOcr: false,
    })),
    ...purchases.map((p) => ({
      id: p.id,
      source: "PURCHASE" as const,
      numeroPiece: p.refCommande,
      date: p.date,
      tiersNom: p.supplierId,
      tiersNif: null,
      montantHT: p.montantHT,
      tauxTVA: p.tauxTVA,
      montantTVA: p.montantTVA,
      montantTTC: p.montantTTC,
      imageHash: null,
      sourceOcr: false,
    })),
  ];

  const invoiceAnomalies = runInvoiceLevelDetection(facturesForAudit, invoiceContext);

  // Fusion : le pipeline en aval (formatage UI) traite les deux listes indifféremment
  auditResult.anomalies.push(...invoiceAnomalies);
  // 4. Récupérer les statuts et justifications persistés en base (AnomalieDetectee)
  const persistedAnomalies = await prisma.anomalieDetectee.findMany({
    where: { tenantId },
  });
  const persistedMap = new Map<string, typeof persistedAnomalies[0]>();
  for (const p of persistedAnomalies) {
    if (p.factureRef) {
      persistedMap.set(`${p.type}_${p.factureRef}`, p);
    }
  }

  // 5. Transformer pour le format UI avec dé-duplication par pièce + règle
  type FormattedAnomaly = {
    id: string;
    type: string;
    libelle: string;
    piece: string;
    compte: string;
    montant: number;
    date: string;
    gravite: "HAUTE" | "MOYENNE" | "BASSE";
    statut: "OUVERT" | "RESOLU";
    explication: string;
    justification?: string | null;
  };

  const formatted: FormattedAnomaly[] = [];
  const seenKey = new Set<string>();

  // A. Intégrer les anomalies issues du moteur de détection LPF / SYSCOHADA
  for (let idx = 0; idx < auditResult.anomalies.length; idx++) {
    const a = auditResult.anomalies[idx]!;
    const key = `${a.type}_${a.factureRef || a.ecritureId || idx}`;
    if (seenKey.has(key)) continue;
    seenKey.add(key);

    const matchPersisted = a.factureRef
      ? persistedMap.get(`${a.type}_${a.factureRef}`)
      : null;

    const isResolved =
      matchPersisted?.statut === StatutAnomalie.CORRIGEE ||
      matchPersisted?.statut === StatutAnomalie.IGNOREE;

    const gravite: "HAUTE" | "MOYENNE" | "BASSE" =
      a.severite === SeveriteAnomalie.BLOQUANT
        ? "HAUTE"
        : a.severite === SeveriteAnomalie.AVERTISSEMENT
        ? "MOYENNE"
        : "BASSE";

    formatted.push({
      id: matchPersisted?.id || `anom-rule-${idx}-${a.factureRef || "x"}`,
      type: a.type,
      libelle: a.description.split(" : ")[0] || a.description.slice(0, 60),
      piece: a.factureRef || "—",
      compte: a.compteConcerne || "Multi-comptes",
      montant: a.montantImpact || 0,
      date: new Date().toISOString().slice(0, 10),
      gravite,
      statut: isResolved ? "RESOLU" : "OUVERT",
      explication: a.description,
      justification: matchPersisted?.justification,
    });
  }

  // B. Détection synthétique des pièces justificatives manquantes (1 alerte par pièce réelle)
  const pieceDocChecked = new Set<string>();
  for (const ec of ecritures) {
    const pKey = ec.piece.trim().toUpperCase();
    if (pieceDocChecked.has(pKey)) continue;
    pieceDocChecked.add(pKey);

    if (!ec.documentUrl) {
      const montantTotal = ec.lines.reduce((s, l) => s + l.debit, 0);
      const docKey = `DOC_MANQUANT_${pKey}`;
      if (!seenKey.has(docKey)) {
        seenKey.add(docKey);
        formatted.push({
          id: `anom-doc-${ec.id}`,
          type: "PIECE_MANQUANTE",
          libelle: `Justificatif manquant pour la pièce ${ec.piece} (${ec.journal})`,
          piece: ec.piece,
          compte: ec.lines[0]?.accountCode || "—",
          montant: montantTotal,
          date: ec.date,
          gravite: montantTotal > 500_000 ? "MOYENNE" : "BASSE",
          statut: "OUVERT",
          explication: "Aucune facture ni pièce dématérialisée (PDF/Image) n'est rattachée à cette écriture (LPF art. 124).",
        });
      }
    }
  }

  // C. Comptes d'attente (471/472) non soldés
  for (const ec of ecritures) {
    for (const line of ec.lines) {
      if (line.accountCode.startsWith("471") || line.accountCode.startsWith("472")) {
        const attenteKey = `ATTENTE_${line.accountCode}_${ec.piece}`;
        if (!seenKey.has(attenteKey)) {
          seenKey.add(attenteKey);
          formatted.push({
            id: `anom-attente-${line.id}`,
            type: "COMPTE_ATTENTE",
            libelle: `Compte d'attente non soldé (${line.accountCode})`,
            piece: ec.piece,
            compte: line.accountCode,
            montant: line.debit || line.credit,
            date: ec.date,
            gravite: "HAUTE",
            statut: "OUVERT",
            explication: "Les opérations passées en compte d'attente doivent obligatoirement être ventilées avant clôture d'exercice.",
          });
        }
      }
    }
  }

  const haute = formatted.filter((a) => a.gravite === "HAUTE" && a.statut !== "RESOLU").length;
  const moyenne = formatted.filter((a) => a.gravite === "MOYENNE" && a.statut !== "RESOLU").length;
  const basse = formatted.filter((a) => a.gravite === "BASSE" && a.statut !== "RESOLU").length;

  return NextResponse.json({
    total: formatted.length,
    haute,
    moyenne,
    basse,
    scoreConformite: auditResult.scoreConformite,
    anomalies: formatted,
  });
});

// PATCH : Validation comptable, résolution ou ignorance d'une anomalie avec justification
export const PATCH = withGuard(async (req: NextRequest, { tenantId }) => {
  const body = await req.json();
  const { id, piece, type, action, justification } = body;

  if (!action || !["CORRIGEE", "IGNOREE"].includes(action)) {
    return NextResponse.json(
      { error: "Action invalide. Valeurs attendues : 'CORRIGEE' ou 'IGNOREE'." },
      { status: 400 }
    );
  }

  const statut = action === "CORRIGEE" ? StatutAnomalie.CORRIGEE : StatutAnomalie.IGNOREE;

  // Si l'anomalie existe déjà en base, mettre à jour
  if (id && !id.startsWith("anom-rule-") && !id.startsWith("anom-doc-") && !id.startsWith("anom-attente-")) {
    const updated = await prisma.anomalieDetectee.update({
      where: { id },
      data: {
        statut,
        justification: justification || null,
        resolvedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, anomaly: updated });
  }

  // Sinon, créer un enregistrement persistant pour mémoriser la décision du comptable
  const created = await prisma.anomalieDetectee.create({
    data: {
      tenantId,
      type: (type as TypeAnomalie) || TypeAnomalie.COMPTE_HORS_MAPPING_JOURNAL,
      severite: SeveriteAnomalie.AVERTISSEMENT,
      description: `Décision comptable pour la pièce ${piece || id} : ${action}. Justification : ${justification || "Aucune"}`,
      statut,
      justification: justification || null,
      factureRef: piece || null,
      resolvedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    message: `Anomalie marquée comme ${action}.`,
    anomaly: created,
  });
});

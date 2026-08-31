export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  const ecritures = await prisma.ecriture.findMany({
    where: { tenantId },
    include: { lines: true },
    orderBy: { date: "desc" },
  });

  type Anomaly = {
    id: string;
    type: "DOUBLON_FACTURE" | "TVA_INCOHERENTE" | "MONTANT_ATYPIQUE" | "PIECE_MANQUANTE" | "COMPTE_ATTENTE" | "DESEQUILIBRE";
    libelle: string;
    piece: string;
    compte: string;
    montant: number;
    date: string;
    gravite: "HAUTE" | "MOYENNE" | "BASSE";
    statut: "OUVERT" | "RESOLU";
    explication: string;
  };

  const anomalies: Anomaly[] = [];
  const pieceMap = new Map<string, number>();

  for (const ec of ecritures) {
    // 1. Doublons de pièces
    const pCount = (pieceMap.get(ec.piece) || 0) + 1;
    pieceMap.set(ec.piece, pCount);
    if (pCount > 1) {
      anomalies.push({
        id: `anom-doublon-${ec.id}`,
        type: "DOUBLON_FACTURE",
        libelle: `Doublon détecté sur la pièce ${ec.piece}`,
        piece: ec.piece,
        compte: ec.lines[0]?.accountCode || "—",
        montant: ec.lines.reduce((s, l) => s + l.debit, 0),
        date: ec.date,
        gravite: "HAUTE",
        statut: "OUVERT",
        explication: "Le même numéro de pièce justificative a été utilisé sur plusieurs écritures comptables différentes.",
      });
    }

    // 2. Pièces justificatives manquantes
    if (!ec.documentUrl) {
      const montantTotal = ec.lines.reduce((s, l) => s + l.debit, 0);
      anomalies.push({
        id: `anom-doc-${ec.id}`,
        type: "PIECE_MANQUANTE",
        libelle: `Justificatif manquant pour ${ec.piece} (${ec.journal})`,
        piece: ec.piece,
        compte: ec.lines[0]?.accountCode || "—",
        montant: montantTotal,
        date: ec.date,
        gravite: montantTotal > 500_000 ? "MOYENNE" : "BASSE",
        statut: "OUVERT",
        explication: "Aucune facture ni preuve dématérialisée (PDF/Image) n'est encore rattachée à cette écriture.",
      });
    }

    // 3. Équilibre Débit / Crédit de l'écriture
    const totalDebit = ec.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = ec.lines.reduce((s, l) => s + l.credit, 0);
    if (totalDebit !== totalCredit) {
      anomalies.push({
        id: `anom-deseq-${ec.id}`,
        type: "DESEQUILIBRE",
        libelle: `Écriture déséquilibrée sur la pièce ${ec.piece}`,
        piece: ec.piece,
        compte: "Multi-comptes",
        montant: Math.abs(totalDebit - totalCredit),
        date: ec.date,
        gravite: "HAUTE",
        statut: "OUVERT",
        explication: `Débit (${totalDebit.toLocaleString("fr-FR")} FCFA) != Crédit (${totalCredit.toLocaleString("fr-FR")} FCFA).`,
      });
    }

    // 4. Comptes d'attente (471/472)
    for (const line of ec.lines) {
      if (line.accountCode.startsWith("471") || line.accountCode.startsWith("472")) {
        anomalies.push({
          id: `anom-attente-${line.id}`,
          type: "COMPTE_ATTENTE",
          libelle: `Compte d'attente non soldé (${line.accountCode})`,
          piece: ec.piece,
          compte: line.accountCode,
          montant: line.debit || line.credit,
          date: ec.date,
          gravite: "HAUTE",
          statut: "OUVERT",
          explication: "Les opérations passées en compte d'attente doivent obligatoirement être ventilées avant clôture.",
        });
      }
    }
  }

  const haute = anomalies.filter((a) => a.gravite === "HAUTE").length;
  const moyenne = anomalies.filter((a) => a.gravite === "MOYENNE").length;
  const basse = anomalies.filter((a) => a.gravite === "BASSE").length;

  return NextResponse.json({
    total: anomalies.length,
    haute,
    moyenne,
    basse,
    anomalies,
  });
});

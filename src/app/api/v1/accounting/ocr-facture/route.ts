export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";
import {
  analyzeInvoiceImageOrText,
  ExtractedArticle,
  SyscohadaProposedLine,
} from "@/lib/server/ocr-invoice";

// ─── Comptes SYSCOHADA par défaut à auto-provisionner si absents ──────────────
const STANDARD_ACCOUNTS_MAP: Record<string, { libelle: string; classe: number }> = {
  "601100": { libelle: "Achats marchandises locaux", classe: 6 },
  "605100": { libelle: "Électricité (CEET / Cash Power)", classe: 6 },
  "606100": { libelle: "Fournitures de bureau", classe: 6 },
  "628100": { libelle: "Frais télécoms (TogoCom/Moov)", classe: 6 },
  "631100": { libelle: "Prestations de services extérieures", classe: 6 },
  "701100": { libelle: "Ventes de marchandises", classe: 7 },
  "706100": { libelle: "Prestations de services vendues", classe: 7 },
  "445200": { libelle: "État, TVA déductible s/achats (18%)", classe: 4 },
  "443100": { libelle: "État, TVA facturée s/ventes (18%)", classe: 4 },
  "401100": { libelle: "Fournisseurs d'exploitation locaux", classe: 4 },
  "411100": { libelle: "Clients - Ventes de biens ou prestations", classe: 4 },
  "571100": { libelle: "Caisse principale Lomé", classe: 5 },
  "521100": { libelle: "Banque locale (FCFA)", classe: 5 },
};

export const POST = withGuard(async (req: NextRequest, { tenantId, user }) => {
  try {
    const body = await req.json();
    const action = body.action || "ANALYZE";

    // ──────────────────────────────────────────────────────────────────────────
    // ACTION 1 : ANALYSE OCR + PROPOSITION COMPTABLE SYSCOHADA
    // ──────────────────────────────────────────────────────────────────────────
    if (action === "ANALYZE") {
      const { sampleKey, base64Data, mimeType, text } = body;

      const result = await analyzeInvoiceImageOrText({
        sampleKey,
        base64Data,
        mimeType,
        text,
      });

      return NextResponse.json({
        success: true,
        result,
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ACTION 2 : ENREGISTREMENT & SYNCHRONISATION (COMPTA + FISCALITÉ + BI)
    // ──────────────────────────────────────────────────────────────────────────
    if (action === "CONFIRM_SAVE") {
      const {
        journal,
        date,
        piece,
        libelle,
        lines,
        documentUrl,
        documentName,
        status = "VALIDE", // "BROUILLON" ou "VALIDE"
        syncWithBI = true,
        invoiceMeta,
      }: {
        journal: "ACHATS" | "VENTES" | "CAISSE" | "BANQUE";
        date: string;
        piece: string;
        libelle?: string;
        lines: SyscohadaProposedLine[];
        documentUrl?: string;
        documentName?: string;
        status?: "BROUILLON" | "VALIDE";
        syncWithBI?: boolean;
        invoiceMeta?: {
          type: "ACHAT" | "VENTE";
          tiers: string;
          nif?: string;
          zoneGeo?: string;
          tauxTVA?: number;
          articles: ExtractedArticle[];
        };
      } = body;

      if (!lines || lines.length < 2) {
        return NextResponse.json(
          { error: "INVALID_LINES", message: "Au moins 2 lignes sont requises pour une écriture comptable" },
          { status: 400 }
        );
      }

      // 1. Contrôle d'équilibre comptable
      const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
      const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);

      if (totalDebit <= 0 || totalDebit !== totalCredit) {
        return NextResponse.json(
          {
            error: "UNBALANCED_ENTRY",
            message: `Écriture déséquilibrée : Débit (${totalDebit}) ≠ Crédit (${totalCredit})`,
          },
          { status: 422 }
        );
      }

      // 2. Vérification exercice ouvert
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant || !tenant.exerciceOuvert) {
        return NextResponse.json(
          { error: "EXERCICE_LOCKED", message: "L'exercice comptable du dossier est clôturé" },
          { status: 423 }
        );
      }

      // 3. Exécution atomique
      const transactionResult = await prisma.$transaction(async (tx) => {
        // A. Auto-provisionner les comptes nécessaires s'ils manquent dans comptePlan
        const neededCodes = [...new Set(lines.map((l) => l.accountCode))];
        const existingAccounts = await tx.comptePlan.findMany({
          where: { tenantId, code: { in: neededCodes } },
          select: { code: true },
        });
        const existingSet = new Set(existingAccounts.map((a) => a.code));

        const toCreate = neededCodes.filter((code) => !existingSet.has(code));
        if (toCreate.length > 0) {
          await tx.comptePlan.createMany({
            data: toCreate.map((code) => {
              const std = STANDARD_ACCOUNTS_MAP[code] || {
                libelle: `Compte ${code}`,
                classe: parseInt(code.charAt(0), 10) || 4,
              };
              return {
                tenantId,
                code,
                libelle: std.libelle,
                classe: std.classe,
                postable: true,
                isRoot: false,
                type: "STANDARD",
              };
            }),
            skipDuplicates: true,
          });
        }

        // B. Créer l'écriture comptable
        const ecriture = await tx.ecriture.create({
          data: {
            tenantId,
            journal,
            date,
            piece,
            libelle: libelle || `Facture ${piece}`,
            status,
            documentUrl: documentUrl || null,
            documentName: documentName || null,
            lines: {
              create: lines.map((l) => ({
                accountCode: l.accountCode,
                libelle: l.libelle,
                debit: Number(l.debit) || 0,
                credit: Number(l.credit) || 0,
              })),
            },
          },
          include: {
            lines: true,
          },
        });

        // C. Synchronisation avec le Workspace BI (Ventes / Achats par article)
        let biSyncedCount = 0;
        if (syncWithBI && invoiceMeta && invoiceMeta.articles && invoiceMeta.articles.length > 0) {
          const tauxTva = invoiceMeta.tauxTVA ?? 18;

          if (invoiceMeta.type === "VENTE") {
            // 1. Client Ref
            const clientCode = `CLI-${invoiceMeta.tiers.slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, "") || "DIV"}`;
            let client = await tx.clientRef.findUnique({
              where: { tenantId_code: { tenantId, code: clientCode } },
            });

            if (!client) {
              client = await tx.clientRef.create({
                data: {
                  tenantId,
                  code: clientCode,
                  name: invoiceMeta.tiers,
                  segment: "PME",
                  zoneGeo: invoiceMeta.zoneGeo || "Lomé",
                  encoursAutorise: 5000000,
                },
              });
            }

            // 2. Sales records
            for (const art of invoiceMeta.articles) {
              const prodCode = `PRD-${art.designation.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, "") || "ART"}`;
              let product = await tx.productRef.findUnique({
                where: { tenantId_code: { tenantId, code: prodCode } },
              });

              if (!product) {
                product = await tx.productRef.create({
                  data: {
                    tenantId,
                    code: prodCode,
                    designation: art.designation,
                    category: art.category || "Général",
                    priceVentHT: art.puHT,
                    costAchatHT: Math.round(art.puHT * 0.7), // marge estimée 30%
                    margineCible: 30,
                  },
                });
              }

              const mntHT = art.totalHT || art.quantity * art.puHT;
              const mntTVA = tauxTva > 0 ? Math.round(mntHT * (tauxTva / 100)) : 0;
              const mntTTC = mntHT + mntTVA;

              await tx.sale.create({
                data: {
                  tenantId,
                  date,
                  refFacture: piece,
                  clientId: client.id,
                  productId: product.id,
                  quantity: art.quantity || 1,
                  puHT: art.puHT,
                  montantHT: mntHT,
                  tauxTVA: tauxTva,
                  montantTVA: mntTVA,
                  montantTTC: mntTTC,
                },
              });
              biSyncedCount++;
            }
          } else if (invoiceMeta.type === "ACHAT") {
            // Achats (Purchases)
            for (const art of invoiceMeta.articles) {
              const prodCode = `PRD-${art.designation.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, "") || "ACH"}`;
              let product = await tx.productRef.findUnique({
                where: { tenantId_code: { tenantId, code: prodCode } },
              });

              if (!product) {
                product = await tx.productRef.create({
                  data: {
                    tenantId,
                    code: prodCode,
                    designation: art.designation,
                    category: art.category || "Approvisionnement",
                    priceVentHT: Math.round(art.puHT * 1.3),
                    costAchatHT: art.puHT,
                    margineCible: 30,
                  },
                });
              }

              const mntHT = art.totalHT || art.quantity * art.puHT;
              const mntTVA = tauxTva > 0 ? Math.round(mntHT * (tauxTva / 100)) : 0;
              const mntTTC = mntHT + mntTVA;

              await tx.purchase.create({
                data: {
                  tenantId,
                  date,
                  refCommande: piece,
                  supplierId: invoiceMeta.tiers,
                  productId: product.id,
                  quantity: art.quantity || 1,
                  puHT: art.puHT,
                  montantHT: mntHT,
                  tauxTVA: tauxTva,
                  montantTVA: mntTVA,
                  montantTTC: mntTTC,
                },
              });
              biSyncedCount++;
            }
          }
        }

        // D. Audit log
        await tx.auditLog.create({
          data: {
            tenantId,
            userId: user.userId,
            action: status === "BROUILLON" ? "CREATE_ECRITURE_BROUILLON" : "CREATE_ECRITURE_VALIDE",
            entity: "ECRITURE",
            details: JSON.stringify({
              piece,
              journal,
              date,
              total: totalDebit,
              status,
              biSyncedCount,
              source: "OCR_AI_SCANNER",
            }),
          },
        });

        return { ecriture, biSyncedCount };
      });

      return NextResponse.json({
        success: true,
        ecriture: transactionResult.ecriture,
        biSyncedCount: transactionResult.biSyncedCount,
        message:
          status === "BROUILLON"
            ? "Facture numérisée et enregistrée comme BROUILLON (en attente de validation comptable)."
            : "Facture numérisée, écriture comptable validée et synchronisée avec le Workspace BI.",
      });
    }

    return NextResponse.json({ error: "UNKNOWN_ACTION", message: "Action non supportée" }, { status: 400 });
  } catch (error: any) {
    console.error("[OCR_FACTURE_ERROR]", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: error.message || "Erreur interne lors de l'OCR de facture" },
      { status: 500 }
    );
  }
});

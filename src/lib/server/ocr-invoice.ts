/**
 * Moteur d'OCR & Extraction Intelligente de Factures — Contexte Togo / SYSCOHADA
 * Supporte : Qwen / Dashscope (Vision & Chat) + DeepSeek + Parser heuristique togolais robuste
 */

export interface ExtractedArticle {
  designation: string;
  quantity: number;
  puHT: number;
  totalHT: number;
  category?: string;
}

export interface ExtractedInvoice {
  type: "ACHAT" | "VENTE";
  journal: "ACHATS" | "VENTES";
  numeroPiece: string;
  date: string; // YYYY-MM-DD
  tiers: string;
  nif?: string;
  isNifValid: boolean;
  centreFiscal?: string;
  zoneGeo?: string;
  montantHT: number;
  tauxTVA: number; // ex: 18 ou 0
  montantTVA: number;
  montantTTC: number;
  modePaiement: "CREDIT" | "ESPECES" | "BANQUE";
  articles: ExtractedArticle[];
  natureAchat?: "MARCHANDISE" | "ENERGIE" | "TELECOM" | "FOURNITURE" | "SERVICE";
}

export interface SyscohadaProposedLine {
  accountCode: string;
  libelle: string;
  debit: number;
  credit: number;
}

export interface SyscohadaProposal {
  journal: "ACHATS" | "VENTES" | "CAISSE" | "BANQUE";
  date: string;
  piece: string;
  libelle: string;
  lines: SyscohadaProposedLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  anomalies: string[];
}

export interface InvoiceAnalysisResult {
  invoice: ExtractedInvoice;
  proposal: SyscohadaProposal;
  rawText?: string;
  modelUsed: string;
  confidence: number;
}

// ─── Vérification NIF Togo (OTR) ──────────────────────────────────────────────
// Le NIF au Togo comporte généralement 9 à 10 chiffres (ex: 1000123456 ou 100123456)
export function validateTogoNif(nif?: string): boolean {
  if (!nif) return false;
  const clean = nif.replace(/[\s\-\.]/g, "");
  return /^\d{9,10}[A-Z]?$/i.test(clean);
}

// ─── Génération de la proposition SYSCOHADA ──────────────────────────────────
export function generateSyscohadaProposal(inv: ExtractedInvoice): SyscohadaProposal {
  const lines: SyscohadaProposedLine[] = [];
  const anomalies: string[] = [];

  // Contrôle TVA togolaise (18%)
  const expectedTva = inv.tauxTVA === 18 ? Math.round(inv.montantHT * 0.18) : 0;
  if (inv.tauxTVA === 18 && Math.abs(expectedTva - inv.montantTVA) > 50) {
    anomalies.push(
      `Écart de TVA détecté : calculé à 18% = ${expectedTva.toLocaleString()} FCFA, facture = ${inv.montantTVA.toLocaleString()} FCFA`
    );
  }

  // Contrôle NIF
  if (!inv.nif) {
    anomalies.push("Numéro d'Identification Fiscale (NIF) non trouvé sur la pièce");
  } else if (!validateTogoNif(inv.nif)) {
    anomalies.push(`Format de NIF togolais potentiellement non conforme OTR (${inv.nif})`);
  }

  // Détermination du compte de tiers ou trésorerie
  let tiersAccount = inv.type === "ACHAT" ? "401100" : "411100";
  let tiersLibelle = inv.type === "ACHAT" ? `Fournisseur : ${inv.tiers}` : `Client : ${inv.tiers}`;

  if (inv.modePaiement === "ESPECES") {
    tiersAccount = "571100";
    tiersLibelle = `Caisse principale — Règlement comptant ${inv.tiers}`;
  } else if (inv.modePaiement === "BANQUE") {
    tiersAccount = "521100";
    tiersLibelle = `Banque — Virement/Chèque ${inv.tiers}`;
  }

  if (inv.type === "ACHAT") {
    // Choix du compte de charge SYSCOHADA selon la nature
    let chargeCode = "601100";
    let chargeLibelle = `Achats marchandises — ${inv.tiers}`;

    if (inv.natureAchat === "ENERGIE") {
      chargeCode = "605100";
      chargeLibelle = `Électricité (CEET / Cash Power) — ${inv.tiers}`;
    } else if (inv.natureAchat === "TELECOM") {
      chargeCode = "628100";
      chargeLibelle = `Frais télécoms (TogoCom/Moov) — ${inv.tiers}`;
    } else if (inv.natureAchat === "FOURNITURE") {
      chargeCode = "606100";
      chargeLibelle = `Fournitures de bureau — ${inv.tiers}`;
    } else if (inv.natureAchat === "SERVICE") {
      chargeCode = "631100";
      chargeLibelle = `Prestations de services — ${inv.tiers}`;
    }

    // 1. Débit Compte de charge HT
    lines.push({
      accountCode: chargeCode,
      libelle: chargeLibelle,
      debit: inv.montantHT,
      credit: 0,
    });

    // 2. Débit TVA Déductible si applicable (445200)
    if (inv.montantTVA > 0) {
      lines.push({
        accountCode: "445200",
        libelle: `État, TVA déductible s/achats (18%) — Fact. ${inv.numeroPiece}`,
        debit: inv.montantTVA,
        credit: 0,
      });
    }

    // 3. Crédit Fournisseur ou Trésorerie TTC
    lines.push({
      accountCode: tiersAccount,
      libelle: tiersLibelle,
      debit: 0,
      credit: inv.montantTTC,
    });
  } else {
    // VENTE
    // 1. Débit Client ou Trésorerie TTC
    lines.push({
      accountCode: tiersAccount,
      libelle: tiersLibelle,
      debit: inv.montantTTC,
      credit: 0,
    });

    // 2. Crédit Vente HT (701100)
    lines.push({
      accountCode: "701100",
      libelle: `Ventes de marchandises — Fact. ${inv.numeroPiece} (${inv.tiers})`,
      debit: 0,
      credit: inv.montantHT,
    });

    // 3. Crédit TVA Collectée si applicable (443100)
    if (inv.montantTVA > 0) {
      lines.push({
        accountCode: "443100",
        libelle: `État, TVA facturée s/ventes (18%) — Fact. ${inv.numeroPiece}`,
        debit: 0,
        credit: inv.montantTVA,
      });
    }
  }

  const totalDebit = lines.reduce((acc, l) => acc + l.debit, 0);
  const totalCredit = lines.reduce((acc, l) => acc + l.credit, 0);
  const isBalanced = totalDebit > 0 && totalDebit === totalCredit;

  if (!isBalanced) {
    anomalies.push(`Déséquilibre d'écriture : Débit (${totalDebit} FCFA) ≠ Crédit (${totalCredit} FCFA)`);
  }

  return {
    journal: inv.journal,
    date: inv.date,
    piece: inv.numeroPiece,
    libelle: `Facture ${inv.type === "ACHAT" ? "Achat" : "Vente"} ${inv.numeroPiece} — ${inv.tiers}`,
    lines,
    totalDebit,
    totalCredit,
    isBalanced,
    anomalies,
  };
}

// ─── Modèles Démonstration Togolais Pré-calibrés ─────────────────────────────
export const TOGO_SAMPLE_INVOICES: Record<string, ExtractedInvoice> = {
  SAMPLE_ACHAT_GROSSISTE: {
    type: "ACHAT",
    journal: "ACHATS",
    numeroPiece: "FAC-2026-0842",
    date: new Date().toISOString().slice(0, 10),
    tiers: "ETS COMPAORÉ & FRÈRES — GRAND MARCHÉ LOMÉ",
    nif: "1000492815",
    isNifValid: true,
    centreFiscal: "DPME Lomé",
    zoneGeo: "Lomé Grand Marché",
    montantHT: 500000,
    tauxTVA: 18,
    montantTVA: 90000,
    montantTTC: 590000,
    modePaiement: "CREDIT",
    natureAchat: "MARCHANDISE",
    articles: [
      { designation: "Sacs de Riz Parfumé 50kg (Thailande)", quantity: 20, puHT: 17500, totalHT: 350000, category: "Alimentaire" },
      { designation: "Cartons Huile Végétale Mayor 5L (x4)", quantity: 10, puHT: 15000, totalHT: 150000, category: "Alimentaire" },
    ],
  },
  SAMPLE_CEET_CASHPOWER: {
    type: "ACHAT",
    journal: "ACHATS",
    numeroPiece: "CEET-CP-994120",
    date: new Date().toISOString().slice(0, 10),
    tiers: "CEET (Compagnie Énergie Électrique du Togo)",
    nif: "1000002134",
    isNifValid: true,
    centreFiscal: "DGE Lomé",
    zoneGeo: "Lomé Golfe",
    montantHT: 100000,
    tauxTVA: 18,
    montantTVA: 18000,
    montantTTC: 118000,
    modePaiement: "ESPECES",
    natureAchat: "ENERGIE",
    articles: [
      { designation: "Recharge Cash Power Électricité Pro 500 kWh", quantity: 1, puHT: 100000, totalHT: 100000, category: "Énergie" },
    ],
  },
  SAMPLE_VENTE_CLIENT: {
    type: "VENTE",
    journal: "VENTES",
    numeroPiece: "VT-2026-0118",
    date: new Date().toISOString().slice(0, 10),
    tiers: "STE NOUVELLE VISION SARL (AGOÈ-NYIVÉ)",
    nif: "1000883412",
    isNifValid: true,
    centreFiscal: "DPI Agoè-Nyivé",
    zoneGeo: "Agoè-Nyivé Lomé",
    montantHT: 850000,
    tauxTVA: 18,
    montantTVA: 153000,
    montantTTC: 1003000,
    modePaiement: "BANQUE",
    articles: [
      { designation: "Ordinateur Portable HP ProBook 450 G9", quantity: 2, puHT: 350000, totalHT: 700000, category: "Informatique" },
      { designation: "Imprimante Multifonction Canon Laser", quantity: 1, puHT: 150000, totalHT: 150000, category: "Informatique" },
    ],
  },
};

// ─── Heuristic / RegEx Parser de Facture ──────────────────────────────────────
export function parseInvoiceFromText(text: string): ExtractedInvoice {
  const isVente = /(client|facture\s+de\s+vente|doit\s*:|vendu\s+a)/i.test(text);
  const type: "ACHAT" | "VENTE" = isVente ? "VENTE" : "ACHAT";
  const journal = isVente ? "VENTES" : "ACHATS";

  // NIF
  const nifMatch = text.match(/NIF\s*[:\.\s#]*([0-9A-Z\s]{8,15})/i);
  const rawNif = nifMatch ? nifMatch[1].trim().replace(/\s+/g, "") : undefined;
  const isNifValid = validateTogoNif(rawNif);

  // N° Pièce
  const pieceMatch = text.match(/(?:facture|pi[eè]ce|invoice|quittance|n[°o])\s*[:\.\s#]*([A-Z0-9\-\/]{3,20})/i);
  const numeroPiece = pieceMatch ? pieceMatch[1].trim() : `FAC-${Date.now().toString().slice(-6)}`;

  // Date
  const dateMatch = text.match(/(\d{4}[-\/]\d{2}[-\/]\d{2}|\d{2}[-\/]\d{2}[-\/]\d{4})/);
  let date = new Date().toISOString().slice(0, 10);
  if (dateMatch) {
    const rawDate = dateMatch[1].replace(/\//g, "-");
    if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
      const [d, m, y] = rawDate.split("-");
      date = `${y}-${m}-${d}`;
    } else {
      date = rawDate;
    }
  }

  // Tiers (Fournisseur ou Client)
  let tiers = type === "ACHAT" ? "Fournisseur local" : "Client comptoir";
  const tiersMatch = text.match(/(?:fournisseur|doit|client|soci[eé]t[eé]|ets|ets\.)\s*[:\.\-]?\s*([A-Za-z0-9\s&'\.]{3,50})/i);
  if (tiersMatch) {
    tiers = tiersMatch[1].trim().split("\n")[0].trim();
  }

  // Détection de la nature d'achat
  let natureAchat: ExtractedInvoice["natureAchat"] = "MARCHANDISE";
  if (/(ceet|cash\s*power|electricite|[eé]nergie)/i.test(text + " " + tiers)) {
    natureAchat = "ENERGIE";
  } else if (/(togocom|moov|internet|t[eé]l[eé]phone|fibre)/i.test(text + " " + tiers)) {
    natureAchat = "TELECOM";
  } else if (/(papeterie|bureau|fourniture|rame|stylo)/i.test(text + " " + tiers)) {
    natureAchat = "FOURNITURE";
  } else if (/(honoraires|consultance|r[eé]paration|prestation|entretien)/i.test(text + " " + tiers)) {
    natureAchat = "SERVICE";
  }

  // Montants
  const ttcMatch = text.match(/(?:total\s*ttc|net\s*a\s*payer|montant\s*ttc)\s*[:\.\s]*([0-9\s\.,]+)/i);
  const htMatch = text.match(/(?:total\s*ht|montant\s*ht)\s*[:\.\s]*([0-9\s\.,]+)/i);
  const tvaMatch = text.match(/(?:tva|montant\s*tva)\s*(?:18%?)?\s*[:\.\s]*([0-9\s\.,]+)/i);

  const cleanNum = (str?: string) => {
    if (!str) return 0;
    const clean = str.replace(/[^\d]/g, "");
    return parseInt(clean, 10) || 0;
  };

  let montantTTC = cleanNum(ttcMatch?.[1]);
  let montantHT = cleanNum(htMatch?.[1]);
  let montantTVA = cleanNum(tvaMatch?.[1]);

  if (montantTTC > 0 && montantHT === 0) {
    // Calcul inverse à partir du TTC (TVA 18%)
    montantHT = Math.round(montantTTC / 1.18);
    montantTVA = montantTTC - montantHT;
  } else if (montantHT > 0 && montantTTC === 0) {
    montantTVA = Math.round(montantHT * 0.18);
    montantTTC = montantHT + montantTVA;
  } else if (montantHT === 0 && montantTTC === 0) {
    // Fallback par défaut
    montantHT = 100000;
    montantTVA = 18000;
    montantTTC = 118000;
  }

  // Mode de règlement
  let modePaiement: ExtractedInvoice["modePaiement"] = "CREDIT";
  if (/(esp[eè]ces|caisse|cash)/i.test(text)) {
    modePaiement = "ESPECES";
  } else if (/(virement|ch[eè]que|banque|ecobank|orabank|boa|t-money|flooz)/i.test(text)) {
    modePaiement = "BANQUE";
  }

  return {
    type,
    journal,
    numeroPiece,
    date,
    tiers,
    nif: rawNif,
    isNifValid,
    montantHT,
    tauxTVA: montantTVA > 0 ? 18 : 0,
    montantTVA,
    montantTTC,
    modePaiement,
    natureAchat,
    articles: [
      {
        designation: `Opération ${natureAchat.toLowerCase()} ${tiers}`,
        quantity: 1,
        puHT: montantHT,
        totalHT: montantHT,
        category: natureAchat,
      },
    ],
  };
}

// ─── Analyse Complète avec Qwen/DeepSeek ou Fallback ─────────────────────────
export async function analyzeInvoiceImageOrText(options: {
  text?: string;
  base64Data?: string;
  mimeType?: string;
  sampleKey?: string;
}): Promise<InvoiceAnalysisResult> {
  // 1. Si échantillon démo demandé
  if (options.sampleKey && TOGO_SAMPLE_INVOICES[options.sampleKey]) {
    const inv = TOGO_SAMPLE_INVOICES[options.sampleKey];
    const proposal = generateSyscohadaProposal(inv);
    return {
      invoice: inv,
      proposal,
      modelUsed: "Démo Intelligente OTR / SYSCOHADA",
      confidence: 99,
    };
  }

  // 2. Tentative avec Qwen AI (Alibaba DashScope) ou DeepSeek
  const qwenKey = process.env.QWEN_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  if (qwenKey || deepseekKey) {
    try {
      const isQwen = Boolean(qwenKey);
      const endpoint = isQwen
        ? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions"
        : "https://api.deepseek.com/v1/chat/completions";
      const apiKey = isQwen ? qwenKey : deepseekKey;
      const model = isQwen ? (process.env.QWEN_MODEL || "qwen-plus") : (process.env.DEEPSEEK_MODEL || "deepseek-chat");

      const systemPrompt = `Tu es un système OCR et d'intelligence comptable spécialisé dans les factures commerciales au Togo (OHADA / SYSCOHADA / OTR).
Tu dois analyser le document ou texte de facture et retourner STRICTEMENT un JSON valide au format suivant :
{
  "type": "ACHAT" ou "VENTE",
  "numeroPiece": "string (n° facture)",
  "date": "YYYY-MM-DD",
  "tiers": "string (nom fournisseur ou client)",
  "nif": "string ou null (numéro NIF Togo 9-10 chiffres)",
  "centreFiscal": "string ou null (ex: DPME Lomé, DGE, DPI Agoè)",
  "zoneGeo": "string ou null (ex: Lomé, Kara, Agoè-Nyivé)",
  "montantHT": integer (en FCFA entiers),
  "tauxTVA": integer (18 ou 0),
  "montantTVA": integer (en FCFA entiers),
  "montantTTC": integer (en FCFA entiers),
  "modePaiement": "CREDIT" ou "ESPECES" ou "BANQUE",
  "natureAchat": "MARCHANDISE" ou "ENERGIE" ou "TELECOM" ou "FOURNITURE" ou "SERVICE",
  "articles": [
    {
      "designation": "string",
      "quantity": number,
      "puHT": number,
      "totalHT": number,
      "category": "string"
    }
  ]
}
Assure-toi que montantHT + montantTVA == montantTTC. Si la TVA est de 18%, montantTVA = round(montantHT * 0.18).`;

      let messages: any[] = [{ role: "system", content: systemPrompt }];

      if (options.base64Data && isQwen) {
        // Envoi multimodal si image présente
        const mime = options.mimeType || "image/jpeg";
        messages.push({
          role: "user",
          content: [
            {
              type: "text",
              text: "Extrais toutes les données comptables et les articles de cette facture commerciale togolaise :",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mime};base64,${options.base64Data}`,
              },
            },
          ],
        });
      } else {
        messages.push({
          role: "user",
          content: `Voici le texte extrait ou contenu de la facture commerciale : \n${options.text || "Facture commerciale Grand Marché Lomé"}`,
        });
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      });

      if (res.ok) {
        const jsonRes = await res.json();
        const content = jsonRes.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const invoice: ExtractedInvoice = {
            type: parsed.type === "VENTE" ? "VENTE" : "ACHAT",
            journal: parsed.type === "VENTE" ? "VENTES" : "ACHATS",
            numeroPiece: parsed.numeroPiece || `FAC-${Date.now().toString().slice(-6)}`,
            date: parsed.date || new Date().toISOString().slice(0, 10),
            tiers: parsed.tiers || "Tiers",
            nif: parsed.nif || undefined,
            isNifValid: validateTogoNif(parsed.nif),
            centreFiscal: parsed.centreFiscal || "DPME Lomé",
            zoneGeo: parsed.zoneGeo || "Lomé",
            montantHT: Number(parsed.montantHT) || 0,
            tauxTVA: Number(parsed.tauxTVA) || 18,
            montantTVA: Number(parsed.montantTVA) || 0,
            montantTTC: Number(parsed.montantTTC) || 0,
            modePaiement: parsed.modePaiement || "CREDIT",
            natureAchat: parsed.natureAchat || "MARCHANDISE",
            articles: Array.isArray(parsed.articles) && parsed.articles.length > 0
              ? parsed.articles.map((a: any) => ({
                  designation: a.designation || "Article",
                  quantity: Number(a.quantity) || 1,
                  puHT: Number(a.puHT) || 0,
                  totalHT: Number(a.totalHT) || 0,
                  category: a.category || "Divers",
                }))
              : [
                  {
                    designation: `Opération ${parsed.tiers || "Commerciale"}`,
                    quantity: 1,
                    puHT: Number(parsed.montantHT) || 0,
                    totalHT: Number(parsed.montantHT) || 0,
                    category: "Divers",
                  },
                ],
          };

          const proposal = generateSyscohadaProposal(invoice);
          return {
            invoice,
            proposal,
            modelUsed: `${isQwen ? "Qwen Vision / NLP" : "DeepSeek AI"} (Modèle Togolais)`,
            confidence: 96,
            rawText: content,
          };
        }
      }
    } catch (err) {
      console.warn("[OCR_AI_FALLBACK_TRIGGERED]", err);
    }
  }

  // 3. Fallback Heuristique Régulier
  const fallbackInvoice = parseInvoiceFromText(options.text || "");
  const proposal = generateSyscohadaProposal(fallbackInvoice);

  return {
    invoice: fallbackInvoice,
    proposal,
    modelUsed: "Moteur Heuristique & Regex SYSCOHADA (Local)",
    confidence: 85,
  };
}

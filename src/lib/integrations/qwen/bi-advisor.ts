/**
 * Client IA Multi-Provider — Conseiller BI & Fiscal
 * Supporte : DeepSeek (primaire) + Qwen / Alibaba Cloud (fallback)
 * Les deux APIs sont compatibles avec le format OpenAI
 * Config via BI_AI_PROVIDER="deepseek"|"qwen" dans .env
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BIInsight {
  type: "opportunity" | "warning" | "success" | "recommendation";
  title: string;
  description: string;
  impact?: string;
  confidence: number;
  priority: "high" | "medium" | "low";
}

export interface BIAnalysisResult {
  healthScore: number;
  summary: string;
  insights: BIInsight[];
  fiscalAlerts: string[];
  generatedAt: string;
  model: string;
  provider: string;
}

export interface BIDataContext {
  kpis: {
    ca: number;
    margeBrute: number;
    margePercent: number;
    clientsActifs: number;
    trésorerie: number;
  };
  topProducts?: Array<{
    designation: string;
    ca: number;
    margePercent: number;
    volume: number;
  }>;
  forecastTotal?: number;
  topClientShare?: number;
  salesTrend?: "hausse" | "baisse" | "stable";
  categories?: Array<{ category: string; margePercent: number }>;
}

// ─── Configuration des providers ─────────────────────────────────────────────

interface AIProvider {
  name: string;
  baseUrl: string;
  apiKey: string | undefined;
  model: string;
}

function getProviders(): AIProvider[] {
  const primary = process.env.BI_AI_PROVIDER ?? "deepseek";

  const deepseek: AIProvider = {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
  };

  const qwen: AIProvider = {
    name: "Qwen",
    baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    apiKey: process.env.QWEN_API_KEY,
    model: process.env.QWEN_MODEL ?? "qwen-plus",
  };

  // Ordre : provider primaire en premier, l'autre en fallback
  return primary === "qwen" ? [qwen, deepseek] : [deepseek, qwen];
}

// ─── Appel générique (OpenAI-compatible) ─────────────────────────────────────

async function callProvider(
  provider: AIProvider,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (!provider.apiKey) {
    throw new Error(`Clé API ${provider.name} non configurée`);
  }

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${provider.name} API ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${provider.name} : réponse vide`);
  return content;
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es un conseiller financier expert spécialisé dans les PME africaines,
particulièrement au Togo. Tu maîtrises le système fiscal OTR (Office Togolais des Recettes),
la norme comptable SYSCOHADA, et les dynamiques du marché togolais.

Ta réponse doit être un JSON valide avec exactement cette structure :
{
  "healthScore": <number 0-100>,
  "summary": "<synthèse exécutive 2-3 phrases en français>",
  "insights": [
    {
      "type": "<opportunity|warning|success|recommendation>",
      "title": "<titre court>",
      "description": "<description actionnable>",
      "impact": "<impact quantifié si possible, sinon null>",
      "confidence": <70-98>,
      "priority": "<high|medium|low>"
    }
  ],
  "fiscalAlerts": ["<alerte fiscale OTR/TVA si pertinent>"]
}

Génère entre 4 et 6 insights actionnables. Sois précis, chiffré et contextualisé au marché togolais (FCFA, OTR, TVA 18%, IS 27%).`;

function buildUserPrompt(ctx: BIDataContext): string {
  return `Analyse ces données d'une PME togolaise et génère un rapport BI complet :

INDICATEURS CLÉS (KPIs) :
- Chiffre d'affaires HT : ${ctx.kpis.ca.toLocaleString("fr-FR")} FCFA
- Marge brute : ${ctx.kpis.margeBrute.toLocaleString("fr-FR")} FCFA (${ctx.kpis.margePercent}%)
- Trésorerie estimée : ${ctx.kpis.trésorerie.toLocaleString("fr-FR")} FCFA
- Clients actifs : ${ctx.kpis.clientsActifs}
- Part du 1er client dans le CA : ${ctx.topClientShare ?? "N/A"}%
- Tendance des ventes : ${ctx.salesTrend ?? "inconnue"}

TOP PRODUITS PAR MARGE :
${
  ctx.topProducts
    ?.slice(0, 5)
    .map(
      (p, i) =>
        `${i + 1}. ${p.designation} — CA ${p.ca.toLocaleString("fr-FR")} FCFA, Marge ${p.margePercent}%, Vol ${p.volume} unités`
    )
    .join("\n") ?? "Aucune donnée produit"
}

PRÉVISION CA 30 JOURS : ${ctx.forecastTotal ? ctx.forecastTotal.toLocaleString("fr-FR") + " FCFA" : "Non disponible"}

RENTABILITÉ PAR CATÉGORIE :
${
  ctx.categories
    ?.map((c) => `- ${c.category} : ${c.margePercent}% de marge`)
    .join("\n") ?? "Aucune donnée catégorie"
}

Génère une analyse stratégique complète adaptée au contexte fiscal togolais (OTR, TVA 18%, IS 27%, SYSCOHADA).`;
}

// ─── Analyse BI — Multi-Provider avec fallback automatique ───────────────────

export async function analyzeBusinessData(ctx: BIDataContext): Promise<BIAnalysisResult> {
  const providers = getProviders();
  const userPrompt = buildUserPrompt(ctx);
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      console.log(`[BI] Tentative avec ${provider.name} (${provider.model})...`);
      const raw = await callProvider(provider, SYSTEM_PROMPT, userPrompt);
      const parsed = JSON.parse(raw);

      console.log(`[BI] Succès avec ${provider.name}`);
      return {
        healthScore: parsed.healthScore ?? 70,
        summary: parsed.summary ?? `Analyse générée par ${provider.name} AI.`,
        insights: parsed.insights ?? [],
        fiscalAlerts: parsed.fiscalAlerts ?? [],
        generatedAt: new Date().toISOString(),
        model: provider.model,
        provider: provider.name,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[BI] ${provider.name} échoué: ${msg}`);
      errors.push(`${provider.name}: ${msg}`);
    }
  }

  // Tous les providers ont échoué
  throw new Error(`Tous les providers IA ont échoué. Erreurs: ${errors.join(" | ")}`);
}

// ─── Fallback local (moteur de règles) ───────────────────────────────────────

export function fallbackRulesAnalysis(ctx: BIDataContext): BIAnalysisResult {
  const insights: BIInsight[] = [];
  let score = 70;

  if (ctx.kpis.margePercent >= 30) {
    score += 12;
    insights.push({
      type: "success",
      title: "Marge brute robuste",
      description: `Taux de marge de ${ctx.kpis.margePercent}% — supérieur à la moyenne sectorielle togolaise (25%). Les coûts d'achat sont bien maîtrisés.`,
      confidence: 92,
      priority: "low",
    });
  } else {
    score -= 10;
    insights.push({
      type: "warning",
      title: "Pression sur les marges",
      description: `Marge actuelle de ${ctx.kpis.margePercent}%. Une renégociation tarifaire avec les fournisseurs permettrait de récupérer 3 à 5 points.`,
      impact: `+${Math.round(ctx.kpis.ca * 0.04).toLocaleString("fr-FR")} FCFA de résultat net`,
      confidence: 87,
      priority: "high",
    });
  }

  if ((ctx.topClientShare ?? 0) > 25) {
    score -= 12;
    insights.push({
      type: "warning",
      title: "Concentration du CA",
      description: `Le 1er client représente ${ctx.topClientShare}% du CA. Une stratégie de diversification est recommandée pour sécuriser le cash-flow.`,
      impact: "Réduction du risque de trésorerie",
      confidence: 90,
      priority: "high",
    });
  }

  if (ctx.topProducts?.[0]) {
    const best = ctx.topProducts[0];
    insights.push({
      type: "opportunity",
      title: `Levier de croissance : ${best.designation}`,
      description: `Ce produit génère ${best.margePercent}% de marge sur ${best.volume} unités. Augmenter le stock tampon permettrait d'éviter les ruptures.`,
      impact: "Gain estimé de 15% sur les volumes",
      confidence: 88,
      priority: "medium",
    });
  }

  insights.push({
    type: "recommendation",
    title: "Conformité OTR & TVA 18%",
    description:
      "Réconciliez systématiquement les bordereaux de vente avec les journaux SYSCOHADA pour garantir un crédit de TVA déductible sans rejet fiscal OTR.",
    impact: "Zéro pénalité sur déclarations mensuelles",
    confidence: 96,
    priority: "high",
  });

  score = Math.max(10, Math.min(98, score));

  return {
    healthScore: score,
    summary: `L'analyse de vos données révèle une structure commerciale ${score >= 75 ? "saine et dynamique" : "stable avec des leviers d'optimisation prioritaires"}. CA consolidé : ${ctx.kpis.ca.toLocaleString("fr-FR")} FCFA avec ${ctx.kpis.clientsActifs} clients actifs. (Analyse locale — configurez BI_AI_PROVIDER dans .env)`,
    insights,
    fiscalAlerts:
      ctx.kpis.ca > 50_000_000
        ? ["CA > 50M FCFA : vérifiez le seuil d'assujettissement à l'IS (27%) auprès de l'OTR"]
        : [],
    generatedAt: new Date().toISOString(),
    model: "rules-engine-fallback",
    provider: "Local",
  };
}

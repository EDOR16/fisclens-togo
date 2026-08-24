"use client";

import { useState } from "react";
import { Highlight, LegalRef, Stamp } from "@/components/landing/ui";
import { useUI, Switchers } from "@/lib/ui-providers";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Building2, Landmark, ShieldCheck, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

// ─── Données constantes CFE & OTR Togo ──────────────────────────────────────────

const REGIMES = [
  { value: "REEL_NORMAL", label: "Réel Normal (IS 27%, TVA 18%, Liasse complète)" },
  { value: "RSI", label: "Régime Simplifié d'Imposition (RSI)" },
  { value: "TPU", label: "Taxe Professionnelle Unique (TPU / Synthétique)" },
] as const;

const FORMES_JURIDIQUES = [
  { value: "SARL", label: "SARL / SARL U (Société à Responsabilité Limitée)" },
  { value: "SAS", label: "SAS / SASU (Société par Actions Simplifiée)" },
  { value: "SA", label: "SA (Société Anonyme)" },
  { value: "EI", label: "Entreprise Individuelle (Établissement - CFE)" },
  { value: "CABINET", label: "Cabinet d'Expertise Comptable / Société Civile" },
] as const;

const CENTRES_FISCAUX = [
  "DPME Lomé (Direction des Petites et Moyennes Entreprises)",
  "DGE Lomé (Direction des Grandes Entreprises)",
  "DPI Golfe 1 (Bè - Grand Marché)",
  "DPI Golfe 2 (Hédzranawoé - Tokoin)",
  "DPI Golfe 3 & 4 (Amoutivé - Hanoukopé)",
  "DPI Golfe 5 & 7 (Aflao Gakli - Sagbado)",
  "DPI Agoè-Nyivé (Agoè Centre - Legbassito)",
  "Division Régionale Maritime (Tsévié)",
  "Division Régionale des Plateaux (Atakpamé - Kpalimé)",
  "Division Régionale Centrale (Sokodé)",
  "Division Régionale de la Kara (Kara)",
  "Division Régionale des Savanes (Dapaong)",
];

/** Score de solidité du mot de passe 0..4 (section 8) */
function score(p: string) {
  return [
    p.length >= 10,
    /[A-Z]/.test(p) && /[a-z]/.test(p),
    /\d/.test(p),
    /[^A-Za-z0-9]/.test(p),
  ].filter(Boolean).length;
}

const inputCls =
  "mt-1 w-full border-b-2 border-dashed border-ink/40 bg-transparent py-2 " +
  "font-mono text-ink outline-none focus:border-ink placeholder:text-ink/30 text-sm";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const { t, theme } = useUI();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [f, setF] = useState({
    companyName: "",
    email: "",
    regime: "REEL_NORMAL",
    formeJuridique: "SARL",
    nif: "",
    rccm: "",
    cnssNumber: "",
    centreFiscal: "DPME Lomé (Direction des Petites et Moyennes Entreprises)",
    phone: "",
    city: "Lomé",
    password: "",
    confirm: "",
    cgu: false,
    conf: false,
  });

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));
  const s = score(f.password);

  const googleReady = f.companyName.trim().length >= 2 && !!f.regime && f.cgu && f.conf;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (f.password !== f.confirm)
      return setErr("Les deux mots de passe ne correspondent pas.");
    if (s < 2)
      return setErr("Mot de passe trop faible (10 caractères min., majuscules, chiffres).");

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: f.companyName,
          email: f.email,
          regime: f.regime,
          formeJuridique: f.formeJuridique,
          nif: f.nif || undefined,
          rccm: f.rccm || undefined,
          cnssNumber: f.cnssNumber || undefined,
          centreFiscal: f.centreFiscal,
          phone: f.phone || undefined,
          city: f.city,
          password: f.password,
          cgu: f.cgu,
          confidentialite: f.conf,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return setErr(data.message || "Inscription impossible — vérifiez les champs ou l'email.");
      }
      setOk(true);
    } catch (e: any) {
      setErr("Erreur réseau lors de la création du dossier.");
    }
  }

  return (
    <main
      className={`${theme === "ink" ? "ink-ruled" : "paper-ruled"} min-h-screen font-body`}
      style={{ color: theme === "ink" ? "var(--paper)" : "var(--ink)" }}
    >
      {/* ── En-tête ── */}
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-6 pt-10">
        <span
          className="grid h-10 w-10 place-items-center rounded-lg font-mono text-lg font-semibold"
          style={{ background: "var(--ink)", color: "var(--bg)" }}
        >
          F
        </span>
        <p className="font-display text-xl font-semibold">
          FiscLens&nbsp;
          <span style={{ color: "var(--stamp)" }}>Togo</span>
        </p>
        <div className="ml-auto flex items-center gap-4">
          <p
            className="hidden font-mono text-[11px] uppercase tracking-widest sm:block"
            style={{ color: "var(--inkSoft)" }}
          >
            {t("no_sim")}
          </p>
          <Switchers />
        </div>
      </header>

      {/* ── Corps ── */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-12 lg:grid-cols-12 items-start">
        {/* Colonne pitch institutionnel */}
        <div className="lg:col-span-5 space-y-6">
          <h1 className="font-hand text-5xl leading-[0.95] md:text-6xl text-[#0B3D2E]">
            {t("h1_register")}
          </h1>
          <p className="text-base leading-relaxed text-[#33604C]">
            Un dossier d&apos;entreprise{" "}
            <Highlight>100% conforme CFE &amp; OTR</Highlight>&nbsp;:
            Plan SYSCOHADA, 6 journaux réels et paramétrage direct selon votre centre fiscal de rattachement.
          </p>

          <div className="receipt p-5 rounded-lg font-mono text-xs space-y-3 border-l-4 border-[#157A46]">
            <div className="flex items-center gap-2 font-bold text-[#0B3D2E] uppercase">
              <ShieldCheck className="h-4 w-4 text-[#157A46]" />
              Guichet Unique CFE &amp; OTR Togo
            </div>
            <p className="text-[#33604C] leading-relaxed">
              Vos déclarations de TVA (18%), IRPP (barème progressif) et Liasses Annuelles sont automatiquement reliées à votre <strong>Division Fiscale de rattachement</strong>.
            </p>
            <div className="pt-2 border-t border-dashed border-[#E2D9C2] flex flex-wrap gap-2 text-[10px] text-[#33604C]">
              <span>✓ NIF OTR 10 chiffres</span>
              <span>✓ RCCM Togo</span>
              <span>✓ CNSS / AMU (5%)</span>
            </div>
          </div>
        </div>

        {/* Formulaire = Reçu de création de dossier CFE */}
        <div className="lg:col-span-7 receipt rounded-sm p-6 sm:p-8 shadow-xl">
          <div className="flex items-start justify-between border-b-2 border-dashed border-[#0B3D2E]/20 pb-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#33604C] block font-bold">
                DOSSIER D&apos;ENTREPRISE TOGOLAISE
              </span>
              <h2 className="font-display text-2xl font-semibold text-[#0B3D2E]">
                {t("create_account")}
              </h2>
            </div>
            <Stamp>{t("tenant_ready")}</Stamp>
          </div>

          {ok ? (
            <div className="mt-8 space-y-4 font-mono text-sm text-center py-6">
              <CheckCircle2 className="h-12 w-12 text-[#157A46] mx-auto" />
              <p className="text-xl font-bold text-[#0B3D2E]">✔ {t("provisioned_ok")}</p>
              <p className="text-xs text-[#33604C] max-w-md mx-auto">{t("provisioned_desc")}</p>
              <div className="pt-4">
                <a
                  href="/login"
                  className="inline-block rounded-full px-8 py-3.5 font-bold font-mono text-xs shadow-lg transition-all"
                  style={{ background: "#0B3D2E", color: "#FBF7EC" }}
                >
                  {t("connect_cta")} →
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-5">
              {/* 1. Dénomination & Forme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block font-mono text-xs uppercase tracking-widest text-inkSoft">
                  Dénomination Entreprise *
                  <input
                    className={inputCls}
                    placeholder="Ex: TOGO NEGOCE SARL"
                    value={f.companyName}
                    onChange={(e) => set("companyName", e.target.value)}
                    required
                  />
                </label>

                <label className="block font-mono text-xs uppercase tracking-widest text-inkSoft">
                  Forme Juridique CFE *
                  <select
                    className={inputCls + " cursor-pointer"}
                    value={f.formeJuridique}
                    onChange={(e) => set("formeJuridique", e.target.value)}
                  >
                    {FORMES_JURIDIQUES.map((j) => (
                      <option key={j.value} value={j.value}>{j.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* 2. Email officiel & Régime Fiscal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block font-mono text-xs uppercase tracking-widest text-inkSoft">
                  {t("email")} Professionnel *
                  <input
                    className={inputCls}
                    type="email"
                    placeholder="contact@entreprise.tg"
                    value={f.email}
                    onChange={(e) => set("email", e.target.value)}
                    required
                  />
                </label>

                <label className="block font-mono text-xs uppercase tracking-widest text-inkSoft">
                  {t("regime")} *
                  <select
                    className={inputCls + " cursor-pointer"}
                    value={f.regime}
                    onChange={(e) => set("regime", e.target.value)}
                    required
                  >
                    {REGIMES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* 3. Centre des Impôts OTR de rattachement */}
              <label className="block font-mono text-xs uppercase tracking-widest text-inkSoft">
                Division / Centre des Impôts (OTR) *
                <select
                  className={inputCls + " cursor-pointer"}
                  value={f.centreFiscal}
                  onChange={(e) => set("centreFiscal", e.target.value)}
                >
                  {CENTRES_FISCAUX.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              {/* 4. Accordéon Identifiants Officiels CFE (Optionnel lors de l'inscription) */}
              <div className="rounded border border-dashed border-[#0B3D2E]/30 p-3 bg-white/40">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between font-mono text-xs font-bold text-[#0B3D2E]"
                >
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-[#157A46]" />
                    Numéros Carte Unique CFE (NIF, RCCM, CNSS)
                  </span>
                  <span className="text-[10px] text-[#33604C] flex items-center gap-1">
                    {showAdvanced ? "Masquer" : "Renseigner maintenant (Optionnel)"}
                    {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </span>
                </button>

                {showAdvanced && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 mt-3 border-t border-dashed border-[#0B3D2E]/20">
                    <label className="block font-mono text-[11px] text-inkSoft">
                      NIF OTR (10 chiffres)
                      <input
                        className={inputCls}
                        placeholder="Ex: 1001234567"
                        value={f.nif}
                        onChange={(e) => set("nif", e.target.value)}
                      />
                    </label>

                    <label className="block font-mono text-[11px] text-inkSoft">
                      Numéro RCCM
                      <input
                        className={inputCls}
                        placeholder="Ex: TG-LFW-..."
                        value={f.rccm}
                        onChange={(e) => set("rccm", e.target.value)}
                      />
                    </label>

                    <label className="block font-mono text-[11px] text-inkSoft">
                      Téléphone (Mobile Money)
                      <input
                        className={inputCls}
                        placeholder="+228 90..."
                        value={f.phone}
                        onChange={(e) => set("phone", e.target.value)}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* 5. Mot de passe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-inkSoft">
                    {t("password")} *
                    <input
                      className={inputCls}
                      type="password"
                      value={f.password}
                      onChange={(e) => set("password", e.target.value)}
                      required
                    />
                  </label>
                  {/* Indicateur de force */}
                  <div className="mt-2 flex gap-1" aria-hidden>
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 flex-1 rounded"
                        style={{
                          background:
                            i < s
                              ? s >= 2
                                ? "var(--stamp)"
                                : "var(--marginRed)"
                              : "rgba(11,61,46,.15)",
                        }}
                      />
                    ))}
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-[#33604C]">
                    10 caractères min. · majuscule · chiffre
                  </p>
                </div>

                <label className="block font-mono text-xs uppercase tracking-widest text-inkSoft">
                  {t("confirm")} *
                  <input
                    className={inputCls}
                    type="password"
                    value={f.confirm}
                    onChange={(e) => set("confirm", e.target.value)}
                    required
                  />
                </label>
              </div>

              {/* Consentements */}
              <div className="space-y-2 font-mono text-xs pt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    style={{ accentColor: "#0B3D2E" }}
                    checked={f.cgu}
                    onChange={(e) => set("cgu", e.target.checked)}
                    required
                  />
                  <span>
                    {t("cgu")} <LegalRef>v1.0 SYSCOHADA</LegalRef>
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    style={{ accentColor: "#0B3D2E" }}
                    checked={f.conf}
                    onChange={(e) => set("conf", e.target.checked)}
                    required
                  />
                  <span>
                    {t("privacy")} <LegalRef>loi togolaise n°2018-26</LegalRef>
                  </span>
                </label>
              </div>

              {/* Erreur */}
              {err && (
                <p
                  className="border-l-4 pl-3 font-mono text-xs py-1"
                  style={{ borderColor: "var(--marginRed)", color: "var(--marginRed)" }}
                >
                  {err}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-full py-3.5 font-semibold font-mono text-xs uppercase tracking-wider transition hover:opacity-90 active:scale-95 shadow-md"
                style={{ background: "#0B3D2E", color: "#FBF7EC" }}
              >
                Créer l&apos;Espace &amp; Ouvrir l&apos;Exercice →
              </button>

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1" style={{ background: "rgba(11,61,46,.15)" }} />
                <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--inkSoft)" }}>
                  ou
                </span>
                <span className="h-px flex-1" style={{ background: "rgba(11,61,46,.15)" }} />
              </div>

              <GoogleSignInButton
                companyName={f.companyName}
                regime={(f.regime || "REEL_NORMAL") as "REEL_NORMAL" | "RSI" | "TPU"}
                cguAccepted={f.cgu}
                confidentialiteAccepted={f.conf}
                disabled={!googleReady}
                label={googleReady ? "Continuer avec Google" : "Renseignez le nom, le régime et les consentements"}
                className="w-full flex items-center justify-center gap-2 rounded-full border py-3 font-mono text-xs transition hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
              />

              <p className="text-center font-mono text-xs pt-2">
                <a
                  href="/login"
                  className="underline decoration-2 text-[#0B3D2E] font-bold"
                  style={{ textDecorationColor: "var(--highlight)" }}
                >
                  {t("login_link")}
                </a>
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
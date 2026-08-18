"use client";

import { useState } from "react";
import { Highlight, LegalRef, Stamp } from "@/components/landing/ui";
import { useUI, Switchers } from "@/lib/ui-providers";

// ─── Données constantes ───────────────────────────────────────────────────────

const REGIMES = [
  { value: "REEL_NORMAL", labelKey: "regime_1" },
  { value: "RSI",         labelKey: "regime_2" },
  { value: "TPU",         labelKey: "regime_3" },
] as const;

/** Score de solidité du mot de passe 0..4 (section 8) */
function score(p: string) {
  return [
    p.length >= 12,
    /[A-Z]/.test(p) && /[a-z]/.test(p),
    /\d/.test(p),
    /[^A-Za-z0-9]/.test(p),
  ].filter(Boolean).length;
}

const inputCls =
  "mt-1 w-full border-b-2 border-dashed border-ink/40 bg-transparent py-2 " +
  "font-mono text-ink outline-none focus:border-ink placeholder:text-ink/30";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const { t } = useUI();

  const [f, setF] = useState({
    tenantName: "",
    email:      "",
    regime:     "",
    password:   "",
    confirm:    "",
    cgu:        false,
    conf:       false,
  });
  const [err, setErr] = useState<string | null>(null);
  const [ok,  setOk]  = useState(false);

  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));
  const s = score(f.password);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (f.password !== f.confirm)
      return setErr("Les deux mots de passe ne correspondent pas.");
    if (s < 3)
      return setErr("Mot de passe trop faible (12 caractères min., majuscules, chiffres, symbole).");

    const res = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantName:    f.tenantName,
        email:         f.email,
        regime:        f.regime,
        password:      f.password,
        cgu:           f.cgu,
        confidentialite: f.conf,
      }),
    });

    if (!res.ok) return setErr("Inscription impossible — vérifiez les champs ou l'email.");
    setOk(true);
  }

  return (
    <main className="paper-ruled min-h-screen font-body" style={{ color: "var(--ink)" }}>

      {/* ── En-tête ── */}
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-6 pt-10">
        {/* Logo flat uniquement sur papier (règle de marque) */}
        <span className="grid h-10 w-10 place-items-center rounded-lg font-mono text-lg font-semibold"
              style={{ background: "var(--ink)", color: "var(--bg)" }}>
          F
        </span>
        <p className="font-display text-xl font-semibold">
          FiscLens&nbsp;
          <span style={{ color: "var(--stamp)" }}>Togo</span>
        </p>
        <div className="ml-auto flex items-center gap-4">
          <p className="hidden font-mono text-[11px] uppercase tracking-widest sm:block"
             style={{ color: "var(--inkSoft)" }}>
            {t("no_sim")}
          </p>
          {/* Bascule langue + fond */}
          <Switchers />
        </div>
      </header>

      {/* ── Corps ── */}
      <section className="mx-auto grid max-w-6xl gap-16 px-6 py-16 lg:grid-cols-2">

        {/* Colonne pitch */}
        <div>
          <h1 className="font-hand text-6xl leading-[0.95] md:text-7xl">
            {t("h1_register")}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed">
            Un espace entreprise{" "}
            <Highlight>vide, propre et prêt à l'emploi</Highlight>&nbsp;:
            plan SYSCOHADA, 6 journaux, exercice ouvert et calendrier OTR selon votre régime.
          </p>
          <ul className="mt-8 space-y-3 font-mono text-sm">
            <li>→ Plan comptable classes 1-8 <LegalRef>SYSCOHADA révisé</LegalRef></li>
            <li>→ TVA 18 %, IS 27 % vs IMF 1 % <LegalRef>CGI</LegalRef> · échéances au 15 <LegalRef>LPF</LegalRef></li>
            <li>→ Vos écritures, vos pièces, votre audit log — rien d'autre</li>
          </ul>
        </div>

        {/* Formulaire = reçu perforé — toujours ivoire sur les deux fonds */}
        <div className="receipt rotate-[0.6deg] rounded-sm p-8">
          <div className="flex items-start justify-between">
            <h2 className="font-display text-2xl font-semibold">
              {t("create_account")}
            </h2>
            <Stamp>{t("tenant_ready")}</Stamp>
          </div>

          {ok ? (
            <div className="mt-8 space-y-4 font-mono text-sm">
              <p className="text-lg">✔ {t("provisioned_ok")}</p>
              <p>{t("provisioned_desc")}</p>
              <a href="/login"
                 className="inline-block rounded-full px-6 py-3 font-semibold"
                 style={{ background: "#0B3D2E", color: "#FBF7EC" }}>
                {t("connect_cta")}
              </a>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-6">

              {/* Nom entreprise */}
              <label className="block font-mono text-xs uppercase tracking-widest text-inkSoft">
                {t("company")}
                <input className={inputCls} placeholder="Nom de votre entreprise"
                       value={f.tenantName}
                       onChange={(e) => set("tenantName", e.target.value)} required />
              </label>

              {/* Email */}
              <label className="block font-mono text-xs uppercase tracking-widest text-inkSoft">
                {t("email")}
                <input className={inputCls} type="email" placeholder="vous@entreprise.tg"
                       value={f.email}
                       onChange={(e) => set("email", e.target.value)} required />
              </label>

              {/* Régime */}
              <label className="block font-mono text-xs uppercase tracking-widest text-inkSoft">
                {t("regime")} <LegalRef>détermine votre calendrier</LegalRef>
                <select className={inputCls + " cursor-pointer"} value={f.regime}
                        onChange={(e) => set("regime", e.target.value)} required>
                  <option value="">{t("regime_ph")}</option>
                  {REGIMES.map((r) => (
                    <option key={r.value} value={r.value}>{t(r.labelKey)}</option>
                  ))}
                </select>
              </label>

              {/* Mot de passe */}
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-inkSoft">
                  {t("password")}
                  <input className={inputCls} type="password" value={f.password}
                         onChange={(e) => set("password", e.target.value)} required />
                </label>
                {/* Indicateur de force */}
                <div className="mt-2 flex gap-1" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className="h-1.5 flex-1 rounded" style={{
                      background: i < s
                        ? (s >= 3 ? "var(--stamp)" : "var(--marginRed)")
                        : "rgba(11,61,46,.15)",
                    }} />
                  ))}
                </div>
                <p className="mt-1 font-mono text-[10px]" style={{ color: "var(--inkSoft)" }}>
                  12 caractères min. · majuscule · chiffre · symbole <LegalRef>section 8</LegalRef>
                </p>
              </div>

              {/* Confirmation */}
              <label className="block font-mono text-xs uppercase tracking-widest text-inkSoft">
                {t("confirm")}
                <input className={inputCls} type="password" value={f.confirm}
                       onChange={(e) => set("confirm", e.target.value)} required />
              </label>

              {/* Consentements */}
              <div className="space-y-2 font-mono text-xs">
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5" style={{ accentColor: "#0B3D2E" }}
                         checked={f.cgu} onChange={(e) => set("cgu", e.target.checked)} required />
                  <span>{t("cgu")} <LegalRef>v1.0</LegalRef></span>
                </label>
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5" style={{ accentColor: "#0B3D2E" }}
                         checked={f.conf} onChange={(e) => set("conf", e.target.checked)} required />
                  <span>{t("privacy")} <LegalRef>loi n°2018-26</LegalRef></span>
                </label>
              </div>

              {/* Erreur */}
              {err && (
                <p className="border-l-4 pl-3 font-mono text-xs"
                   style={{ borderColor: "var(--marginRed)", color: "var(--marginRed)" }}>
                  {err}
                </p>
              )}

              <button type="submit"
                      className="w-full rounded-full py-3.5 font-semibold transition hover:opacity-80 active:scale-95"
                      style={{ background: "#0B3D2E", color: "#FBF7EC" }}>
                {t("submit")}
              </button>

              <p className="text-center font-mono text-xs">
                <a href="/login" className="underline decoration-2"
                   style={{ textDecorationColor: "var(--highlight)" }}>
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

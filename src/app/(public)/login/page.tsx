"use client";

import { useState } from "react";
import { LegalRef, Stamp } from "@/components/landing/ui";
import { Switchers, useUI } from "@/lib/ui-providers";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

const inputCls =
  "mt-1 w-full border-b-2 border-dashed border-white/40 bg-transparent py-2 font-mono text-paper outline-none focus:border-paper placeholder:text-paper/35";

export default function LoginPage() {
  const { t, theme } = useUI();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [need2FA, setNeed2FA] = useState(false);
  const [totp, setTotp] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, totp: need2FA ? totp : undefined }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) return setErr(data.message || t("login_error"));
      if (res.status === 202 || data.require2FA || data.require2fa) {
        setNeed2FA(true);
        if (data.userId) {
          sessionStorage.setItem("fl_2fa_uid", data.userId);
        }
        return;
      }
      if (!res.ok) return setErr(data.message || t("login_error"));

      // Stockage du token pour les appels fetch (api-client.ts en Authorization: Bearer).
      // Le cookie fl_token est déjà posé par le serveur pour les navigations plein-page
      // (lu par middleware.ts) — window.location.href déclenche bien son envoi.
      localStorage.setItem("fl_token", data.token);
      localStorage.setItem("fl_tenant_id", data.tenantId);
      sessionStorage.removeItem("fl_2fa_uid");

      window.location.href = "/dashboard";
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`${theme === "ink" ? "ink-ruled text-paper" : "paper-ruled text-ink"} min-h-screen font-body`}>
      <header className="mx-auto flex max-w-6xl items-center justify-end px-6 pt-8">
        <Switchers />
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-16 px-6 py-14 lg:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-3 rounded-full border border-paper/20 bg-paper/5 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-paper/80">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-paper text-[#0B3D2E] font-bold text-base">F</span>
            FiscLens Togo
          </div>

          <h1 className="mt-6 font-hand text-6xl leading-[0.95] text-paper md:text-7xl">
            {t("h1_login")}
          </h1>
          <p className="mt-6 max-w-md text-lg text-paper/80">{t("login_sub")}</p>
          <ul className="mt-8 space-y-3 font-mono text-sm text-paper/90">
            <li>→ TLS + mots de passe robustes <LegalRef>section 8</LegalRef></li>
            <li>→ 2FA obligatoire pour Cabinet &amp; Admin <LegalRef>section 8</LegalRef></li>
            <li>→ Chaque connexion est journalisée <LegalRef>audit log</LegalRef></li>
          </ul>
        </div>

        <div className="receipt rotate-[0.6deg] p-8">
          <div className="flex items-start justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink">{t("login_title")}</h2>
            <Stamp>{need2FA ? "2FA requise" : "Accès sécurisé"}</Stamp>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-6">
            <label className="block font-mono text-xs uppercase tracking-widest text-inkSoft">
              {t("email")}
              <input
                className={inputCls}
                type="email"
                value={email}
                autoComplete="email"
                placeholder="vous@entreprise.tg"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="block font-mono text-xs uppercase tracking-widest text-inkSoft">
              {t("password")}
              <span className="relative block">
                <input
                  className={inputCls + " pr-10"}
                  type={showPwd ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label="Afficher le mot de passe"
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-2 font-mono text-[10px] text-paper/70"
                >
                  {showPwd ? "CACHER" : "VOIR"}
                </button>
              </span>
            </label>

            {need2FA && (
              <label className="block font-mono text-xs uppercase tracking-widest text-inkSoft">
                {t("totp")} <LegalRef>TOTP</LegalRef>
                <input
                  className={inputCls}
                  inputMode="text"
                  maxLength={10}
                  value={totp}
                  placeholder="000000 ou code de secours"
                  onChange={(e) => setTotp(e.target.value)}
                  autoFocus
                  required
                />
                <p className="mt-1 text-[10px] normal-case text-inkSoft">{t("login_2fa_hint")}</p>
              </label>
            )}

            {err && (
              <p className="border-l-4 border-[#B3261E] pl-3 font-mono text-xs text-[#B3261E]">{err}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#0B3D2E] py-3.5 font-semibold text-[#FBF7EC] transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "…" : need2FA ? "Vérifier le code" : t("login_submit")}
            </button>

            {!need2FA && (
              <>
                <div className="flex items-center gap-3 py-1">
                  <span className="h-px flex-1 bg-paper/20" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-paper/50">ou</span>
                  <span className="h-px flex-1 bg-paper/20" />
                </div>

                <GoogleSignInButton
                  className="w-full flex items-center justify-center gap-2 rounded-full border border-paper/30 bg-paper/5 py-3.5 font-mono text-sm text-paper transition hover:bg-paper/10 disabled:opacity-60"
                  onCompanyNameRequired={() =>
                    setErr("Aucun compte associé à cet email Google. Créez d'abord votre espace via « Créer un compte ».")
                  }
                />
              </>
            )}

            <div className="space-y-1 text-center font-mono text-xs text-inkSoft">
              <a href="/forgot" className="underline decoration-[#FCD116] decoration-2 underline-offset-2">{t("forgot")}</a>
              <p>
                {t("no_account")} <a href="/register" className="underline decoration-[#FCD116] decoration-2 underline-offset-2">{t("create")}</a>
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
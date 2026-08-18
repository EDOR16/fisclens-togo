"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DICT, type DictKey, type Lang } from "@/lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────
type Theme = "paper" | "ink";

interface UICtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  t: (k: DictKey) => string;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const UIContext = createContext<UICtx>(null!);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function UIProvider({ children }: { children: React.ReactNode }) {
  const [lang,  setLangState]  = useState<Lang>("fr");
  const [theme, setThemeState] = useState<Theme>("paper");

  // Restore persisted preferences on mount
  useEffect(() => {
    const savedLang  = localStorage.getItem("fl-lang")  as Lang  | null;
    const savedTheme = localStorage.getItem("fl-theme") as Theme | null;
    if (savedLang)  setLangState(savedLang);
    if (savedTheme) setThemeState(savedTheme);
  }, []);

  // Apply side-effects whenever lang or theme changes
  useEffect(() => {
    document.documentElement.lang            = lang;           // SEO + a11y
    document.documentElement.dataset.theme   = theme;          // CSS var selector
    localStorage.setItem("fl-lang",  lang);
    localStorage.setItem("fl-theme", theme);
  }, [lang, theme]);

  function setLang(l: Lang)    { setLangState(l);  }
  function setTheme(t: Theme)  { setThemeState(t); }

  const t = (k: DictKey): string => DICT[lang][k];

  return (
    <UIContext.Provider value={{ lang, setLang, theme, setTheme, t }}>
      {children}
    </UIContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside <UIProvider>");
  return ctx;
}

// ─── Switchers widget ────────────────────────────────────────────────────────
/**
 * Bascule FR ↔ EN + Papier ↔ Encre.
 * Style "tampon de caisse" pour rester dans l'identité Grand Livre.
 */
export function Switchers() {
  const { lang, setLang, theme, setTheme } = useUI();

  const btnCls =
    "rounded-full border-2 border-current px-3 py-1 font-mono text-[11px] " +
    "uppercase tracking-widest transition hover:bg-current hover:text-[var(--bg)] " +
    "active:scale-95";

  return (
    <div className="flex items-center gap-2">
      {/* Langue */}
      <button
        id="fl-lang-toggle"
        aria-label={lang === "fr" ? "Switch to English" : "Passer en Français"}
        className={btnCls}
        onClick={() => setLang(lang === "fr" ? "en" : "fr")}
      >
        {lang === "fr" ? "EN" : "FR"}
      </button>

      {/* Fond */}
      <button
        id="fl-theme-toggle"
        aria-label={theme === "paper" ? "Mode encre verte" : "Mode papier ivoire"}
        className={btnCls}
        onClick={() => setTheme(theme === "paper" ? "ink" : "paper")}
      >
        {theme === "paper" ? "Encre" : "Papier"}
      </button>
    </div>
  );
}

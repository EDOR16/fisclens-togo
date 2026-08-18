/**
 * Composants UI génériques pour le landing/authentification
 * Highlight, LegalRef, Stamp — adaptés au thème "papier"
 */

import React from "react";

/**
 * Highlight — Texte surligné (thème papier avec surligneur jaune)
 */
export function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-semibold"
      style={{
        background: "linear-gradient(to right, rgba(255, 235, 59, 0.4) 0%, rgba(255, 235, 59, 0.4) 100%)",
        textDecoration: "underline",
        textDecorationColor: "rgba(255, 235, 59, 0.8)",
        textDecorationThickness: "2px",
        textUnderlineOffset: "2px",
      }}
    >
      {children}
    </span>
  );
}

/**
 * LegalRef — Référence légale (petite mention entre parenthèses)
 */
export function LegalRef({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono text-xs"
      style={{
        color: "var(--inkSoft)",
        borderBottom: "1px dashed var(--ink)",
      }}
      title={`Référence légale: ${children}`}
    >
      {children}
    </span>
  );
}

/**
 * Stamp — Tampon/cachet (thème papier administratif)
 */
export function Stamp({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="inline-block font-mono text-xs font-bold uppercase tracking-widest"
      style={{
        color: "var(--stamp)",
        border: `2px dashed var(--stamp)`,
        padding: "8px 12px",
        transform: "rotate(-15deg)",
        letterSpacing: "0.15em",
      }}
    >
      {children}
    </div>
  );
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusion de classes Tailwind — utilitaire standard shadcn/ui */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Formatage FCFA
// ---------------------------------------------------------------------------

/**
 * Formate un entier FCFA en chaîne lisible avec séparateurs de milliers.
 * Les montants sont TOUJOURS des entiers (jamais de float).
 * @example formatFcfa(1500000) → "1 500 000 FCFA"
 */
export function formatFcfa(amount: number): string {
  return new Intl.NumberFormat("fr-TG", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formate un entier FCFA sans le symbole (pour les tableaux comptables).
 * @example formatAmount(1500000) → "1 500 000"
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-TG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Formate un montant en affichant zéro comme tiret (convention comptable) */
export function formatAmountOrDash(amount: number): string {
  return amount === 0 ? "—" : formatAmount(amount);
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/** Formate une date en français (dd/MM/yyyy) */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-TG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** Formate une date longue (ex : 15 août 2025) */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-TG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Retourne la période YYYY-MM d'une date */
export function toPeriode(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ---------------------------------------------------------------------------
// Numéros de compte SYSCOHADA
// ---------------------------------------------------------------------------

/** Vérifie qu'un code compte est conforme SYSCOHADA (3 à 8 chiffres) */
export function isValidAccountCode(code: string): boolean {
  return /^\d{3,8}$/.test(code);
}

/** Retourne la classe (1er chiffre) d'un code compte */
export function getAccountClass(code: string): number {
  return parseInt(code[0] ?? "0", 10);
}

// ---------------------------------------------------------------------------
// Divers
// ---------------------------------------------------------------------------

/** Délai asynchrone (tests, UX) */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Tronque une chaîne avec ellipsis */
export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;
}

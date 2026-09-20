/**
 * Formatage monétaire intelligent pour les grandes valeurs FCFA.
 * Ex: 278238700000 → "278,2 Mds FCFA"
 *     1234567      → "1,23 M FCFA"
 *     45600        → "45 600 FCFA"
 */
export function formatFcfaSmart(value: number | undefined | null): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return "0 FCFA";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1).replace(".", ",")} Mds FCFA`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(2).replace(".", ",")} M FCFA`;
  }
  if (abs >= 1_000) {
    return `${sign}${Math.round(abs).toLocaleString("fr-FR")} FCFA`;
  }
  return `${sign}${Math.round(abs)} FCFA`;
}

/**
 * Formatage compact sans unité (pour les axes de graphiques).
 */
export function formatFcfaCompact(value: number | undefined | null): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)} Mds`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)} M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)} k`;
  return `${sign}${Math.round(abs)}`;
}

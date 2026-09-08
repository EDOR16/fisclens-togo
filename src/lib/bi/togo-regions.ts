/**
 * Normalisation des 5 régions administratives officielles du Togo
 * Grand Lomé est rattaché à la Région Maritime conformément
 * au découpage territorial de la République Togolaise.
 */
export function normalizeTogoRegion(rawZone?: string | null): string {
  if (!rawZone) return "Maritime";
  const z = rawZone.trim().toLowerCase();

  // Région Maritime — Grand Lomé + préfectures côtières
  if (
    z.includes("lomé") ||
    z.includes("lome") ||
    z.includes("maritime") ||
    z.includes("aného") ||
    z.includes("aneho") ||
    z.includes("afagnan") ||
    z.includes("tsévié") ||
    z.includes("tsevie") ||
    z.includes("golfe") ||
    z.includes("vogan") ||
    z.includes("tabligbo")
  ) {
    return "Maritime";
  }

  // Région des Plateaux
  if (
    z.includes("plateau") ||
    z.includes("kpalimé") ||
    z.includes("kpalime") ||
    z.includes("atakpamé") ||
    z.includes("atakpame") ||
    z.includes("notse") ||
    z.includes("notsé") ||
    z.includes("kloto") ||
    z.includes("badou")
  ) {
    return "Plateaux";
  }

  // Région Centrale
  if (
    z.includes("central") ||
    z.includes("sokodé") ||
    z.includes("sokode") ||
    z.includes("tchamba") ||
    z.includes("sotouboua") ||
    z.includes("blitta")
  ) {
    return "Centrale";
  }

  // Région de la Kara
  if (
    z.includes("kara") ||
    z.includes("bafilo") ||
    z.includes("bassar") ||
    z.includes("kozah") ||
    z.includes("kandé") ||
    z.includes("kande") ||
    z.includes("nyamtougou")
  ) {
    return "Kara";
  }

  // Région des Savanes
  if (
    z.includes("savane") ||
    z.includes("dapaong") ||
    z.includes("mango") ||
    z.includes("tone") ||
    z.includes("toné") ||
    z.includes("cinkassé") ||
    z.includes("cinkasse") ||
    z.includes("tandjouaré")
  ) {
    return "Savanes";
  }

  return rawZone.trim();
}

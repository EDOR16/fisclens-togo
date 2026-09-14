/**
 * Utilitaires de hash cryptographique côté client (Web Crypto API).
 * Utilisés pour générer le SHA-256 des fichiers de facture uploadés,
 * afin de détecter les doublons (Section 7 - FACTURE_IMAGE_DUPLIQUEE).
 */

/**
 * Calcule le SHA-256 hexadécimal d'un fichier (File ou Blob).
 * Utilise l'API Web Crypto native - pas de dépendance externe.
 */
export async function computeFileSha256(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Calcule le SHA-256 d'une chaîne (utile pour les données base64 ou texte).
 */
export async function computeStringSha256(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
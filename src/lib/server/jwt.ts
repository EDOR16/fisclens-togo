import { SignJWT, jwtVerify } from "jose";

const SECRET_STR = process.env.JWT_SECRET || "fisclens-default-secret-key-togo-2025-08-16";
const SECRET_BYTES = new TextEncoder().encode(SECRET_STR);

export type JwtPayload = {
  userId: string;
  email: string;
  role: string;
  tenantId?: string;
};

/**
 * Signe un token JWT avec une durée de validité de 7 jours.
 */
export async function signJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_BYTES);
}

/**
 * Vérifie la signature et l'expiration d'un token JWT.
 */
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_BYTES);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

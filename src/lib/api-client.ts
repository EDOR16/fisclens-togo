/**
 * Client API unique — injecte JWT + x-tenant-id, gère retries et file d'attente offline.
 * Tous les appels API frontend passent par ce module.
 */

import { offlineQueue } from "@/lib/offline-queue";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ApiError = {
  error: string;
  details?: unknown;
  status: number;
};

export class ApiException extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(`API ${status}: ${code}`);
    this.name = "ApiException";
  }
}

// ---------------------------------------------------------------------------
// Helpers token/tenant (lus depuis localStorage côté client)
// ---------------------------------------------------------------------------

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fl_token");
}

function getTenantId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fl_tenant_id");
}

// ---------------------------------------------------------------------------
// Fetch de base
// ---------------------------------------------------------------------------

const BASE_URL = "/api/v1";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Clé d'idempotence (imports, runs de paie) */
  idempotencyKey?: string;
  /** Si true, la requête sera mise en file offline en cas d'absence réseau */
  queueOffline?: boolean;
  retries?: number;
};

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    idempotencyKey,
    queueOffline = false,
    retries = MAX_RETRIES,
  } = options;

  // ----- Headers -----
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const tenantId = getTenantId();
  if (tenantId) headers["x-tenant-id"] = tenantId;

  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  // ----- Offline fallback -----
  if (!navigator.onLine && queueOffline && method !== "GET") {
    await offlineQueue.enqueue({ path, method, body, idempotencyKey });
    // Retourne un résultat optimiste vide — l'UI doit gérer ce cas
    return { __queued: true } as T;
  }

  // ----- Fetch avec retry -----
  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      // Succès sans contenu
      if (res.status === 204) return undefined as T;

      const json = await res.json();

      if (!res.ok) {
        throw new ApiException(
          (json as ApiError).error ?? "UNKNOWN_ERROR",
          res.status,
          (json as ApiError).details
        );
      }

      return json as T;
    } catch (err) {
      // Ne pas retry sur les erreurs métier (4xx)
      if (err instanceof ApiException && err.status < 500) throw err;

      attempt++;
      if (attempt > retries) throw err;
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers HTTP sémantiques
// ---------------------------------------------------------------------------

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "GET" }),

  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method">) =>
    apiRequest<T>(path, { ...opts, method: "POST", body }),

  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method">) =>
    apiRequest<T>(path, { ...opts, method: "PATCH", body }),

  delete: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "DELETE" }),
};

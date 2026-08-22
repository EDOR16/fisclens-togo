export class ApiException extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number = 500, code?: string) {
    super(message);
    this.name = "ApiException";
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  queueOffline?: boolean;
  idempotencyKey?: string;
}

const API_PREFIX = "/api/v1";

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, queueOffline, idempotencyKey, ...fetchOptions } = options;

  // Préfixe /api/v1 uniquement si l'endpoint ne l'a pas déjà
  // (permet de garder des appels legacy écrits en dur sans les casser)
  let url = endpoint.startsWith("/api/") ? endpoint : `${API_PREFIX}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const qs = searchParams.toString();
    if (qs) {
      url += "?" + qs;
    }
  }

  // Injection automatique Token + TenantId depuis localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("fl_token") : null;
  const tenantId = typeof window !== "undefined" ? localStorage.getItem("fl_tenant_id") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (tenantId) {
    headers["x-tenant-id"] = tenantId;
  }

  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...headers,
      ...(fetchOptions.headers || {}),
    },
  });

  let body: any = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message = (body && (body.message || body.error)) || "HTTP " + response.status;
    throw new ApiException(message, response.status, body ? body.code : undefined);
  }

  return body as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: "GET", ...options }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: "DELETE", ...options }),
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  return request<T>(endpoint, options);
}

export const apiClient = api;
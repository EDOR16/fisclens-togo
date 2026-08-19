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

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, queueOffline, idempotencyKey, ...fetchOptions } = options;
  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
    const qs = searchParams.toString();
    if (qs) url += "?" + qs;
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const response = await fetch(url, { ...fetchOptions, headers: { ...headers, ...fetchOptions.headers } });
  let body: any = null;
  try { body = await response.json(); } catch { body = null; }
  if (!response.ok) {
    const message = (body && (body.error || body.message)) || "HTTP " + response.status;
    throw new ApiException(message, response.status, body ? body.code : undefined);
  }
  return body as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { method: "GET", ...options }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => request<T>(endpoint, { method: "POST", body: body ? JSON.stringify(body) : undefined, ...options }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => request<T>(endpoint, { method: "PUT", body: body ? JSON.stringify(body) : undefined, ...options }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => request<T>(endpoint, { method: "PATCH", body: body ? JSON.stringify(body) : undefined, ...options }),
  delete: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { method: "DELETE", ...options }),
};

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  return request<T>(endpoint, options);
}

export const apiClient = api;

interface ApiClientOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

class ApiClient {
  private baseUrl: string = "";

  private async request<T>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += ?;
    }
    const response = await fetch(url, {
      ...fetchOptions,
      headers: { "Content-Type": "application/json", ...fetchOptions.headers },
    });
    if (!response.ok) throw new Error(HTTP );
    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", params });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: "POST", body: body ? JSON.stringify(body) : undefined });
  }
}

export const apiClient = new ApiClient();

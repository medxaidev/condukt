import type { AdapterResult } from "../../types";

export type ApiCallParams = {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

export type ApiAdapter = {
  execute(params: ApiCallParams): Promise<AdapterResult<unknown>>;
};

export const defaultApiAdapter: ApiAdapter = {
  async execute({ url, method = "GET", body, headers }) {
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        return {
          success: false,
          error: { code: String(res.status), message: res.statusText },
        };
      }
      const data = await res.json().catch(() => null);
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: { code: "NETWORK_ERROR", message: String(err), retryable: true },
      };
    }
  },
};

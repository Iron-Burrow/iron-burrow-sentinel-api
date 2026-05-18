import type { SentinelEnv } from "../env.js";

export interface PriceQlResult {
  status: number;
  payload: unknown;
}

export interface PriceQlClient {
  readonly mode: SentinelEnv["PRICE_BACKEND"];
  readonly configured: boolean;
  requestLatest(params: URLSearchParams): Promise<PriceQlResult>;
  requestSeries(params: URLSearchParams): Promise<PriceQlResult>;
}

function unavailable(message: string): PriceQlResult {
  return {
    status: 503,
    payload: {
      ok: false,
      code: "PRICE_QL_UNAVAILABLE",
      message
    }
  };
}

function disabled(): PriceQlResult {
  return {
    status: 503,
    payload: {
      ok: false,
      code: "PRICE_DISABLED",
      message: "Price QL backend is disabled.",
      backend: "disabled"
    }
  };
}

function buildUrl(baseUrl: string, pathname: string, params: URLSearchParams): string {
  const url = new URL(pathname.replace(/^\//u, ""), `${baseUrl.replace(/\/$/u, "")}/`);

  for (const [key, value] of params) {
    url.searchParams.append(key, value);
  }

  return url.toString();
}

export class HttpPriceQlClient implements PriceQlClient {
  readonly mode: SentinelEnv["PRICE_BACKEND"];
  readonly configured: boolean;

  constructor(private readonly env: SentinelEnv) {
    this.mode = env.PRICE_BACKEND;
    this.configured = env.PRICE_BACKEND === "service" && Boolean(env.PRICE_QL_BASE_URL && env.PRICE_QL_INTERNAL_TOKEN);
  }

  requestLatest(params: URLSearchParams): Promise<PriceQlResult> {
    return this.request("/prices/latest", params);
  }

  requestSeries(params: URLSearchParams): Promise<PriceQlResult> {
    return this.request("/prices/series", params);
  }

  private async request(pathname: string, params: URLSearchParams): Promise<PriceQlResult> {
    if (this.env.PRICE_BACKEND !== "service") {
      return disabled();
    }

    if (!this.env.PRICE_QL_BASE_URL || !this.env.PRICE_QL_INTERNAL_TOKEN) {
      return unavailable("PRICE_QL_BASE_URL and PRICE_QL_INTERNAL_TOKEN are required when PRICE_BACKEND=service.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.env.PRICE_SERVICE_TIMEOUT_MS);

    try {
      const response = await fetch(buildUrl(this.env.PRICE_QL_BASE_URL, pathname, params), {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${this.env.PRICE_QL_INTERNAL_TOKEN}`
        },
        signal: controller.signal
      });
      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json") ? await response.json() : await response.text();

      return {
        status: response.status,
        payload
      };
    } catch {
      return unavailable("Private price QL request failed.");
    } finally {
      clearTimeout(timeout);
    }
  }
}

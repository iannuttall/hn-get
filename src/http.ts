import type { HttpClientOptions } from "./types.js";

const RETRY_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_USER_AGENT = "hn-get/0.1 (+https://github.com/iannuttall/hn-get)";

export class HttpError extends Error {
  constructor(
    message: string,
    readonly url: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export class HttpClient {
  readonly timeoutMs: number;
  readonly retries: number;
  readonly userAgent: string;

  constructor(options: HttpClientOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retries = options.retries ?? DEFAULT_RETRIES;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  }

  async getJson<T>(url: string): Promise<T> {
    const response = await this.fetch(url);
    try {
      return (await response.json()) as T;
    } catch {
      throw new HttpError("Upstream returned invalid JSON.", url, response.status);
    }
  }

  async getText(url: string): Promise<string> {
    const response = await this.fetch(url);
    return response.text();
  }

  private async fetch(url: string): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "user-agent": this.userAgent,
            accept: "application/json,text/html;q=0.9,*/*;q=0.8",
          },
        });

        if (response.ok) {
          return response;
        }

        if (!RETRY_STATUSES.has(response.status) || attempt === this.retries) {
          throw new HttpError(`Upstream request failed with HTTP ${response.status}.`, url, response.status);
        }
      } catch (error) {
        lastError = error;
        if (error instanceof HttpError && (!RETRY_STATUSES.has(error.status ?? 0) || attempt === this.retries)) {
          throw error;
        }
        if (attempt === this.retries) {
          throw new HttpError(error instanceof Error ? error.message : "Upstream request failed.", url);
        }
      } finally {
        clearTimeout(timeout);
      }

      await delay(250 * 2 ** attempt);
    }

    throw new HttpError(lastError instanceof Error ? lastError.message : "Upstream request failed.", url);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

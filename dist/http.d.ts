import type { HttpClientOptions } from "./types.js";
export declare class HttpError extends Error {
    readonly url: string;
    readonly status?: number | undefined;
    constructor(message: string, url: string, status?: number | undefined);
}
export declare class HttpClient {
    readonly timeoutMs: number;
    readonly retries: number;
    readonly userAgent: string;
    constructor(options?: HttpClientOptions);
    getJson<T>(url: string): Promise<T>;
    getText(url: string): Promise<string>;
    private fetch;
}

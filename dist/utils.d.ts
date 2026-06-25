export declare function hnItemUrl(id: number | string): string;
export declare function toIsoFromUnix(seconds: number | undefined): string | undefined;
export declare function htmlToPlainText(html: string | undefined): string | undefined;
export declare function parsePositiveInt(value: unknown, name: string, options?: {
    min?: number;
    max?: number;
}): number;
export declare function parseNonNegativeInt(value: unknown, name: string, options?: {
    max?: number;
}): number;
export declare function parseItemId(value: string): number;
export declare function parseDateishToUnix(value: string, now?: Date): number;
export declare function mapLimit<T, R>(values: readonly T[], limit: number, iteratee: (value: T, index: number) => Promise<R>): Promise<R[]>;
export declare function compactObject<T extends Record<string, unknown>>(value: T): T;

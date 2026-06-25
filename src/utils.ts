import he from "he";

const { decode } = he;

const HN_ITEM_URL = "https://news.ycombinator.com/item?id=";

export function hnItemUrl(id: number | string): string {
  return `${HN_ITEM_URL}${id}`;
}

export function toIsoFromUnix(seconds: number | undefined): string | undefined {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
    return undefined;
  }

  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function htmlToPlainText(html: string | undefined): string | undefined {
  if (!html) {
    return undefined;
  }

  const withBreaks = html
    .replace(/<\s*p\s*>/gi, "\n\n")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n\n")
    .replace(/<\/\s*li\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  const plain = decode(withBreaks)
    .replace(/\u00a0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return plain || undefined;
}

export function parsePositiveInt(value: unknown, name: string, options: { min?: number; max?: number } = {}): number {
  const parsed = Number.parseInt(String(value), 10);
  const min = options.min ?? 1;
  const max = options.max ?? Number.MAX_SAFE_INTEGER;

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer from ${min} to ${max}.`);
  }

  return parsed;
}

export function parseNonNegativeInt(value: unknown, name: string, options: { max?: number } = {}): number {
  const parsed = Number.parseInt(String(value), 10);
  const max = options.max ?? Number.MAX_SAFE_INTEGER;

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) {
    throw new Error(`${name} must be an integer from 0 to ${max}.`);
  }

  return parsed;
}

export function parseItemId(value: string): number {
  const trimmed = String(value).trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`Invalid Hacker News item id: ${value}`);
  }

  return Number.parseInt(trimmed, 10);
}

export function parseDateishToUnix(value: string, now = new Date()): number {
  const trimmed = value.trim();
  const relative = /^(\d+)(h|d|w|mo|y)$/i.exec(trimmed);

  if (relative) {
    const amount = Number.parseInt(relative[1], 10);
    const unit = relative[2].toLowerCase();
    const day = 24 * 60 * 60;
    const secondsByUnit: Record<string, number> = {
      h: 60 * 60,
      d: day,
      w: 7 * day,
      mo: 30 * day,
      y: 365 * day,
    };

    return Math.floor(now.getTime() / 1000) - amount * secondsByUnit[unit];
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}. Use ISO dates or relative values like 24h, 7d, 2w, 6mo, 1y.`);
  }

  return Math.floor(date.getTime() / 1000);
}

export async function mapLimit<T, R>(
  values: readonly T[],
  limit: number,
  iteratee: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;
  const workerCount = Math.max(1, Math.min(limit, values.length));

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (cursor < values.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await iteratee(values[index], index);
      }
    }),
  );

  return results;
}

export function compactObject<T extends Record<string, unknown>>(value: T): T {
  for (const key of Object.keys(value)) {
    if (value[key] === undefined) {
      delete value[key];
    }
  }

  return value;
}

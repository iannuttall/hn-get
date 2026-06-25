import type { CommentNode, NormalizedItem, OutputFormat, SearchResponse, SearchResult } from "./types.js";
import { escapeMarkdownText, htmlFragmentToMarkdown } from "./markdown.js";

export async function printOutput(value: unknown, format: OutputFormat): Promise<void> {
  if (format === "compact") {
    console.log(JSON.stringify(value));
    return;
  }

  if (format === "ndjson") {
    const rows = Array.isArray(value)
      ? value
      : isSearchResponse(value)
        ? value.results
        : [value];
    for (const row of rows) {
      console.log(JSON.stringify(row));
    }
    return;
  }

  if (format === "text") {
    printText(value);
    return;
  }

  if (format === "markdown") {
    console.log(await renderMarkdown(value));
    return;
  }

  console.log(JSON.stringify(value, null, 2));
}

function printText(value: unknown): void {
  if (isSearchResponse(value)) {
    printSearchText(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (isNormalizedItem(item)) {
        printItemText(item);
        console.log("");
      } else {
        console.log(String(item));
      }
    }
    return;
  }

  if (isNormalizedItem(value)) {
    printItemText(value);
    return;
  }

  console.log(JSON.stringify(value, null, 2));
}

function printSearchText(response: SearchResponse): void {
  console.log(`Results: ${response.count} of ${response.total}`);
  if (response.query) {
    console.log(`Query: ${response.query}`);
  }
  console.log("");

  for (const result of response.results) {
    printResultText(result);
    console.log("");
  }
}

function printResultText(result: SearchResult): void {
  const title = result.title ?? result.storyTitle ?? result.textPlain?.slice(0, 120) ?? "(untitled)";
  const meta = [
    result.type,
    result.author ? `by ${result.author}` : undefined,
    typeof result.points === "number" ? `${result.points} points` : undefined,
    typeof result.comments === "number" ? `${result.comments} comments` : undefined,
    result.createdAt,
  ].filter(Boolean);

  console.log(`${result.id} ${title}`);
  console.log(meta.join(" | "));
  console.log(result.url ?? result.hnUrl);
  if (result.textPlain && result.type === "comment") {
    console.log(indent(truncate(result.textPlain, 500)));
  }
}

function printItemText(item: NormalizedItem): void {
  console.log(`${item.id} ${item.title ?? item.type ?? "(untitled)"}`);
  const meta = [
    item.type,
    item.by ? `by ${item.by}` : undefined,
    typeof item.score === "number" ? `${item.score} points` : undefined,
    typeof item.descendants === "number" ? `${item.descendants} comments` : undefined,
    item.time,
  ].filter(Boolean);
  console.log(meta.join(" | "));
  console.log(item.url ?? item.hnUrl);
  if (item.textPlain) {
    console.log("");
    console.log(item.textPlain);
  }
  if (item.comments && item.comments.length > 0) {
    console.log("");
    printComments(item.comments, 0);
  }
}

function printComments(comments: CommentNode[], depth: number): void {
  for (const comment of comments) {
    const prefix = "  ".repeat(depth);
    console.log(`${prefix}- ${comment.by ?? "unknown"} ${comment.time ?? ""} ${comment.url}`);
    if (comment.textPlain) {
      console.log(indent(comment.textPlain, depth + 1));
    }
    if (comment.children.length > 0) {
      printComments(comment.children, depth + 1);
    }
  }
}

async function renderMarkdown(value: unknown): Promise<string> {
  if (isSearchResponse(value)) {
    return renderSearchMarkdown(value);
  }

  if (Array.isArray(value)) {
    const parts = ["# Hacker News Items", ""];
    for (let index = 0; index < value.length; index += 1) {
      const item = value[index];
      if (isNormalizedItem(item)) {
        parts.push(await renderItemMarkdown(item, index + 1), "");
      }
    }
    return parts.join("\n").trim();
  }

  if (isNormalizedItem(value)) {
    return renderItemMarkdown(value);
  }

  return ["```json", JSON.stringify(value, null, 2), "```"].join("\n");
}

async function renderSearchMarkdown(response: SearchResponse): Promise<string> {
  const parts = ["# Hacker News Results", ""];
  if (response.query) {
    parts.push(`Query: ${response.query}`, "");
  }
  parts.push(`Results: ${response.count} of ${response.total}`, "");

  for (let index = 0; index < response.results.length; index += 1) {
    parts.push(await renderResultMarkdown(response.results[index], index + 1), "");
  }

  return parts.join("\n").trim();
}

async function renderResultMarkdown(result: SearchResult, index: number): Promise<string> {
  const title = result.title ?? result.storyTitle ?? result.textPlain?.slice(0, 120) ?? "(untitled)";
  const parts = [`## ${index}. ${escapeMarkdownText(title)}`, ""];
  parts.push(...renderMetadata([
    result.type,
    result.author ? `by ${result.author}` : undefined,
    typeof result.points === "number" ? `${result.points} points` : undefined,
    typeof result.comments === "number" ? `${result.comments} comments` : undefined,
    result.createdAt,
  ]));
  parts.push(`- HN: ${result.hnUrl}`);
  if (result.url) {
    parts.push(`- URL: ${result.url}`);
  }

  const body = await htmlFragmentToMarkdown(result.text, result.hnUrl);
  if (body) {
    parts.push("", body);
  }

  return parts.join("\n");
}

async function renderItemMarkdown(item: NormalizedItem, index?: number): Promise<string> {
  const prefix = index === undefined ? "#" : `## ${index}.`;
  const parts = [`${prefix} ${escapeMarkdownText(item.title ?? item.type ?? "(untitled)")}`, ""];
  parts.push(...renderMetadata([
    item.type,
    item.by ? `by ${item.by}` : undefined,
    typeof item.score === "number" ? `${item.score} points` : undefined,
    typeof item.descendants === "number" ? `${item.descendants} comments` : undefined,
    item.time,
  ]));
  parts.push(`- HN: ${item.hnUrl}`);
  if (item.url) {
    parts.push(`- URL: ${item.url}`);
  }

  const body = await htmlFragmentToMarkdown(item.text, item.hnUrl);
  if (body) {
    parts.push("", body);
  }

  if (item.comments && item.comments.length > 0) {
    parts.push("", "## Comments", "");
    parts.push(await renderCommentsMarkdown(item.comments, 0));
  }

  return parts.join("\n").trim();
}

async function renderCommentsMarkdown(comments: CommentNode[], depth: number): Promise<string> {
  const parts: string[] = [];
  for (const comment of comments) {
    const heading = "#".repeat(Math.min(6, depth + 3));
    parts.push(`${heading} ${escapeMarkdownText(comment.by ?? "unknown")}`);
    parts.push("");
    parts.push(...renderMetadata([comment.time, comment.url]));
    const body = await htmlFragmentToMarkdown(comment.text, comment.url);
    if (body) {
      parts.push("", body);
    }
    if (comment.children.length > 0) {
      parts.push("", await renderCommentsMarkdown(comment.children, depth + 1));
    }
    parts.push("");
  }

  return parts.join("\n").trim();
}

function renderMetadata(values: Array<string | undefined>): string[] {
  const filtered = values.filter((value): value is string => Boolean(value));
  return filtered.length > 0 ? [`- ${filtered.join(" | ")}`] : [];
}

function isSearchResponse(value: unknown): value is SearchResponse {
  return Boolean(value && typeof value === "object" && "results" in value && Array.isArray((value as SearchResponse).results));
}

function isNormalizedItem(value: unknown): value is NormalizedItem {
  return Boolean(value && typeof value === "object" && "hnUrl" in value && "id" in value);
}

function indent(value: string, depth = 1): string {
  const prefix = "  ".repeat(depth);
  return value
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

function truncate(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 1)}…`;
}

import { Defuddle } from "defuddle/node";
import { htmlToPlainText } from "./utils.js";

const DEFAULT_URL = "https://news.ycombinator.com/";

export async function htmlFragmentToMarkdown(html: string | undefined, url = DEFAULT_URL): Promise<string | undefined> {
  if (!html?.trim()) {
    return undefined;
  }

  const wrapped = [
    "<!doctype html>",
    "<html>",
    "<head><meta charset=\"utf-8\"><title>Hacker News content</title></head>",
    `<body><main>${html}</main></body>`,
    "</html>",
  ].join("");

  try {
    const result = await Defuddle(wrapped, url, {
      markdown: true,
      useAsync: false,
      contentSelector: "main",
    });
    const markdown = result.content.trim();
    return markdown || htmlToPlainText(html);
  } catch {
    return htmlToPlainText(html);
  }
}

export function escapeMarkdownText(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]");
}

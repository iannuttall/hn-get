import { Defuddle } from "defuddle/node";
import { htmlToPlainText } from "./utils.js";
const DEFAULT_URL = "https://news.ycombinator.com/";
export async function htmlFragmentToMarkdown(html, url = DEFAULT_URL) {
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
    }
    catch {
        return htmlToPlainText(html);
    }
}
export function escapeMarkdownText(value) {
    return value.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]");
}
//# sourceMappingURL=markdown.js.map
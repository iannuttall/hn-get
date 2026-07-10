import {
  type HackerNewsClient,
  HN_LIST_NAMES,
  type ListName,
  type NormalizedItem,
  parseItemId,
  type SearchResponse,
  type SearchResult,
} from "@hn-get/core";

const RSS_PATHS = new Set([
  ...HN_LIST_NAMES,
  "user",
  "threads",
  "submitted",
  "replies",
  "item",
  "whoishiring",
  "whoishiring/jobs",
  "whoishiring/hired",
  "whoishiring/freelance",
]);

const TITLE_BY_PATH: Record<string, string> = {
  newest: "Newest",
  frontpage: "Front Page",
  newcomments: "New Comments",
  ask: "Ask HN",
  show: "Show HN",
  polls: "Polls",
  jobs: "Jobs",
  best: "Best",
  top: "Top Stories",
  active: "Active Discussions",
  classic: "Classic",
  invited: "Invited",
  pool: "Pool",
  launches: "Launches",
  bestcomments: "Best Comments",
  user: "User Activity",
  threads: "User Threads",
  submitted: "User Submissions",
  replies: "Replies",
  item: "Item Comments",
  whoishiring: "Who Is Hiring",
  "whoishiring/jobs": "Who Is Hiring",
  "whoishiring/hired": "Who Wants To Be Hired",
  "whoishiring/freelance": "Freelancers",
};

export interface RssFeed {
  title: string;
  link: string;
  selfLink: string;
  description: boolean;
  items: RssItem[];
}

export interface RssItem {
  id: number;
  title: string;
  link: string;
  hnUrl: string;
  author?: string;
  createdAt?: string;
  description?: string;
  points?: number;
  comments?: number;
}

export async function handleRssRequest(request: Request, client: HackerNewsClient): Promise<Response | null> {
  const url = new URL(request.url);
  const path = normalizePath(url.pathname);
  if (!path || !RSS_PATHS.has(path)) {
    return null;
  }

  try {
    const result = await loadFeed(path, url.searchParams, client);
    const feed = toFeed(path, url, result);
    return new Response(renderRss(feed), {
      headers: {
        "cache-control": "public, max-age=60, s-maxage=180",
        "content-type": "application/rss+xml; charset=utf-8",
      },
    });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : String(error), {
      status: 400,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

export function renderRss(feed: RssFeed): string {
  const items = feed.items.map((item) => renderItem(item, feed.description)).join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:slash="http://purl.org/rss/1.0/modules/slash/">',
    "<channel>",
    `<title>${xml(feed.title)}</title>`,
    `<link>${xml(feed.link)}</link>`,
    `<description>${xml(feed.title)}</description>`,
    `<atom:link href="${xml(feed.selfLink)}" rel="self" type="application/rss+xml" />`,
    `<lastBuildDate>${rssDate(new Date())}</lastBuildDate>`,
    "<generator>hn-get</generator>",
    items,
    "</channel>",
    "</rss>",
  ].join("\n");
}

async function loadFeed(path: string, params: URLSearchParams, client: HackerNewsClient) {
  const count = boundedInt(params.get("count"), 20, 100);
  const username = params.get("id")?.trim() ?? "";
  const query = params.get("q")?.trim() || undefined;
  const author = params.get("author")?.trim() || undefined;

  if ((HN_LIST_NAMES as readonly string[]).includes(path)) {
    return client.list(path as ListName, {
      query,
      author,
      points: optionalInt(params.get("points")),
      comments: optionalInt(params.get("comments")),
      limit: count,
      sort: "date",
    });
  }
  if (path === "user") return client.submitted(required(username, "id"), { limit: count, type: "all" });
  if (path === "threads") return client.threads(required(username, "id"), count);
  if (path === "submitted") return client.submitted(required(username, "id"), { limit: count, type: "story" });
  if (path === "replies") return client.replies(required(username, "id"), count);
  if (path === "item")
    return client.itemComments(parseItemId(required(username, "id")), { query, author, limit: count });

  const kind = path.endsWith("/jobs")
    ? "jobs"
    : path.endsWith("/hired")
      ? "hired"
      : path.endsWith("/freelance")
        ? "freelance"
        : "all";
  return client.whoIsHiring(kind, count);
}

function toFeed(path: string, url: URL, result: NormalizedItem[] | SearchResponse): RssFeed {
  const linkToComments = url.searchParams.get("link") === "comments";
  const rows = Array.isArray(result) ? result.map(fromItem) : result.results.map(fromSearchResult);
  const items = rows.map((item) => ({ ...item, link: linkToComments ? item.hnUrl : item.link }));
  const label = TITLE_BY_PATH[path] ?? path;
  const filter = url.searchParams.get("q")?.trim();

  return {
    title: `Hacker News: ${label}${filter ? ` - ${filter}` : ""}`,
    link: "https://news.ycombinator.com/",
    selfLink: url.toString(),
    description: url.searchParams.get("description") !== "0",
    items,
  };
}

function fromItem(item: NormalizedItem): RssItem {
  return {
    id: item.id,
    title: item.title ?? item.textPlain?.slice(0, 120) ?? `Hacker News item ${item.id}`,
    link: item.url ?? item.hnUrl,
    hnUrl: item.hnUrl,
    author: item.by,
    createdAt: item.time,
    description: item.text,
    points: item.score,
    comments: item.descendants,
  };
}

function fromSearchResult(item: SearchResult): RssItem {
  return {
    id: item.id,
    title: item.title ?? item.storyTitle ?? item.textPlain?.slice(0, 120) ?? `Hacker News item ${item.id}`,
    link: item.url ?? item.hnUrl,
    hnUrl: item.hnUrl,
    author: item.author,
    createdAt: item.createdAt,
    description: item.text,
    points: item.points,
    comments: item.comments,
  };
}

function renderItem(item: RssItem, includeDescription: boolean): string {
  const details = [
    item.points === undefined ? undefined : `${item.points} points`,
    item.comments === undefined ? undefined : `${item.comments} comments`,
    `<a href="${xml(item.hnUrl)}">Hacker News discussion</a>`,
  ].filter((value): value is string => value !== undefined);
  const body = [item.description, details.join(" · ")].filter(Boolean).join("<hr />");

  return [
    "<item>",
    `<guid isPermaLink="true">${xml(item.hnUrl)}</guid>`,
    `<title>${xml(item.title)}</title>`,
    `<link>${xml(item.link)}</link>`,
    item.author ? `<dc:creator>${xml(item.author)}</dc:creator>` : "",
    item.createdAt ? `<pubDate>${rssDate(new Date(item.createdAt))}</pubDate>` : "",
    item.comments === undefined ? "" : `<slash:comments>${item.comments}</slash:comments>`,
    includeDescription ? `<description>${cdata(body)}</description>` : "",
    includeDescription ? `<content:encoded>${cdata(body)}</content:encoded>` : "",
    "</item>",
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizePath(pathname: string): string {
  return pathname
    .replace(/^\/rss\/?/, "")
    .replace(/^\//, "")
    .replace(/\/$/, "");
}

function boundedInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(max, parsed)) : fallback;
}

function optionalInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function required(value: string, name: string): string {
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function rssDate(date: Date): string {
  return Number.isNaN(date.getTime()) ? new Date(0).toUTCString() : date.toUTCString();
}

function cdata(value: string): string {
  return `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

function xml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

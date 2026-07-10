import { HackerNewsClient, HN_LIST_NAMES, type ListName, parseItemId } from "@hn-get/core";
import { createHnMcpServer } from "@hn-get/mcp";
import { handleRssRequest } from "@hn-get/rss";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";

interface AppOptions {
  client?: HackerNewsClient;
}

export function createApp(options: AppOptions = {}) {
  const app = new Hono<{ Bindings: Env }>();
  const getClient = () => options.client ?? new HackerNewsClient();

  app.use("/v1/*", cors({ origin: "*", allowMethods: ["GET", "HEAD", "OPTIONS"] }));
  app.use(
    "/mcp",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowHeaders: ["content-type", "mcp-protocol-version", "mcp-session-id"],
      exposeHeaders: ["mcp-session-id"],
    }),
  );

  app.onError((error, c) => {
    console.error(JSON.stringify({ message: "request failed", error: error.message, path: c.req.path }));
    return c.json({ error: error.message }, errorStatus(error));
  });

  app.get("/", (c) =>
    c.json({
      name: "hn-get",
      description: "One Hacker News data pipeline for HTTP, RSS, CLI, and MCP clients.",
      endpoints: {
        api: "/v1",
        health: "/health",
        mcp: "/mcp",
        rss: "/rss/newest",
      },
    }),
  );

  app.get("/health", (c) => c.json({ ok: true, service: "hn-get" }));

  app.get("/v1", (c) =>
    c.json({
      search: "/v1/search?q=sqlite",
      lists: `/v1/lists/{name} (${HN_LIST_NAMES.join(", ")})`,
      item: "/v1/items/{id}",
      itemComments: "/v1/items/{id}/comments",
      user: "/v1/users/{username}",
      userActivity: "/v1/users/{username}/activity",
      replies: "/v1/replies/{id-or-username}",
      whoIsHiring: "/v1/whoishiring/{jobs|hired|freelance|all}",
    }),
  );

  app.get("/v1/search", async (c) => {
    const query = c.req.query();
    const result = await getClient().search({
      query: query.q,
      type: oneOf(query.type, ["story", "comment", "poll", "job", "all"] as const, "all"),
      author: query.author,
      points: optionalInt(query.points, "points", 0),
      comments: optionalInt(query.comments, "comments", 0),
      since: query.since,
      until: query.until,
      searchAttributes: query.searchAttrs,
      tags: query.tags,
      filters: query.filters,
      limit: int(query.limit, "limit", 20, 1, 100),
      page: int(query.page, "page", 0, 0, 10_000),
      sort: oneOf(query.sort, ["date", "points"] as const, "date"),
    });
    return cachedJson(c, result, 60);
  });

  app.get("/v1/lists/:name", async (c) => {
    const name = oneOf(c.req.param("name"), HN_LIST_NAMES, undefined);
    if (!name) throw new Error(`Unknown list. Use one of: ${HN_LIST_NAMES.join(", ")}.`);
    const query = c.req.query();
    const result = await getClient().list(name as ListName, {
      query: query.q,
      author: query.author,
      points: optionalInt(query.points, "points", 0),
      comments: optionalInt(query.comments, "comments", 0),
      since: query.since,
      until: query.until,
      limit: int(query.limit, "limit", 30, 1, 500),
      sort: oneOf(query.sort, ["date", "points"] as const, "date"),
    });
    return cachedJson(c, result, 60);
  });

  app.get("/v1/items/:id", async (c) => {
    const query = c.req.query();
    const result = await getClient().item(parseItemId(c.req.param("id")), {
      comments: query.comments === "true" || query.comments === "1",
      depth: int(query.depth, "depth", 2, 0, 10),
      commentsLimit: int(query.commentsLimit, "commentsLimit", 30, 1, 200),
    });
    return cachedJson(c, result, 60);
  });

  app.get("/v1/items/:id/comments", async (c) => {
    const query = c.req.query();
    const result = await getClient().itemComments(parseItemId(c.req.param("id")), {
      query: query.q,
      author: query.author,
      limit: int(query.limit, "limit", 20, 1, 100),
    });
    return cachedJson(c, result, 60);
  });

  app.get("/v1/users/:username", async (c) => {
    const submittedLimit = optionalInt(c.req.query("submittedLimit"), "submittedLimit", 0, 5000);
    const result = await getClient().user(c.req.param("username"), {
      includeSubmitted: submittedLimit !== undefined,
      submittedLimit,
    });
    return cachedJson(c, result, 300);
  });

  app.get("/v1/users/:username/activity", async (c) => {
    const activity = oneOf(c.req.query("type"), ["all", "story", "comment", "threads"] as const, "all");
    const limit = int(c.req.query("limit"), "limit", 20, 1, 100);
    const result =
      activity === "threads"
        ? await getClient().threads(c.req.param("username"), limit)
        : await getClient().submitted(c.req.param("username"), { type: activity, limit });
    return cachedJson(c, result, 60);
  });

  app.get("/v1/replies/:idOrUsername", async (c) => {
    const result = await getClient().replies(
      c.req.param("idOrUsername"),
      int(c.req.query("limit"), "limit", 20, 1, 100),
    );
    return cachedJson(c, result, 60);
  });

  app.get("/v1/whoishiring/:kind?", async (c) => {
    const kind = oneOf(c.req.param("kind"), ["jobs", "hired", "freelance", "all"] as const, "all");
    const result = await getClient().whoIsHiring(kind, int(c.req.query("limit"), "limit", 20, 1, 100));
    return cachedJson(c, result, 60);
  });

  app.get("/mcp", (c) => c.json({ error: "Use POST for stateless Streamable HTTP MCP requests." }, 405));
  app.delete("/mcp", (c) => c.json({ error: "This stateless MCP server has no sessions to delete." }, 405));

  app.post("/mcp", async (c) => {
    const transport = new WebStandardStreamableHTTPServerTransport();
    const server = createHnMcpServer({ client: getClient() });
    await server.connect(transport);
    return transport.handleRequest(c.req.raw);
  });

  app.all("*", async (c) => {
    const rss = await handleRssRequest(c.req.raw, getClient());
    return rss ?? c.json({ error: "Not found" }, 404);
  });

  return app;
}

function cachedJson(c: Context, value: unknown, seconds: number) {
  c.header("cache-control", `public, max-age=${seconds}, s-maxage=${seconds}`);
  return c.json(value);
}

function int(value: string | undefined, name: string, fallback: number, min: number, max: number): number {
  if (value === undefined || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer from ${min} to ${max}.`);
  }
  return parsed;
}

function optionalInt(value: string | undefined, name: string, min: number, max = Number.MAX_SAFE_INTEGER) {
  return value === undefined || value === "" ? undefined : int(value, name, min, min, max);
}

function oneOf<const T extends readonly string[]>(value: string | undefined, values: T, fallback: T[number]): T[number];
function oneOf<const T extends readonly string[]>(
  value: string | undefined,
  values: T,
  fallback: undefined,
): T[number] | undefined;
function oneOf<const T extends readonly string[]>(
  value: string | undefined,
  values: T,
  fallback: T[number] | undefined,
) {
  return value !== undefined && (values as readonly string[]).includes(value) ? (value as T[number]) : fallback;
}

function errorStatus(error: Error): 400 | 404 | 500 | 502 {
  if (/not found/i.test(error.message)) return 404;
  if (/upstream|HTTP|Algolia/i.test(error.message)) return 502;
  if (/must|required|invalid|unknown/i.test(error.message)) return 400;
  return 500;
}

const app = createApp();

export default app;

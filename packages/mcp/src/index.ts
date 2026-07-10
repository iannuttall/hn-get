import { HackerNewsClient, HN_LIST_NAMES, type ListName, parseItemId } from "@hn-get/core";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export interface HnMcpServerOptions {
  client?: HackerNewsClient;
  version?: string;
}

const limit = z.number().int().min(1).max(100).default(20).describe("Maximum results to return.");
const listLimit = z.number().int().min(1).max(500).default(30).describe("Maximum items to return.");
const sort = z.enum(["date", "points"]).default("date");

export function createHnMcpServer(options: HnMcpServerOptions = {}): McpServer {
  const client = options.client ?? new HackerNewsClient();
  const server = new McpServer({ name: "hn-get", version: options.version ?? "0.1.1" });

  server.registerTool(
    "hn_search",
    {
      description: "Search Hacker News stories, comments, polls, and jobs with structured filters.",
      inputSchema: {
        query: z.string().optional(),
        type: z.enum(["story", "comment", "poll", "job", "all"]).default("all"),
        author: z.string().optional(),
        points: z.number().int().min(0).optional(),
        comments: z.number().int().min(0).optional(),
        since: z.string().optional().describe("ISO date or relative value such as 24h, 7d, 2w, 6mo, or 1y."),
        until: z.string().optional(),
        limit,
        page: z.number().int().min(0).max(10_000).default(0),
        sort,
      },
    },
    async (input) => toolResult(() => client.search(input)),
  );

  server.registerTool(
    "hn_list",
    {
      description: "Browse an official, searchable, or HTML-backed Hacker News list.",
      inputSchema: {
        name: z.enum(HN_LIST_NAMES),
        query: z.string().optional(),
        author: z.string().optional(),
        points: z.number().int().min(0).optional(),
        comments: z.number().int().min(0).optional(),
        since: z.string().optional(),
        until: z.string().optional(),
        limit: listLimit,
        sort,
      },
    },
    async ({ name, ...input }) => toolResult(() => client.list(name as ListName, input)),
  );

  server.registerTool(
    "hn_item",
    {
      description: "Fetch one Hacker News item, optionally with a bounded comment tree.",
      inputSchema: {
        id: z.union([z.number().int().positive(), z.string()]),
        comments: z.boolean().default(false),
        depth: z.number().int().min(0).max(10).default(2),
        commentsLimit: z.number().int().min(1).max(200).default(30),
      },
    },
    async ({ id, ...input }) => toolResult(() => client.item(parseItemId(String(id)), input)),
  );

  server.registerTool(
    "hn_item_comments",
    {
      description: "Search the comments belonging to one Hacker News story or item.",
      inputSchema: {
        id: z.union([z.number().int().positive(), z.string()]),
        query: z.string().optional(),
        author: z.string().optional(),
        limit,
      },
    },
    async ({ id, ...input }) => toolResult(() => client.itemComments(parseItemId(String(id)), input)),
  );

  server.registerTool(
    "hn_user",
    {
      description: "Fetch a Hacker News user profile.",
      inputSchema: {
        username: z.string().min(1),
        submittedLimit: z.number().int().min(0).max(5000).optional(),
      },
    },
    async ({ username, submittedLimit }) =>
      toolResult(() =>
        client.user(username, {
          includeSubmitted: submittedLimit !== undefined,
          submittedLimit,
        }),
      ),
  );

  server.registerTool(
    "hn_user_activity",
    {
      description: "Fetch recent submissions, comments, or threads for a Hacker News user.",
      inputSchema: {
        username: z.string().min(1),
        activity: z.enum(["all", "story", "comment", "threads"]).default("all"),
        limit,
      },
    },
    async ({ username, activity, limit: resultLimit }) =>
      toolResult(() =>
        activity === "threads"
          ? client.threads(username, resultLimit)
          : client.submitted(username, { limit: resultLimit, type: activity }),
      ),
  );

  server.registerTool(
    "hn_replies",
    {
      description: "Find replies to an item id or to a user's recent comments.",
      inputSchema: {
        idOrUsername: z.string().min(1),
        limit,
      },
    },
    async ({ idOrUsername, limit: resultLimit }) => toolResult(() => client.replies(idOrUsername, resultLimit)),
  );

  server.registerTool(
    "hn_who_is_hiring",
    {
      description: "Search the latest Who is hiring, wants to be hired, or freelancer thread.",
      inputSchema: {
        kind: z.enum(["jobs", "hired", "freelance", "all"]).default("all"),
        limit,
      },
    },
    async ({ kind, limit: resultLimit }) => toolResult(() => client.whoIsHiring(kind, resultLimit)),
  );

  return server;
}

async function toolResult(load: () => Promise<unknown>) {
  try {
    const value = await load();
    return {
      content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
        },
      ],
    };
  }
}

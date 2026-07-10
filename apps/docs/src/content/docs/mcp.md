---
title: Local and remote MCP
description: Connect an MCP client to hn-get over stdio or Streamable HTTP.
---

## Run MCP locally with npx

The main npm package includes the stdio MCP server. A separate `hn-get-mcp` package is not needed.

```json
{
  "mcpServers": {
    "hacker-news": {
      "command": "npx",
      "args": ["-y", "hn-get", "mcp"]
    }
  }
}
```

You can also start it directly:

```bash
npx hn-get mcp
```

## Connect over Streamable HTTP

The deployed Worker exposes the same tools at `https://hn-get.iann.workers.dev/mcp`. Use that URL in clients that support remote Streamable HTTP servers.

The server is stateless. It does not need a Durable Object, session database, OAuth flow, or API key.

## Available tools

| Tool | Returns |
| --- | --- |
| `hn_search` | Filtered Algolia search results |
| `hn_list` | Live, searchable, or HTML-backed HN lists |
| `hn_item` | One item with an optional bounded comment tree |
| `hn_item_comments` | Searchable comments for one item |
| `hn_user` | A compact user profile |
| `hn_user_activity` | Submissions, comments, or threads |
| `hn_replies` | Replies to an item or recent user comments |
| `hn_who_is_hiring` | Results from current hiring threads |

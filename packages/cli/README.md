# hn-get

`hn-get` is a JSON-first Hacker News CLI and MCP server.

<p>
  <a href="https://github.com/iannuttall/hn-get/actions/workflows/check.yml"><img alt="checks" src="https://img.shields.io/github/actions/workflow/status/iannuttall/hn-get/check.yml?branch=main&label=checks"></a>
  <a href="https://www.npmjs.com/package/hn-get"><img alt="npm version" src="https://img.shields.io/npm/v/hn-get?label=npm"></a>
  <a href="https://github.com/iannuttall/hn-get/blob/main/LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-black"></a>
</p>

[Security policy](https://github.com/iannuttall/hn-get/blob/main/SECURITY.md) · [MIT license](https://github.com/iannuttall/hn-get/blob/main/LICENSE)

```bash
npx hn-get frontpage --limit 30
npx hn-get search "sqlite" --sort points --since 30d
npx hn-get item 40956979 --comments --depth 2
```

JSON is the default. Use `--format markdown`, `text`, `compact`, or `ndjson` when another format fits better.

## Run the stdio MCP server

```bash
npx hn-get mcp
```

Example client config:

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

The package also exports `HackerNewsClient` and `createHnMcpServer` for programmatic use.

The [hn-get documentation](https://hn-get.iann.workers.dev) covers the CLI, HTTP API, remote MCP server, and RSS feeds.

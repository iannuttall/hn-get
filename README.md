# hn-get

`hn-get` is one Hacker News data pipeline with five clients.

<p>
  <a href="https://github.com/iannuttall/hn-get/actions/workflows/check.yml"><img alt="checks" src="https://img.shields.io/github/actions/workflow/status/iannuttall/hn-get/check.yml?branch=main&label=checks"></a>
  <a href="https://www.npmjs.com/package/hn-get"><img alt="npm version" src="https://img.shields.io/npm/v/hn-get?label=npm"></a>
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-black"></a>
</p>

[Documentation](https://hn-get.iann.workers.dev) · [Security policy](SECURITY.md) · [MIT license](LICENSE)

- A JSON-first CLI for people, scripts, and agents
- A local stdio MCP server
- A Cloudflare Worker with a public HTTP API
- A remote Streamable HTTP MCP server
- RSS feeds for lists, searches, users, items, and hiring threads

Firebase supplies live items, users, and official lists. Algolia supplies search, comments, and historical activity. A small HTML parser covers public Hacker News pages such as active discussions and best comments.

## Install the CLI and stdio MCP server

```bash
npx hn-get help
npm install --global hn-get
```

JSON stays the default output.

```bash
hn-get frontpage --limit 30
hn-get search "sqlite" --sort points --since 30d
hn-get item 40956979 --comments --depth 2
hn-get user pg --submitted-limit 20
hn-get whoishiring jobs --limit 20
```

Readable Markdown, text, compact JSON, and NDJSON are available when needed.

```bash
hn-get show --sort points --format markdown
hn-get newest --format ndjson
```

## Connect the local MCP server

The npm package runs its stdio server through the main CLI.

A client config looks like this.

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

The shared MCP package exposes these tools.

| Tool | What it returns |
| --- | --- |
| `hn_search` | Filtered Algolia search results |
| `hn_list` | Live, searchable, or HTML-backed HN lists |
| `hn_item` | One item with an optional bounded comment tree |
| `hn_item_comments` | Searchable comments for one item |
| `hn_user` | A compact user profile |
| `hn_user_activity` | Submissions, comments, or threads |
| `hn_replies` | Replies to an item or recent user comments |
| `hn_who_is_hiring` | Results from the current hiring threads |

## Use the Worker API

The Worker serves the API at `/v1`.

```text
GET /v1/search?q=sqlite&sort=points&limit=20
GET /v1/lists/frontpage?limit=30
GET /v1/items/40956979?comments=true&depth=2
GET /v1/items/40956979/comments?q=sqlite
GET /v1/users/pg
GET /v1/users/pg/activity?type=story
GET /v1/replies/40956979
GET /v1/whoishiring/jobs
```

Responses are JSON. Limits are bounded and bad input returns a JSON error with a useful HTTP status.

The remote MCP endpoint is `/mcp`. It uses stateless Streamable HTTP, so it shares the same tools without a Durable Object or session database.

## Subscribe to RSS feeds

RSS routes work under `/rss`.

```text
GET /rss/newest
GET /rss/frontpage?count=30
GET /rss/newcomments?q=sqlite
GET /rss/item?id=40956979
GET /rss/user?id=pg
GET /rss/whoishiring/jobs?q=typescript
```

The old hnfeed-style paths also work without the `/rss` prefix, including `/newest`, `/item`, and `/whoishiring/jobs`.

Supported feed parameters include `q`, `points`, `comments`, `count`, `description`, `link`, `id`, and `author`.

## How the repo is split

```text
apps/worker
  Cloudflare HTTP API, RSS routes, and remote MCP transport

apps/docs
  Starlight documentation served as Worker static assets

packages/core
  Hacker News and Algolia clients, normalization, limits, and parsing

packages/rss
  Feed routing and RSS rendering over core results

packages/mcp
  One MCP tool registry shared by remote HTTP and local stdio

packages/cli
  Published hn-get package, terminal output, and stdio entry point
```

Core owns Hacker News behavior. Each client only parses its input, calls core, and formats the result. Fixing a query or normalization bug once fixes every client.

## Work on it locally

```bash
corepack enable
pnpm install
pnpm check
pnpm security:check
pnpm pack:dry-run
pnpm worker:deploy:dry-run
```

Useful development commands are:

```bash
pnpm dev
pnpm dev:docs
pnpm dev:cli -- search sqlite
pnpm types
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

Wrangler config lives in `apps/worker/wrangler.jsonc`. It has no account id, route, or secret. A Cloudflare Git build should use the repo root with `pnpm build` as the build command and `pnpm worker:deploy` as the deploy command.

## Publish through npm trusted publishing

`.github/workflows/publish.yml` checks the package version on every relevant push to `main`. A changed version runs the full checks, inspects the tarball, and publishes with npm OIDC. There is no long-lived `NPM_TOKEN`.

Configure the `hn-get` package on npm with these trusted publisher values.

| Setting | Value |
| --- | --- |
| Provider | GitHub Actions |
| Owner | `iannuttall` |
| Repository | `hn-get` |
| Workflow | `publish.yml` |
| Allowed action | `npm publish` |

Then bump `packages/cli/package.json` when a release is ready. The root version is only repo metadata.

## Data and output rules

- JSON remains the CLI and HTTP default.
- Search results are capped at 100 per request.
- Lists are capped at 500 items.
- Comment trees are depth and count limited.
- Upstream calls use timeouts and conservative retries.
- No client crawls linked article pages.
- There is no auth, cookie state, or hidden local config.

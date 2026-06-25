# hncli

`hncli` is a Hacker News CLI for agents, scripts, and terminal use.

It fetches stories, comments, users, live lists, favorites, jobs, and search results. JSON is the default output because agents should not have to scrape terminal text. Markdown and text output are there when you want something easier to read.

The CLI uses two public data sources.

- Hacker News Firebase API for live items, users, and official story lists.
- Algolia Hacker News Search API for full-text search, author feeds, comments, and older posts.

## How to install hncli

```bash
npx hncli help
npm install -g hncli
```

## Start with these commands

```bash
hncli frontpage --limit 30
hncli search "sqlite" --limit 10
hncli search "vector database" --sort points --since 30d
hncli show --sort points --since 30d --limit 20
hncli item 40956979 --comments --depth 2 --comments-limit 20
hncli user pg
hncli comments "react compiler" --limit 10
hncli whoishiring jobs --limit 20
```

## Search and filter Hacker News

```bash
hncli search "sqlite"
hncli comments "sqlite"
hncli search "llm" --type story --points 100 --comments 20
hncli search "postgres" --since 2025-01-01 --until 2025-12-31
hncli show --sort points --points 100 --comments 20
```

Search and section commands default to newest first. That is usually the closest match to the live site feed. Use `--sort points` when you want popular posts.

Dates accept ISO dates or relative durations.

- `24h`
- `7d`
- `2w`
- `6mo`
- `1y`

## Browse live lists and sections

```bash
hncli top
hncli newest
hncli frontpage
hncli best
hncli active
hncli ask
hncli show
hncli jobs
hncli polls
hncli launches
hncli bestcomments
```

## Read stories and comments

```bash
hncli item 40956979
hncli item 40956979 --comments
hncli item 40956979 --feed
hncli item-comments 40956979 "sqlite"
hncli replies 40956979
```

`item` returns the Firebase item by default. Add `--comments` when you want a bounded comment tree. Add `--feed` when you want searchable comment results for that item.

## Get user activity

```bash
hncli user pg
hncli user pg --feed
hncli submitted pg
hncli threads pg
hncli replies pg
hncli favorites pg
```

## Search hiring threads

```bash
hncli whoishiring
hncli whoishiring jobs
hncli whoishiring hired
hncli whoishiring freelance
```

## Choose an output format

Default output is pretty JSON.

```bash
hncli search "rust" --format json
hncli frontpage --format compact
hncli newest --format ndjson
hncli show --sort points --format markdown
hncli item 40956979 --comments --format text
```

The output formats are:

| Format | Use it when |
| --- | --- |
| `json` | You want readable structured output. |
| `compact` | You want compact JSON for scripts. |
| `ndjson` | You want one JSON object per row. |
| `markdown` | You want readable Markdown. HN HTML is converted with Defuddle. |
| `text` | You want a plain terminal view. |

## Get command help

Help is available at root and for every subcommand.

```bash
hncli help
hncli help search
hncli item --help
```

## Limits that keep commands safe

- Search results are capped at 100 per command.
- List results are capped at 500 per command.
- Comment tree fetching is capped and depth-limited.
- Upstream network calls use timeouts and retries.
- The CLI does not use auth, cookies, browser state, credentials, or local config.

## Work on the package locally

```bash
corepack enable
pnpm install
pnpm run build
pnpm test
pnpm run lint
```

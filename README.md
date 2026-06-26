# hn-get

`hn-get` is a Hacker News CLI for agents, scripts, and terminal use.

It fetches stories, comments, users, live lists, favorites, jobs, and search results. JSON is the default output because agents should not have to scrape terminal text. Markdown and text output are there when you want something easier to read.

The CLI uses two public data sources.

- Hacker News Firebase API for live items, users, and official story lists.
- Algolia Hacker News Search API for full-text search, author feeds, comments, and older posts.

## Install hn-get

```bash
npx hn-get help
npm install -g hn-get
```

## Start with these commands

```bash
hn-get frontpage --limit 30
hn-get search "sqlite" --limit 10
hn-get search "vector database" --sort points --since 30d
hn-get show --sort points --since 30d --limit 20
hn-get item 40956979 --comments --depth 2 --comments-limit 20
hn-get user pg
hn-get comments "react compiler" --limit 10
hn-get whoishiring jobs --limit 20
```

## Search and filter Hacker News

```bash
hn-get search "sqlite"
hn-get comments "sqlite"
hn-get search "llm" --type story --points 100 --comments 20
hn-get search "postgres" --since 2025-01-01 --until 2025-12-31
hn-get show --sort points --points 100 --comments 20
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
hn-get top
hn-get newest
hn-get frontpage
hn-get best
hn-get active
hn-get ask
hn-get show
hn-get jobs
hn-get polls
hn-get launches
hn-get bestcomments
```

## Read stories and comments

```bash
hn-get item 40956979
hn-get item 40956979 --comments
hn-get item 40956979 --feed
hn-get item-comments 40956979 "sqlite"
hn-get replies 40956979
```

`item` returns the Firebase item by default. Add `--comments` when you want a bounded comment tree. Add `--feed` when you want searchable comment results for that item.

## Get user activity

```bash
hn-get user pg
hn-get user pg --submitted-limit 20
hn-get user pg --feed
hn-get submitted pg
hn-get threads pg
hn-get replies pg
hn-get favorites pg
```

`user` returns the profile plus `submittedCount`. It does not print the full submitted ID list unless you add `--submitted` or `--submitted-limit`.

## Search hiring threads

```bash
hn-get whoishiring
hn-get whoishiring jobs
hn-get whoishiring hired
hn-get whoishiring freelance
```

## Choose an output format

Default output is pretty JSON.

```bash
hn-get search "rust" --format json
hn-get frontpage --format compact
hn-get newest --format ndjson
hn-get show --sort points --format markdown
hn-get item 40956979 --comments --format text
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
hn-get help
hn-get help search
hn-get item --help
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

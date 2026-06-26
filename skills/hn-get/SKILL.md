---
name: hn-get
description: Use the hn-get Hacker News CLI to search Hacker News, inspect stories, fetch comments, check user activity, browse live lists, find hiring posts, and return agent-friendly JSON or Markdown. Use when a task asks for Hacker News data, Show HN posts, Ask HN threads, user submissions, item comments, favorites, who is hiring results, or current HN lists.
---

# hn-get

Use `hn-get` for Hacker News data instead of scraping the website.

Prefer JSON when you need data to reason over. Use Markdown when the user wants readable context or a concise brief.

## Check the tool

Start with:

```bash
hn-get help
```

If `hn-get` is not installed, use:

```bash
npx hn-get help
```

Use subcommand help when unsure:

```bash
hn-get help search
hn-get help item
hn-get help show
```

## Output choice

Use `--format json` or the default for structured work.

Use `--format compact` when another command will parse the output.

Use `--format ndjson` for list processing.

Use `--format markdown` when the next step is summarizing, quoting, or giving the user a readable answer.

Use `--format text` only for quick human inspection.

## Common tasks

Search HN:

```bash
hn-get search "sqlite" --limit 10
hn-get search "postgres" --since 30d --limit 20
hn-get search "llm" --type story --points 100 --comments 20
```

Find popular Show HN posts:

```bash
hn-get show --sort points --since 30d --limit 20
hn-get show --sort points --points 100 --comments 20 --format markdown
```

Browse live lists:

```bash
hn-get frontpage --limit 30
hn-get newest --limit 30
hn-get best --limit 30
hn-get active --limit 30
```

Fetch one item:

```bash
hn-get item 40956979
hn-get item 40956979 --comments --depth 2 --comments-limit 20
hn-get item 40956979 --format markdown
```

Search comments on one item:

```bash
hn-get item-comments 40956979 "sqlite" --limit 20
hn-get item 40956979 --feed --limit 20
```

Inspect users:

```bash
hn-get user pg
hn-get user pg --submitted-limit 20
hn-get submitted pg --limit 20
hn-get threads pg --limit 20
hn-get replies pg --limit 20
hn-get favorites pg --limit 20
```

`hn-get user` omits the full submitted ID list by default. Use `--submitted-limit <count>` when you need some IDs, or `--submitted` when the full list is really needed.

Search hiring threads:

```bash
hn-get whoishiring --limit 20
hn-get whoishiring jobs --limit 20
hn-get whoishiring hired --limit 20
hn-get whoishiring freelance --limit 20
```

## Sorting and dates

Search and section commands default to newest first.

Use `--sort points` for popular posts.

Use relative dates for recent windows:

```bash
hn-get search "rust" --since 7d
hn-get show --sort points --since 30d
hn-get comments "react compiler" --since 24h
```

Use ISO dates for fixed ranges:

```bash
hn-get search "postgres" --since 2026-01-01 --until 2026-06-01
```

## Safe usage

Keep limits small unless the user asks for more. Most agent tasks only need 10 to 30 results.

Do not fetch linked article URLs through `hn-get`. The CLI returns HN data and linked URLs, but it does not crawl article pages.

For a final answer, cite the HN item URLs returned in `hnUrl` when useful. If a result has a separate `url`, mention it as the article or project link.

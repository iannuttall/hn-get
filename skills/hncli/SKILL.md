---
name: hncli
description: Use the hncli Hacker News CLI to search Hacker News, inspect stories, fetch comments, check user activity, browse live lists, find hiring posts, and return agent-friendly JSON or Markdown. Use when a task asks for Hacker News data, Show HN posts, Ask HN threads, user submissions, item comments, favorites, who is hiring results, or current HN lists.
---

# hncli

Use `hncli` for Hacker News data instead of scraping the website.

Prefer JSON when you need data to reason over. Use Markdown when the user wants readable context or a concise brief.

## Check the tool

Start with:

```bash
hncli help
```

If `hncli` is not installed, use:

```bash
npx hncli help
```

Use subcommand help when unsure:

```bash
hncli help search
hncli help item
hncli help show
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
hncli search "sqlite" --limit 10
hncli search "postgres" --since 30d --limit 20
hncli search "llm" --type story --points 100 --comments 20
```

Find popular Show HN posts:

```bash
hncli show --sort points --since 30d --limit 20
hncli show --sort points --points 100 --comments 20 --format markdown
```

Browse live lists:

```bash
hncli frontpage --limit 30
hncli newest --limit 30
hncli best --limit 30
hncli active --limit 30
```

Fetch one item:

```bash
hncli item 40956979
hncli item 40956979 --comments --depth 2 --comments-limit 20
hncli item 40956979 --format markdown
```

Search comments on one item:

```bash
hncli item-comments 40956979 "sqlite" --limit 20
hncli item 40956979 --feed --limit 20
```

Inspect users:

```bash
hncli user pg
hncli submitted pg --limit 20
hncli threads pg --limit 20
hncli replies pg --limit 20
hncli favorites pg --limit 20
```

Search hiring threads:

```bash
hncli whoishiring --limit 20
hncli whoishiring jobs --limit 20
hncli whoishiring hired --limit 20
hncli whoishiring freelance --limit 20
```

## Sorting and dates

Search and section commands default to newest first.

Use `--sort points` for popular posts.

Use relative dates for recent windows:

```bash
hncli search "rust" --since 7d
hncli show --sort points --since 30d
hncli comments "react compiler" --since 24h
```

Use ISO dates for fixed ranges:

```bash
hncli search "postgres" --since 2026-01-01 --until 2026-06-01
```

## Safe usage

Keep limits small unless the user asks for more. Most agent tasks only need 10 to 30 results.

Do not fetch linked article URLs through `hncli`. The CLI returns HN data and linked URLs, but it does not crawl article pages.

For a final answer, cite the HN item URLs returned in `hnUrl` when useful. If a result has a separate `url`, mention it as the article or project link.

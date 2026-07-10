---
title: Install hn-get
description: Run the hn-get Hacker News CLI or install it globally with npm.
---

You need Node.js 24.11 or newer. Run `hn-get` without installing anything globally:

```bash
npx hn-get help
```

Install it when you use it often:

```bash
npm install --global hn-get
hn-get --version
```

JSON is the default output. This keeps commands easy to pipe into `jq`, another script, or an agent.

```bash
hn-get frontpage --limit 30
hn-get search "sqlite" --sort points --since 30d
hn-get item 40956979 --comments --depth 2
hn-get user pg --submitted-limit 20
```

Use `--format markdown` for readable output, `--format compact` for small JSON, or `--format ndjson` for one object per line.

```bash
hn-get show --sort points --format markdown
hn-get newest --format ndjson
```

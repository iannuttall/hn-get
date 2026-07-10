---
title: RSS feeds
description: Subscribe to Hacker News lists, searches, users, items, and hiring threads.
---

RSS feeds use the same core client as the CLI, API, and MCP server. The deployed feed base is `https://hn-get.iann.workers.dev/rss`.

```text
GET /rss/newest
GET /rss/frontpage?count=30
GET /rss/newcomments?q=sqlite
GET /rss/item?id=40956979
GET /rss/user?id=pg
GET /rss/whoishiring/jobs?q=typescript
```

Old hnfeed-style paths work without the `/rss` prefix. `/newest`, `/item`, and `/whoishiring/jobs` are valid examples.

## Filter feed results

Feeds support these parameters:

| Parameter | Use |
| --- | --- |
| `q` | Filter results by a search query |
| `points` | Require a minimum score |
| `comments` | Require a minimum comment count |
| `count` | Set the number of items, capped at 100 |
| `description` | Set to `0` to omit item descriptions |
| `link` | Set to `comments` to link to HN discussions |
| `id` | Supply a username or item ID for relevant feeds |
| `author` | Filter comments by author |

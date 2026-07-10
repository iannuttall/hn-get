---
title: HTTP API
description: Call the hn-get Cloudflare Worker API and receive bounded JSON responses.
---

The public API starts at `https://hn-get.iann.workers.dev/v1`. Every successful response is JSON and includes cache headers suited to the data being returned.

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

## Search parameters

`/v1/search` accepts `q`, `type`, `author`, `points`, `comments`, `since`, `until`, `limit`, `page`, and `sort`.

Dates can be ISO dates or relative values such as `24h`, `7d`, `2w`, `6mo`, and `1y`. Search limits are capped at 100 results per request.

## Item and user parameters

Set `comments=true` on an item request to include a bounded comment tree. `depth` is capped at 10 and `commentsLimit` is capped at 200.

User profiles omit the full submission list by default. Add `submittedLimit` when those IDs are needed.

## Errors and CORS

Bad parameters return a JSON error with a `400` status. Missing items return `404`, and upstream API failures return `502`. CORS is enabled for public API requests.

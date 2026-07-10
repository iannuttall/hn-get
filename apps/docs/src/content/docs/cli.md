---
title: Use the CLI
description: Search Hacker News, read items, inspect users, and browse live lists from the terminal.
---

## Search stories and comments

Search uses the Algolia Hacker News index. Results default to newest first.

```bash
hn-get search "postgres" --since 30d --limit 20
hn-get search "llm" --type story --points 100 --comments 20
hn-get comments "sqlite" --author pg --limit 20
```

Use `--sort points` when popularity matters more than recency.

## Browse Hacker News lists

Official lists use the Firebase API. Searchable sections use Algolia. A few lists such as `active` and `bestcomments` come from their public HN pages because no API exists for them.

```bash
hn-get top --limit 30
hn-get newest --limit 30
hn-get frontpage --limit 30
hn-get ask --sort points --since 7d
hn-get show --sort points --since 30d
hn-get bestcomments --limit 20
```

## Read an item and its comments

```bash
hn-get item 40956979
hn-get item 40956979 --comments --depth 2 --comments-limit 20
hn-get item-comments 40956979 "sqlite" --limit 20
```

Comment trees are bounded by depth and count. `hn-get` will not turn one command into an accidental crawl.

## Inspect users and hiring threads

```bash
hn-get user pg
hn-get submitted pg --limit 20
hn-get threads pg --limit 20
hn-get replies pg --limit 20
hn-get whoishiring jobs --limit 20
```

`hn-get user` returns a compact profile and submission count. Add `--submitted-limit 20` when you need recent submitted item IDs.

Run `hn-get help <command>` for every option supported by a command.

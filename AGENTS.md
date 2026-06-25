# Agent guide for hncli

This repo is a TypeScript npm package for the `hncli` command. It fetches Hacker News data for agents and terminal users.

Default output is JSON. Keep that contract stable unless the user asks for a breaking change.

## Start here

- Read `README.md` before changing commands or output.
- Check `src/cli.ts` for command wiring.
- Check `src/hn.ts` for Hacker News and Algolia API behavior.
- Check `src/output.ts` and `src/markdown.ts` before changing output formats.
- Run `pnpm test` and `pnpm run lint` before handing work back.

## Local commands

```bash
corepack enable
pnpm install
pnpm run build
pnpm test
pnpm run lint
pnpm pack --dry-run
```

Use `pnpm run dev -- <command>` while developing. Use `node dist/cli.js <command>` after a build.

## Project shape

- `src/cli.ts` defines commands, help text, options, and argument parsing.
- `src/hn.ts` owns upstream API calls and data normalization.
- `src/http.ts` wraps `fetch` with timeouts and retries.
- `src/output.ts` prints JSON, NDJSON, text, and Markdown.
- `src/markdown.ts` converts Hacker News HTML fragments with Defuddle.
- `src/utils.ts` has small parsing and formatting helpers.
- `tests/hn.test.mjs` covers API parameter building, parsing helpers, and Markdown conversion.

## Command behavior

- Search and section commands default to newest first with `sort: "date"`.
- Popular views use `--sort points`.
- `item <id>` returns the Firebase item by default.
- `item <id> --comments` fetches a bounded comment tree.
- `item <id> --feed` returns searchable comments for that item.
- `user <username>` returns the Firebase user profile.
- `user <username> --feed` returns user activity.

Do not make commands crawl linked article URLs by default. This CLI fetches Hacker News data. Pulling external article pages changes runtime, failure modes, and user expectations.

## Output rules

- JSON stays the default.
- `compact` must be valid JSON with no extra text.
- `ndjson` must print one JSON object per line.
- `markdown` should be readable and stable enough for agents to quote or summarize.
- `text` can be human-friendly, but do not add progress spinners or decorative output.

Errors should go to stderr through the existing error handler.

## Upstream API rules

- Use the Firebase Hacker News API for live items, users, and official lists.
- Use Algolia for search, comments, historical lookups, and author feeds.
- Keep request limits bounded.
- Keep retries conservative.
- Do not add auth, cookies, browser state, or hidden local config.

## Dependency rules

Keep the dependency list short. Current runtime dependencies are `commander`, `defuddle`, and `he`.

Defuddle is used for Markdown conversion from Hacker News HTML fragments. Do not add Readability, Turndown, JSDOM, or a direct DOM dependency unless there is a tested reason.

## Publishing checks

Before publishing run:

```bash
pnpm test
pnpm run lint
pnpm pack --dry-run
```

Check the tarball file list. It should include `dist`, `README.md`, `LICENSE`, and `package.json`.

The GitHub workflow publishes from `main` only when the package version differs from npm.

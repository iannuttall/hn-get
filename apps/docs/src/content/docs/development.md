---
title: Monorepo and development
description: Understand the hn-get packages, run local checks, and prepare releases.
---

`hn-get` is a pnpm and Turborepo workspace running on Node.js 24.18.0.

```text
apps/docs       Starlight documentation
apps/worker     Cloudflare HTTP API, RSS, and remote MCP
packages/core   Hacker News and Algolia data client
packages/rss    RSS routing and XML rendering
packages/mcp    Shared MCP tool registry
packages/cli    Published CLI and local stdio MCP
```

Core owns the upstream behavior and data normalization. The clients parse input and format the same results for their transport.

## Run the workspace locally

```bash
nvm use
corepack enable
pnpm install
pnpm check
pnpm security:check
pnpm pack:dry-run
pnpm worker:deploy:dry-run
```

Run the Worker and docs separately during development:

```bash
pnpm dev
pnpm dev:docs
```

## Publish the npm package

The publish workflow runs from `main` when `packages/cli/package.json` has a version not already on npm. npm trusted publishing uses GitHub OIDC, so the repository does not store an npm token.

Configure the npm package with `iannuttall` as the owner, `hn-get` as the repository, and `publish.yml` as the workflow filename. Allow the `npm publish` action.

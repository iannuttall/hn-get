# Security

## Report a vulnerability privately

Do not open a public issue for a suspected vulnerability.

Use [GitHub private vulnerability reporting](https://github.com/iannuttall/hn-get/security/advisories/new). This keeps the report private and does not expose an email address.

Please include:

- The affected package, route, MCP tool, or command.
- Clear steps that reproduce the problem.
- The practical impact.
- Any logs or request examples that make the issue easier to verify.

## Keep secrets out of the repo

- Production secrets must never be committed.
- Use `.dev.vars` or `.dev.vars.*` for local Worker secrets. Both are ignored.
- Checked-in example files must contain only empty or placeholder values.
- Production secrets belong in Cloudflare secrets or GitHub Actions secrets.
- npm publishing uses GitHub OIDC. Do not add an `NPM_TOKEN`.

## Run the local security checks

Run these before publishing or changing the Worker, MCP transport, or release workflow.

```sh
pnpm security:check
pnpm check
pnpm worker:deploy:dry-run
pnpm pack:dry-run
```

`pnpm security:check` runs `pnpm audit` and scans the full Git history with `gitleaks`. On macOS the helper installs `gitleaks` with Homebrew when it is missing.

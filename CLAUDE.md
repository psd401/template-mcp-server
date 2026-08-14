# CLAUDE.md — template-mcp-server

Map, not manual. Change this file in the same PR that changes the convention.

## Stack

- TypeScript (strict, `noUncheckedIndexedAccess`), Node 22+, ESM (`type: module`)
- @modelcontextprotocol/sdk (streamable HTTP + stdio) · zod validation · Vitest 4 · ESLint flat config

## Commands (exact)

```bash
npm run dev          # stdio dev server (what .mcp.json launches)
npm run build        # tsc -> dist/
npm start            # stateless streamable HTTP on :3000 (build first)
npm test             # vitest run (CI gate; zero-test repos fail psd-ci)
npm run lint         # eslint . — includes test-quality rules
npm run typecheck    # tsc --noEmit
```

## Map

- `src/items.ts` — example domain: fixture data, zod input shape, search logic, tool handler. Replace the domain, keep the shape.
- `src/server.ts` — `buildServer()`: tool registration + annotations. All tools register here.
- `src/http.ts` — stateless streamable HTTP entrypoint (production). `src/stdio.ts` — dev mode.
- `src/*.test.ts` — direct handler tests + in-memory client/server integration test.
- `server.json` — MCP registry metadata. `evals/` — tool eval stub. `.mcp.json` — local Claude Code wiring.

## Conventions (from 07-mcp.md)

- Tool names: `psd_<system>_<resource>_<verb>`. ≤ ~15 tools/server; workflow tools, not 1:1 API wrappers.
- **Every tool declares `readOnlyHint`/`destructiveHint`** — gateways gate approval flows on them. Lying in an annotation is an incident.
- Validate all input with zod before it touches logic; errors must teach (what was wrong + what to do instead).
- Paginate everything; responses stay well under the ~25k-token client cap. `response_format: concise|detailed` on list/search tools.
- **Write tools are dry-run by default** with explicit `confirm`, audit trail, rollback where possible.
- Stateless HTTP: never store per-session state server-side; return handles (cursors) instead.
- Credentials never through form-mode elicitation; OAuth 2.1 resource-server pattern for anything network-exposed; token passthrough is forbidden.

## Anti-patterns (will fail review)

- A write tool without dry-run default, or missing/false annotations.
- Un-namespaced tool names (`search`, `get_items`) — they collide across the fleet.
- Unbounded responses (no limit/cursor) or dumping raw upstream API payloads.
- Session state in the HTTP entrypoint (`sessionIdGenerator` set) — the fleet standard is stateless.
- Deleting or `.skip`-ing tests to get green; assertion-free tests (lint blocks both).
- New dependencies without a stated reason in the PR body.

## PR evidence bar

Tests + lint + typecheck + build output pasted in the PR; tool inventory in README updated when tools change; `server.json` bumped with the version.

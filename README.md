# template-mcp-server

PSD401 template for TypeScript MCP servers, built to the district MCP standard (07-mcp.md). Start every new MCP server from this template; name the repo with an `-mcp` suffix.

## What this template gives you

- **Stateless streamable HTTP entrypoint** (`src/http.ts`) — fresh server + transport per request, no sessions; state lives in explicit handles (cursors). Plus a **stdio dev mode** (`src/stdio.ts`, wired into `.mcp.json` for Claude Code).
- **One exemplar tool**: `psd_example_items_search` — namespaced (`psd_<system>_<resource>_<verb>`), `readOnlyHint` annotated, paginated with opaque cursors, `response_format: concise|detailed`, zod input validation, errors that teach.
- **Real tests** (`src/items.test.ts`): direct handler assertions plus an in-memory client/server integration test. PSD CI fails zero-test repos by design.
- **`server.json`** registry stub (fill the CHANGEME placeholders), **evals/** stub, PSD CI callers, Dependabot, MIT LICENSE, CLAUDE.md.

## First 10 minutes

1. **Rename**: `package.json` name, `SERVER_INFO` in `src/server.ts`, every CHANGEME in `server.json`, `.mcp.json` key. Repo name ends in `-mcp`.
2. **Set repo custom properties**: `tier` (default `c-experiment`), `owner`, `lifecycle: active`; add topics (`mcp-server`, …).
3. **Review CLAUDE.md** and prune it to your server.
4. **Verify green**: `bun install && bun run test && bun run lint && bun run typecheck && bun run build` (bun is the PSD JS runtime rule; `bun.lock` is committed).
5. Replace the example items module with your real domain; keep the tool shape (pagination, response_format, annotations, teaching errors).
6. Before any deployment: OAuth 2.1 resource-server auth or district gateway in front — never a bare network-exposed server.

## Server risk tiers (07-mcp.md)

| Tier | Definition | Extra obligations |
|------|-----------|-------------------|
| MCP-1 | Read-only queries | Baseline only |
| MCP-2 | Limited writes, reversible | **Dry-run default**, audit trail, rollback |
| MCP-3 | Dangerous writes: identity, student data, physical safety | Gateway-only access, per-user auth, human confirmation on destructive tools, full audit log, CODEOWNERS review on every change |

This template as shipped is MCP-1. The moment you add a write tool you are MCP-2 minimum.

## The dry-run rule for write tools

Every write tool defaults to `dry_run: true` and returns exactly what *would* change; the caller must pass an explicit `confirm: true` (after a human approved) to execute. Writes emit an audit record (who, tool, args, result) and implement rollback where the underlying system allows it. Tools where no dry-run is possible require human confirmation at the gateway, always. Annotate honestly: `destructiveHint: true` on anything irreversible.

## Commands

| Task | Command |
|------|---------|
| Install | `bun install` |
| Dev (stdio) | `bun run dev` |
| Serve (HTTP) | `bun run build && bun run start` |
| Test | `bun run test` |
| Lint / Typecheck | `bun run lint` / `bun run typecheck` |
| Security scan | `uvx mcp-scan@latest .mcp.json` (manual until enabled in CI) |

## Owner

Technology Services, Peninsula School District.

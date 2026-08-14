# Tool evals

Every PSD MCP server ships an eval suite for its key tools (07-mcp.md, build standard #6). This directory is the stub — grow it as you add real tools.

## What already exists

Deterministic unit + integration tests live in `src/items.test.ts` (vitest). They call the tool handler directly and over an in-memory MCP transport. That is the CI gate.

## How to add tool evals

Evals answer a different question than unit tests: *does the tool work well when a model drives it?*

1. **Golden cases first.** For each tool, add a `evals/cases/<tool>.json` file: an array of `{ "input": {...}, "expect": {...} }` entries covering the realistic calls a model will make (happy path, pagination continuation, empty result, malformed cursor). Write a small vitest file that loads the cases and runs them through the handler — deterministic, runs in CI.
2. **Model-driven evals second.** When the server has real tools, add scripted agent transcripts: a fixed prompt list a model must complete using only this server (e.g. "find every Chromebook item, then fetch page 2"). Grade with exact assertions on tool-call sequences and final answers, not vibes. Run these on a schedule, not in the merge path — CI stays deterministic (05-testing.md).
3. **Regression rule.** Every bug found in production becomes an eval case before it is fixed.

## Conventions

- Eval inputs/outputs are committed fixtures — no live credentials, no network, no student data.
- An eval that can flake is a unit test that failed its interview: pin inputs, pin expected outputs.

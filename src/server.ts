import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { handleSearch, searchInputShape } from "./items.js";

export const SERVER_INFO = {
  name: "template-mcp-server",
  version: "0.1.0",
} as const;

/**
 * Builds a fresh McpServer. The HTTP entrypoint calls this once per request
 * (stateless streamable HTTP - 07-mcp.md); the stdio dev entrypoint calls it once.
 *
 * Rules for new tools (07-mcp.md):
 * - <= ~15 tools per server; workflow tools, not 1:1 API wrappers.
 * - Names follow psd_<system>_<resource>_<verb>.
 * - readOnlyHint / destructiveHint annotations on EVERY tool - gateways gate
 *   approval flows on them.
 * - Any write tool is dry-run by default with an explicit confirm parameter.
 */
export function buildServer(): McpServer {
  const server = new McpServer(SERVER_INFO);

  server.registerTool(
    "psd_example_items_search",
    {
      title: "Search example items",
      description:
        "Read-only search over the example inventory fixture. Matches a case-insensitive " +
        "substring against item names and descriptions. Results are paginated: pass the " +
        "returned next_cursor to fetch the next page. Use response_format=detailed for " +
        "full records, concise (default) for names only.",
      inputSchema: searchInputShape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async (input) => handleSearch(input),
  );

  return server;
}

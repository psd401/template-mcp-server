import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { buildServer } from "./server.js";

/**
 * Dev-mode entrypoint: `npm run dev` (or the .mcp.json entry) runs the server
 * over stdio for local Claude Code use. Production deployments use the
 * stateless streamable HTTP entrypoint (http.ts).
 */
const server = buildServer();
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("template-mcp-server running on stdio (dev mode)");

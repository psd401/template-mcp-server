import express from "express";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { buildServer } from "./server.js";

/**
 * Stateless streamable HTTP entrypoint (07-mcp.md build standard #1):
 * a fresh McpServer + transport per request, no sessions, no server-side state
 * between calls. State lives in explicit handles returned by tools (cursors).
 *
 * Anything network-exposed must sit behind OAuth 2.1 resource-server auth /
 * the district MCP gateway before deployment - see README.
 */
const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
    enableJsonResponse: true,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request failed:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// Stateless servers hold no session: nothing to resume (GET) or terminate (DELETE).
for (const method of ["get", "delete"] as const) {
  app[method]("/mcp", (_req, res) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed. This server is stateless: POST each request to /mcp." },
      id: null,
    });
  });
}

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
app.listen(port, () => {
  console.log(`template-mcp-server (stateless streamable HTTP) listening on http://localhost:${port}/mcp`);
});

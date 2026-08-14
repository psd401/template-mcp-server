import { z } from "zod";

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Example domain: a tiny read-only inventory. Replace this module with your
 * real data source. The shape of the tool (pagination, response_format,
 * teaching errors) is the part to keep.
 */
export interface ExampleItem {
  id: string;
  name: string;
  category: string;
  description: string;
}

export const EXAMPLE_ITEMS: readonly ExampleItem[] = [
  { id: "item-001", name: "Chromebook cart A", category: "devices", description: "30-unit charging cart, Building 1 library" },
  { id: "item-002", name: "Chromebook cart B", category: "devices", description: "30-unit charging cart, Building 2 commons" },
  { id: "item-003", name: "Document camera", category: "av", description: "Classroom document camera, HDMI output" },
  { id: "item-004", name: "Short-throw projector", category: "av", description: "Wall-mounted short-throw projector" },
  { id: "item-005", name: "USB-C dock", category: "devices", description: "Dual-display USB-C docking station" },
  { id: "item-006", name: "Wireless access point", category: "network", description: "Ceiling-mounted Wi-Fi 6E access point" },
  { id: "item-007", name: "Network switch 48p", category: "network", description: "48-port PoE access switch" },
  { id: "item-008", name: "Interactive display 75in", category: "av", description: "75-inch interactive flat panel" },
  { id: "item-009", name: "Label printer", category: "office", description: "Thermal label printer for asset tags" },
  { id: "item-010", name: "Spare Chromebook", category: "devices", description: "Loaner Chromebook, student checkout pool" },
];

/**
 * Zod raw shape shared by the tool registration (server.ts) and the handler.
 * Every input is validated before it touches any logic.
 */
export const searchInputShape = {
  query: z
    .string()
    .min(1)
    .max(200)
    .describe("Case-insensitive substring matched against item name and description"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(25)
    .default(5)
    .describe("Maximum items per page (1-25). Keep pages small; responses must stay well under client token caps."),
  cursor: z
    .string()
    .optional()
    .describe("Opaque pagination cursor. Pass the next_cursor value from a previous response to fetch the next page."),
  response_format: z
    .enum(["concise", "detailed"])
    .default("concise")
    .describe("concise = item names only (default); detailed = full records with id, category, and description"),
};

const searchInputSchema = z.object(searchInputShape);
export type SearchInput = z.infer<typeof searchInputSchema>;

export interface SearchResult {
  total_matches: number;
  returned: number;
  next_cursor: string | null;
  items: string[] | ExampleItem[];
}

function encodeCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ offset }), "utf8").toString("base64url");
}

function decodeCursor(cursor: string): number {
  let offset: unknown;
  try {
    const payload: unknown = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    offset = (payload as { offset?: unknown }).offset;
  } catch {
    offset = undefined;
  }
  if (typeof offset !== "number" || !Number.isInteger(offset) || offset < 0) {
    // Errors that teach (07-mcp.md): say what was wrong AND what to do instead.
    throw new Error(
      "Invalid cursor. Cursors are opaque values issued by this tool - pass the exact next_cursor string from a previous psd_example_items_search response, or omit cursor to start from the first page.",
    );
  }
  return offset;
}

/** Core search logic, pure and deterministic - the unit under test. */
export function searchExampleItems(input: SearchInput): SearchResult {
  const query = input.query.trim().toLowerCase();
  if (query.length === 0) {
    throw new Error(
      "Empty query. Provide at least one non-whitespace character, e.g. query=\"chromebook\".",
    );
  }

  const matches = EXAMPLE_ITEMS.filter(
    (item) =>
      item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query),
  );

  const offset = input.cursor === undefined ? 0 : decodeCursor(input.cursor);
  const page = matches.slice(offset, offset + input.limit);
  const nextOffset = offset + input.limit;

  return {
    total_matches: matches.length,
    returned: page.length,
    next_cursor: nextOffset < matches.length ? encodeCursor(nextOffset) : null,
    items:
      input.response_format === "detailed" ? page : page.map((item) => item.name),
  };
}

/** MCP tool handler: validates, runs the search, returns teaching errors on failure. */
export function handleSearch(rawInput: unknown): CallToolResult {
  try {
    const input = searchInputSchema.parse(rawInput);
    const result = searchExampleItems(input);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: "text", text: `psd_example_items_search failed: ${message}` }],
    };
  }
}

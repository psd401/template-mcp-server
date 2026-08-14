import { describe, expect, it } from "vitest";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { EXAMPLE_ITEMS, handleSearch, type ExampleItem } from "./items.js";
import { buildServer } from "./server.js";

function parsePayload(result: ReturnType<typeof handleSearch>): {
  total_matches: number;
  returned: number;
  next_cursor: string | null;
  items: string[] | ExampleItem[];
} {
  const first = result.content?.[0];
  if (first?.type !== "text") {
    throw new Error("expected a text content block");
  }
  return JSON.parse(first.text) as ReturnType<typeof parsePayload>;
}

describe("psd_example_items_search handler", () => {
  it("finds items by case-insensitive substring and defaults to concise names", () => {
    const result = handleSearch({ query: "CHROMEBOOK" });

    expect(result.isError).toBeUndefined();
    const payload = parsePayload(result);
    expect(payload.total_matches).toBe(3);
    expect(payload.items).toEqual(["Chromebook cart A", "Chromebook cart B", "Spare Chromebook"]);
    expect(payload.next_cursor).toBeNull();
  });

  it("returns full records when response_format=detailed", () => {
    const result = handleSearch({ query: "label printer", response_format: "detailed" });

    const payload = parsePayload(result);
    expect(payload.items).toEqual([
      {
        id: "item-009",
        name: "Label printer",
        category: "office",
        description: "Thermal label printer for asset tags",
      },
    ]);
  });

  it("paginates with an opaque cursor and never overlaps pages", () => {
    const firstPage = parsePayload(handleSearch({ query: "cart", limit: 1 }));
    expect(firstPage.returned).toBe(1);
    expect(firstPage.total_matches).toBe(2);
    expect(firstPage.next_cursor).not.toBeNull();

    const secondPage = parsePayload(
      handleSearch({ query: "cart", limit: 1, cursor: firstPage.next_cursor ?? "" }),
    );
    expect(secondPage.returned).toBe(1);
    expect(secondPage.next_cursor).toBeNull();
    expect(secondPage.items).not.toEqual(firstPage.items);
    expect([...(firstPage.items as string[]), ...(secondPage.items as string[])].sort()).toEqual(
      ["Chromebook cart A", "Chromebook cart B"],
    );
  });

  it("rejects a forged cursor with an error that teaches the fix", () => {
    const result = handleSearch({ query: "cart", cursor: "not-a-real-cursor" });

    expect(result.isError).toBe(true);
    const first = result.content?.[0];
    expect(first?.type).toBe("text");
    expect(first && "text" in first ? first.text : "").toContain("next_cursor");
  });

  it("rejects invalid input (missing query) instead of guessing", () => {
    const result = handleSearch({ limit: 5 });

    expect(result.isError).toBe(true);
  });
});

describe("MCP server integration (in-memory transport)", () => {
  it("lists the tool with a readOnlyHint annotation and serves a real call", async () => {
    const server = buildServer();
    const client = new Client({ name: "vitest-client", version: "0.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toEqual(["psd_example_items_search"]);
    expect(tools[0]?.annotations?.readOnlyHint).toBe(true);

    const callResult = await client.callTool({
      name: "psd_example_items_search",
      arguments: { query: "access point", response_format: "detailed" },
    });
    const content = callResult.content as Array<{ type: string; text: string }>;
    const payload = JSON.parse(content[0]?.text ?? "{}") as { items: ExampleItem[] };
    expect(payload.items[0]?.id).toBe("item-006");

    await client.close();
    await server.close();
  });
});

describe("fixture sanity", () => {
  it("keeps ids unique so cursors stay stable", () => {
    const ids = EXAMPLE_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

import { describe, expect, it } from "vitest";
import { createApp } from "./index";

describe("worker", () => {
  it("describes every client surface", async () => {
    const response = await createApp().request("https://example.com/");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ endpoints: { api: "/v1", mcp: "/mcp", rss: "/rss/newest" } });
  });

  it("has a health endpoint", async () => {
    const response = await createApp().request("https://example.com/health");
    expect(await response.json()).toEqual({ ok: true, service: "hn-get" });
  });

  it("serves MCP over Streamable HTTP", async () => {
    const response = await createApp().request("https://example.com/mcp", {
      method: "POST",
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
        "mcp-protocol-version": "2025-03-26",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "hn-get-test", version: "1.0.0" },
        },
      }),
    });
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("hn-get");
  });

  it("rejects standalone MCP event streams in stateless mode", async () => {
    const response = await createApp().request("https://example.com/mcp");

    expect(response.status).toBe(405);
    expect(await response.json()).toEqual({ error: "Use POST for stateless Streamable HTTP MCP requests." });
  });
});

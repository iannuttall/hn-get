import assert from "node:assert/strict";
import test from "node:test";
import { createHnMcpServer } from "../dist/index.js";

test("creates a shared MCP server", () => {
  const server = createHnMcpServer();
  assert.ok(server);
});

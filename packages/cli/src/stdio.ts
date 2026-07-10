#!/usr/bin/env node

import { createHnMcpServer } from "@hn-get/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

export async function serveStdioMcp(): Promise<void> {
  const server = createHnMcpServer();
  await server.connect(new StdioServerTransport());
}

import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    cli: "src/cli.ts",
    index: "src/index.ts",
    markdown: "src/markdown.ts",
  },
  clean: true,
  deps: {
    alwaysBundle: ["@hn-get/core", "@hn-get/mcp"],
  },
  dts: true,
  fixedExtension: false,
  format: ["esm"],
  minify: false,
  platform: "node",
  sourcemap: true,
  target: "node24.11",
});

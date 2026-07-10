import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightThemeVintage from "starlight-theme-vintage";

export default defineConfig({
  site: "https://hn-get.iann.workers.dev",
  integrations: [
    starlight({
      title: "hn-get",
      description: "Hacker News data for terminals, agents, apps, and feed readers.",
      favicon: "/favicon.svg",
      lastUpdated: true,
      editLink: {
        baseUrl: "https://github.com/iannuttall/hn-get/edit/main/apps/docs/",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/iannuttall/hn-get",
        },
      ],
      plugins: [starlightThemeVintage()],
      sidebar: [
        {
          label: "Start here",
          items: [
            { label: "Install hn-get", slug: "getting-started" },
            { label: "Use the CLI", slug: "cli" },
          ],
        },
        {
          label: "Connect a client",
          items: [
            { label: "Local and remote MCP", slug: "mcp" },
            { label: "HTTP API", slug: "http-api" },
            { label: "RSS feeds", slug: "rss" },
          ],
        },
        {
          label: "Build hn-get",
          items: [{ label: "Monorepo and development", slug: "development" }],
        },
      ],
    }),
  ],
});

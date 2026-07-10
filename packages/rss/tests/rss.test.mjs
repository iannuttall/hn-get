import assert from "node:assert/strict";
import test from "node:test";
import { renderRss } from "../dist/index.js";

test("renders valid RSS item fields", () => {
  const xml = renderRss({
    title: "Hacker News: Test",
    link: "https://news.ycombinator.com/",
    selfLink: "https://example.com/rss/newest",
    description: true,
    items: [
      {
        id: 1,
        title: "One & Two",
        link: "https://example.com/",
        hnUrl: "https://news.ycombinator.com/item?id=1",
        description: "<p>Hello</p>",
      },
    ],
  });

  assert.match(xml, /<rss version="2.0"/);
  assert.match(xml, /One &amp; Two/);
  assert.match(xml, /<!\[CDATA\[<p>Hello<\/p>/);
});

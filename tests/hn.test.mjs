import assert from "node:assert/strict";
import test from "node:test";
import { buildSearchParams, extractAthingIds, normalizeHnItem } from "../dist/hn.js";
import { htmlFragmentToMarkdown } from "../dist/markdown.js";
import { htmlToPlainText, parseDateishToUnix } from "../dist/utils.js";

test("extractAthingIds handles both common attribute orders and dedupes", () => {
  const html = `
    <tr class="athing submission" id="123"></tr>
    <tr id="456" class="athing"></tr>
    <tr class="athing" id="123"></tr>
  `;

  assert.deepEqual(extractAthingIds(html), [123, 456]);
});

test("buildSearchParams combines safe Algolia filters", () => {
  const params = buildSearchParams({
    query: "sqlite",
    type: "story",
    author: "pg",
    points: 100,
    comments: 10,
    since: "2026-01-01",
    limit: 25,
    page: 2,
  });

  assert.equal(params.get("query"), "sqlite");
  assert.equal(params.get("tags"), "story,author_pg");
  assert.equal(params.get("hitsPerPage"), "25");
  assert.equal(params.get("page"), "2");
  assert.match(params.get("numericFilters") ?? "", /points>=100/);
  assert.match(params.get("numericFilters") ?? "", /num_comments>=10/);
  assert.match(params.get("numericFilters") ?? "", /created_at_i>=/);
});

test("htmlToPlainText decodes HN comment HTML", () => {
  assert.equal(htmlToPlainText("<p>Hello&nbsp;world<p>Second<br>line"), "Hello world\n\nSecond\nline");
});

test("normalizeHnItem includes canonical HN URL and plain text", () => {
  assert.deepEqual(
    normalizeHnItem({
      id: 1,
      type: "story",
      by: "pg",
      time: 0,
      title: "Title",
      text: "<p>Hello&nbsp;HN",
      score: 10,
      descendants: 2,
    }),
    {
      id: 1,
      type: "story",
      title: "Title",
      hnUrl: "https://news.ycombinator.com/item?id=1",
      by: "pg",
      score: 10,
      descendants: 2,
      time: "1970-01-01T00:00:00.000Z",
      timeUnix: 0,
      text: "<p>Hello&nbsp;HN",
      textPlain: "Hello HN",
    },
  );
});

test("parseDateishToUnix handles relative days", () => {
  const now = new Date("2026-06-25T12:00:00.000Z");
  assert.equal(parseDateishToUnix("7d", now), 1_781_784_000);
});

test("htmlFragmentToMarkdown converts HN HTML through Defuddle", async () => {
  assert.equal(
    await htmlFragmentToMarkdown('<p>Hello <a href="https://example.com">world</a><p>Second<br>line'),
    "Hello [world](https://example.com/)\n\nSecond  \nline",
  );
});

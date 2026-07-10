import assert from "node:assert/strict";
import test from "node:test";
import { htmlFragmentToMarkdown } from "../dist/markdown.js";

test("htmlFragmentToMarkdown converts HN HTML through Defuddle", async () => {
  assert.equal(
    await htmlFragmentToMarkdown('<p>Hello <a href="https://example.com">world</a><p>Second<br>line'),
    "Hello [world](https://example.com/)\n\nSecond  \nline",
  );
});

/** Run with `npm test`. Non-JSON replies (timeouts, proxy pages) never throw in the UI. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readJson } from "../src/lib/read-json";

test("readJson returns a friendly error for an HTML 504", async () => {
  const data = await readJson(new Response("<html>timeout</html>", { status: 504 }));
  assert.match(data.error ?? "", /our side/);
});

test("readJson passes JSON through", async () => {
  const data = await readJson(new Response(JSON.stringify({ error: "Nope", code: "X" }), { status: 400 }));
  assert.equal(data.error, "Nope");
});

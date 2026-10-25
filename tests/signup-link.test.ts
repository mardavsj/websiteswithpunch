import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanSiteParam, signupHref } from "../src/lib/signup-link";

test("cleanSiteParam keeps plain hosts and strips scheme/path", () => {
  assert.equal(cleanSiteParam("https://Shop.Example.com/a?b"), "shop.example.com");
  assert.equal(cleanSiteParam(["example.com"]), "example.com");
});

test("cleanSiteParam rejects junk", () => {
  for (const v of ["", "localhost", "<script>", "a b.com", "javascript:alert(1)", 5, undefined]) assert.equal(cleanSiteParam(v), null);
});

test("signupHref carries a clean host only", () => {
  assert.equal(signupHref("example.com"), "/signup?site=example.com");
  assert.equal(signupHref("bad host"), "/signup");
  assert.equal(signupHref(null), "/signup");
});

import test from "node:test";
import assert from "node:assert/strict";
import { scanText } from "../scripts/code-guard.js";

test("detects provider tokens without exposing their values",() => {
  const token = "ghp_" + "A".repeat(30);
  const result = scanText("const value = '" + token + "';","fixture.js");
  assert.equal(result.length,1);
  assert.equal(result[0].rule,"GitHub token");
  assert.ok(!JSON.stringify(result).includes(token));
});

test("detects hard-coded password assignments",() => {
  const result = scanText('const password = "VeryLongCredentialValue123";',"fixture.js");
  assert.equal(result.length,1);
  assert.match(result[0].rule,/Hard-coded/);
});

test("ignores obvious placeholder values",() => {
  assert.equal(scanText('const API_KEY = "replace-me";',"fixture.js").length,0);
});
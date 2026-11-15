import test from "node:test";
import assert from "node:assert/strict";
import { analyze } from "../lib/risk-engine.js";

test("flags OTP and payment pressure", () => {
  const result = analyze("URGENT! Your bank account is blocked. Share OTP now to receive refund.", "message");
  assert.equal(result.level, "HIGH");
  assert.ok(result.findings.some((finding) => finding.signal === "Sensitive verification data"));
});

test("flags suspicious URL characteristics", () => {
  const result = analyze("http://secure-login.xyz/verify", "url");
  assert.ok(result.score >= 40);
  assert.ok(result.findings.some((finding) => finding.signal === "No HTTPS"));
  assert.ok(result.findings.some((finding) => finding.signal === "Suspicious domain suffix"));
});

test("flags code secrets and dangerous execution", () => {
  const result = analyze("const API_KEY = secret; eval(userInput);", "code");
  assert.equal(result.level, "HIGH");
  assert.ok(result.findings.some((finding) => finding.signal === "Credential exposure"));
  assert.ok(result.findings.some((finding) => finding.signal === "Dangerous execution pattern"));
});

test("redacts the value of detected secrets", () => {
  const secret = "sk_live_super_secret_value_123456";
  const result = analyze("const API_KEY = \"" + secret + "\";", "code");
  assert.ok(result.findings.some((finding) => finding.signal === "Credential exposure"));
  assert.ok(!JSON.stringify(result).includes(secret));
});

test("inspects suspicious links embedded in messages", () => {
  const result = analyze("Your parcel is held. Pay now at http://secure-login.xyz/verify", "message");
  assert.ok(result.findings.some((finding) => finding.signal === "Embedded suspicious link"));
});

test("flags private network destinations", () => {
  const result = analyze("http://192.168.1.10/login", "url");
  assert.ok(result.findings.some((finding) => finding.signal === "Local or private destination"));
});

test("rejects non-string input", () => {
  assert.throws(() => analyze({ message: "hello" }, "message"), /plain text/);
});

test("rejects oversized input", () => {
  assert.throws(() => analyze("a".repeat(5001), "message"), /5,000/);
});

test("rejects unsupported analysis types", () => {
  assert.throws(() => analyze("hello", "unknown"), /Unsupported/);
});

test("redacts secrets from links embedded in messages", () => {
  const secret = "supersecret_access_token_123456";
  const result = analyze("Please review https://example.xyz/login?access_token=" + secret, "message");
  assert.ok(result.findings.some((finding) => finding.signal === "Embedded suspicious link"));
  assert.ok(!JSON.stringify(result).includes(secret));
});


test("flags UPI collect requests as potential debits", () => {
  const result = analyze("Approve this UPI collect request and enter your PIN to receive a ₹50,000 refund.", "message");
  assert.equal(result.level, "HIGH");
  assert.ok(result.findings.some((finding) => finding.signal === "UPI collect/payment request"));
  assert.ok(result.recommendations.some((item) => item.includes("UPI PIN")));
});

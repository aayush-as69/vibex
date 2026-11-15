import test from "node:test";
import assert from "node:assert/strict";
import {analyze} from "../lib/risk-engine.js";
test("flags OTP and payment pressure",()=>{const r=analyze("URGENT! Your bank account is blocked. Share OTP now to receive refund.","message");assert.equal(r.level,"HIGH");assert.ok(r.findings.some(x=>x.signal==="Sensitive verification data"));});
test("flags suspicious URL characteristics",()=>{const r=analyze("http://secure-login.xyz/verify","url");assert.ok(r.score>=40);assert.ok(r.findings.some(x=>x.signal==="No HTTPS"));assert.ok(r.findings.some(x=>x.signal==="Suspicious domain suffix"));});
test("flags code secrets and dangerous execution",()=>{const r=analyze("const API_KEY = secret; eval(userInput);","code");assert.equal(r.level,"HIGH");assert.ok(r.findings.length>=2);});
test("rejects oversized input",()=>{assert.throws(()=>analyze("a".repeat(5001),"message"),/5,000/);});
test("rejects unsupported analysis types",()=>{assert.throws(()=>analyze("hello","unknown"),/Unsupported/);});

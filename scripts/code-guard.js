#!/usr/bin/env node
import { readdir,readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SKIP_DIRS = new Set([".git","node_modules",".next",".vercel","coverage","dist","out","build","tests","docs"]);
const SOURCE_EXTENSIONS = new Set([".js",".jsx",".mjs",".cjs",".json",".yml",".yaml",".toml",".ini",".cfg",".py",".go",".java",".ts",".tsx",".sql",".sh"]);
const PROVIDER_RULES = [
  ["GitHub token",/\bgh[pousr]_[A-Za-z0-9]{20,}\b/g],
  ["Stripe secret",/\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/g],
  ["AWS access key",/\bAKIA[0-9A-Z]{16}\b/g],
  ["Google API key",/\bAIza[0-9A-Za-z_-]{35}\b/g],
  ["Slack token",/\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g],
  ["Private key",/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g]
];
const ASSIGNMENT_RULE = /\b(?:api[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token|password|passwd|secret|authorization)\b\s*[:=]\s*(["'\x60])([^"'\x60\r\n]{12,})\1/gi;
const PLACEHOLDER = /^(?:example|placeholder|change[-_ ]?me|replace[-_ ]?me|your[-_ ].*|dummy|fake|redacted|not[-_ ]?real|none|null|undefined|xxx+|test[-_ ]?value)$/i;

function isPlaceholder(value) {
  const normalized = String(value || "").trim();
  return PLACEHOLDER.test(normalized) || normalized.length < 12;
}

export function scanText(source,filePath = "<input>") {
  const findings = [];
  const lines = String(source || "").split(/\r?\n/);
  const add = (lineIndex,rule) => {
    const key = filePath + ":" + (lineIndex + 1) + ":" + rule;
    if (!findings.some((item) => item.key === key)) {
      findings.push({key,file:filePath,line:lineIndex + 1,rule,message:"A possible hard-coded credential was detected. The value is redacted."});
    }
  };
  lines.forEach((line,lineIndex) => {
    for (const [label,pattern] of PROVIDER_RULES) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) add(lineIndex,label);
    }
    ASSIGNMENT_RULE.lastIndex = 0;
    let match;
    while ((match = ASSIGNMENT_RULE.exec(line)) !== null) {
      if (!isPlaceholder(match[2])) add(lineIndex,"Hard-coded " + match[0].split(/\s*[:=]/)[0]);
    }
  });
  return findings;
}

async function listFiles(directory) {
  const found = [];
  const entries = await readdir(directory,{withFileTypes:true});
  for (const entry of entries) {
    const fullPath = path.join(directory,entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) found.push(...await listFiles(fullPath));
      continue;
    }
    if (!entry.isFile()) continue;
    const extension = path.extname(entry.name).toLowerCase();
    const envFile = entry.name.startsWith(".env") && !entry.name.endsWith(".example");
    if (SOURCE_EXTENSIONS.has(extension) || envFile) {
      if (!/\.(?:lock|map)$/i.test(entry.name)) found.push(fullPath);
    }
  }
  return found;
}

export async function scanDirectory(root = process.cwd()) {
  const files = await listFiles(root);
  const findings = [];
  for (const file of files) {
    const content = await readFile(file,"utf8").catch(() => "");
    findings.push(...scanText(content,path.relative(root,file)));
  }
  return {scannedFiles:files.length,findings};
}

async function main() {
  const args = process.argv.slice(2);
  const rootArg = args.find((item) => !item.startsWith("--"));
  const root = path.resolve(rootArg || process.cwd());
  const result = await scanDirectory(root);
  if (args.includes("--json")) process.stdout.write(JSON.stringify(result,null,2) + "\n");
  else {
    console.log("VibeX Code Guard");
    console.log("Scanned " + result.scannedFiles + " source/config files.");
    if (result.findings.length) {
      console.error("\nPossible credential exposures:");
      result.findings.forEach((finding) => console.error("  " + finding.file + ":" + finding.line + " — " + finding.rule + " (value redacted)"));
      console.error("\nBuild blocked. Remove the value and rotate the affected credential.");
    } else console.log("No high-confidence hard-coded credential patterns found.");
  }
  if (result.findings.length) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error("Code Guard failed:",error.message); process.exitCode = 2; });
}
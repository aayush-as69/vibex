#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const isWindows = process.platform === "win32";

function loadEnvFile() {
  for (const name of [".env",".env.local"]) {
    const file = path.join(ROOT,name);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file,"utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || Object.prototype.hasOwnProperty.call(process.env,match[1])) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1,-1);
      process.env[match[1]] = value;
    }
  }
}

function printHelp() {
  console.log([
    "",
    "VibeX Shield — one product, multiple protection modules",
    "",
    "Usage: npm run shield -- <command> [options]",
    "",
    "Commands:",
    "  up [--prod]  Start the dashboard and local sensor agent (when configured)",
    "  doctor       Check runtime, files and optional sensor configuration",
    "  guard        Scan this repository for high-confidence secret patterns",
    "  sensor       Start the authenticated factory sensor agent",
    "  extension    Print Browser Link Guard installation instructions",
    "  help         Show this message",
    "",
    "Examples:",
    "  npm run shield -- doctor",
    "  npm run shield -- up",
    "  npm run shield -- up --prod",
    "  npm run shield -- guard",
    ""
  ].join("\n"));
}

function runOne(command,args) {
  return new Promise((resolve) => {
    const child = spawn(command,args,{cwd:ROOT,env:process.env,stdio:"inherit",shell:isWindows});
    child.on("error",(error) => {
      console.error("Unable to start command:",error.message);
      resolve(1);
    });
    child.on("exit",(code,signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}

async function runStack(production) {
  const children = [];
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    for (const child of children) if (!child.killed) child.kill("SIGTERM");
  };

  const npm = isWindows ? "npm.cmd" : "npm";
  console.log(production ? "Starting VibeX Shield production dashboard..." : "Starting VibeX Shield development dashboard...");
  const app = spawn(npm,["run",production ? "start" : "dev"],{cwd:ROOT,env:process.env,stdio:"inherit",shell:isWindows});
  children.push(app);
  app.on("error",(error) => {
    console.error("Dashboard failed to start:",error.message);
    stop();
    process.exitCode = 1;
  });
  app.on("exit",(code) => {
    if (!stopping) {
      process.exitCode = code ?? 0;
      stop();
    }
  });

  if (process.env.SENSOR_API_TOKEN && process.env.SENSOR_API_TOKEN.length >= 24) {
    const sensor = spawn(process.execPath,[path.join(ROOT,"sensor-agent","server.js")],{cwd:ROOT,env:process.env,stdio:"inherit"});
    children.push(sensor);
    sensor.on("error",(error) => console.error("Sensor agent failed to start:",error.message));
    sensor.on("exit",(code) => {
      if (!stopping && code && code !== 0) console.error("Sensor agent stopped with exit code",code);
    });
    console.log("Factory Sensor Agent is enabled.");
  } else {
    console.log("Factory Sensor Agent is optional. Set SENSOR_API_TOKEN (24+ characters) in .env.local to enable it.");
  }

  console.log("Browser Link Guard is included in browser-extension/; install it once in Chrome or Edge.");
  console.log("Press Ctrl+C to stop the VibeX Shield services.");
  process.on("SIGINT",() => { stop(); process.exitCode = 0; });
  process.on("SIGTERM",() => { stop(); process.exitCode = 0; });
  await new Promise((resolve) => {
    if (app.exitCode !== null) resolve();
    else app.once("exit",resolve);
  });
}

function doctor() {
  const checks = [
    ["Node.js 20+",Number(process.versions.node.split(".")[0]) >= 20],
    ["Next.js app",existsSync(path.join(ROOT,"app","page.js"))],
    ["Browser Link Guard",existsSync(path.join(ROOT,"browser-extension","manifest.json"))],
    ["Code Guard",existsSync(path.join(ROOT,"scripts","code-guard.js"))],
    ["Factory Sensor Agent",existsSync(path.join(ROOT,"sensor-agent","server.js"))],
    ["Automatic protection guide",existsSync(path.join(ROOT,"docs","AUTOMATIC_PROTECTION.md"))]
  ];
  let failed = false;
  console.log("\nVibeX Shield system check\n");
  for (const [label,ok] of checks) {
    console.log((ok ? "  [OK] " : "  [MISSING] ") + label);
    if (!ok) failed = true;
  }
  const tokenReady = Boolean(process.env.SENSOR_API_TOKEN && process.env.SENSOR_API_TOKEN.length >= 24);
  console.log((tokenReady ? "  [READY] " : "  [OPTIONAL] ") + "Factory sensor token " + (tokenReady ? "configured" : "not configured"));
  if (failed) process.exitCode = 1;
  else console.log("\nCore product files are present. Run npm run shield -- up to launch.");
}

async function main() {
  loadEnvFile();
  const [command = "help",...args] = process.argv.slice(2);
  switch (command) {
    case "up":
      await runStack(args.includes("--prod"));
      break;
    case "doctor":
      doctor();
      break;
    case "guard":
      process.exitCode = await runOne(process.execPath,[path.join(ROOT,"scripts","code-guard.js"),ROOT]);
      break;
    case "sensor":
      process.exitCode = await runOne(process.execPath,[path.join(ROOT,"sensor-agent","server.js")]);
      break;
    case "extension":
      console.log("\nBrowser Link Guard is included at:");
      console.log("  " + path.join(ROOT,"browser-extension"));
      console.log("\nOpen chrome://extensions or edge://extensions, enable Developer mode, choose Load unpacked and select that folder.");
      break;
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    default:
      console.error("Unknown VibeX Shield command: " + command);
      printHelp();
      process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error("VibeX Shield command failed:",error.message);
  process.exitCode = 1;
});
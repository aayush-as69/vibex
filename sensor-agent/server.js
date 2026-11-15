import { createHash,timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateSensorSample } from "../lib/sensor-guard.js";

const HOST = process.env.SENSOR_HOST || "127.0.0.1";
const PORT = Number(process.env.SENSOR_PORT || 4318);
const TOKEN = process.env.SENSOR_API_TOKEN || "";
const MAX_BODY = 8192;
const historyBySensor = new Map();
const recentAlerts = [];

function sendJson(response,status,payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status,{"content-type":"application/json; charset=utf-8","content-length":Buffer.byteLength(body),"cache-control":"no-store","x-content-type-options":"nosniff"});
  response.end(body);
}

function authorized(request) {
  const header = request.headers.authorization || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  const expectedHash = createHash("sha256").update(TOKEN).digest();
  const suppliedHash = createHash("sha256").update(supplied).digest();
  return supplied.length > 0 && timingSafeEqual(expectedHash,suppliedHash);
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY) {
      const error = new Error("Telemetry body exceeds 8 KB.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch {
    const error = new Error("Telemetry body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

export function createSensorServer() {
  return createServer(async (request,response) => {
    const pathname = new URL(request.url || "/","http://localhost").pathname;
    if (request.method === "GET" && pathname === "/health") return sendJson(response,200,{ok:true,service:"vibex-sensor-agent",status:"operational"});
    if (!authorized(request)) return sendJson(response,401,{ok:false,error:"A valid Bearer token is required."});
    if (request.method === "GET" && pathname === "/alerts") return sendJson(response,200,{ok:true,alerts:recentAlerts});
    if (request.method !== "POST" || pathname !== "/telemetry") return sendJson(response,404,{ok:false,error:"Route not found."});

    try {
      const payload = await readJson(request);
      const key = String(payload.sensorId || "") + ":" + String(payload.metric || "").toLowerCase();
      const history = historyBySensor.get(key) || [];
      const assessment = evaluateSensorSample(payload,history);
      history.push(assessment);
      if (history.length > 20) history.shift();
      historyBySensor.set(key,history);
      if (assessment.alerts.length) {
        recentAlerts.unshift(assessment);
        if (recentAlerts.length > 100) recentAlerts.pop();
      }
      if (assessment.status === "ALERT") console.warn("[VibeX SENSOR ALERT]",assessment.sensorId,assessment.metric,assessment.value,assessment.unit,assessment.alerts.map((item) => item.code).join(", "));
      else if (assessment.status === "WARNING") console.warn("[VibeX SENSOR WARNING]",assessment.sensorId,assessment.metric,assessment.alerts.map((item) => item.code).join(", "));
      return sendJson(response,200,{ok:true,assessment});
    } catch (error) {
      return sendJson(response,error.statusCode || 400,{ok:false,error:error.message || "Unable to assess telemetry."});
    }
  });
}

export function startSensorAgent() {
  if (TOKEN.length < 24) throw new Error("Set SENSOR_API_TOKEN to a unique value of at least 24 characters before starting the sensor agent.");
  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) throw new Error("SENSOR_PORT must be a valid TCP port.");
  const server = createSensorServer();
  server.listen(PORT,HOST,() => {
    console.log("VibeX sensor agent listening on http://" + HOST + ":" + PORT);
    console.log("Authenticated telemetry endpoint: POST /telemetry");
    console.log("Limits live in lib/sensor-guard.js. This agent alerts; it does not actuate machinery.");
  });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { startSensorAgent(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
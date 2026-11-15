import { NextResponse } from "next/server";
import { analyze } from "../../../lib/risk-engine.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 30000) {
      return NextResponse.json(
        { ok: false, error: "Request body is too large. Keep analysis input under 5,000 characters." },
        { status: 413, headers: { "Cache-Control": "no-store" } }
      );
    }

    const rawBody = await request.text();
    if (rawBody.length > 30000) {
      return NextResponse.json(
        { ok: false, error: "Request body is too large. Keep analysis input under 5,000 characters." },
        { status: 413, headers: { "Cache-Control": "no-store" } }
      );
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Request body must be valid JSON." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { ok: false, error: "Request body must be a JSON object." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const result = analyze(body.input, body.type);
    return NextResponse.json(
      { ok: true, result },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message || "Unable to analyze input." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}

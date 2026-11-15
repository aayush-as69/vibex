import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const token = process.env.SENSOR_API_TOKEN || "";
  if (token.length < 24) {
    return NextResponse.json({
      ok:true,online:false,reason:"not_configured",alerts:[],
      message:"Add SENSOR_API_TOKEN to .env.local and launch the local product to connect the factory agent."
    },{headers:{"Cache-Control":"no-store"}});
  }
  const portValue = Number(process.env.SENSOR_PORT || 4318);
  const port = Number.isInteger(portValue) && portValue > 0 && portValue <= 65535 ? portValue : 4318;
  try {
    const response = await fetch("http://127.0.0.1:" + port + "/alerts",{
      headers:{Authorization:"Bearer " + token},cache:"no-store",signal:AbortSignal.timeout(1200)
    });
    if (!response.ok) throw new Error("Sensor agent unavailable.");
    const data = await response.json();
    return NextResponse.json({
      ok:true,online:true,reason:null,alerts:Array.isArray(data.alerts) ? data.alerts.slice(0,8) : [],
      message:"Connected to the local factory sensor agent."
    },{headers:{"Cache-Control":"no-store"}});
  } catch {
    return NextResponse.json({
      ok:true,online:false,reason:"offline",alerts:[],
      message:"The sensor agent is not reachable on this machine. Start VibeX Shield with SENSOR_API_TOKEN configured."
    },{headers:{"Cache-Control":"no-store"}});
  }
}
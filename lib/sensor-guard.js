export const SENSOR_LIMITS = {
  temperature:{unit:"C",min:-20,max:120,maxStep:25},
  vibration:{unit:"mm/s",min:0,max:40,maxStep:12},
  pressure:{unit:"bar",min:0,max:25,maxStep:6},
  humidity:{unit:"%",min:0,max:100,maxStep:25},
  rpm:{unit:"rpm",min:0,max:60000,maxStep:15000},
  current:{unit:"A",min:0,max:500,maxStep:100}
};
const SENSOR_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/;

export function evaluateSensorSample(sample,history = [],limits = SENSOR_LIMITS) {
  if (!sample || typeof sample !== "object" || Array.isArray(sample)) throw new Error("Telemetry must be a JSON object.");
  const sensorId = String(sample.sensorId || "").trim();
  const metric = String(sample.metric || "").trim().toLowerCase();
  const value = Number(sample.value);
  if (!SENSOR_ID.test(sensorId)) throw new Error("sensorId must be 1–64 safe characters.");
  if (!Object.prototype.hasOwnProperty.call(limits,metric)) throw new Error("Unsupported sensor metric: " + metric);
  if (!Number.isFinite(value)) throw new Error("Sensor value must be a finite number.");
  const rule = limits[metric];
  const timestamp = sample.timestamp ? new Date(sample.timestamp) : new Date();
  if (Number.isNaN(timestamp.getTime())) throw new Error("timestamp must be a valid date.");
  const alerts = [];
  if (value < rule.min) alerts.push({code:"BELOW_RANGE",severity:"HIGH",message:metric + " fell below the configured safe range (" + rule.min + " " + rule.unit + ")."});
  if (value > rule.max) alerts.push({code:"ABOVE_RANGE",severity:"HIGH",message:metric + " exceeded the configured safe range (" + rule.max + " " + rule.unit + ")."});
  if (sample.unit && String(sample.unit).toLowerCase() !== rule.unit.toLowerCase()) alerts.push({code:"UNIT_MISMATCH",severity:"MEDIUM",message:"Expected unit " + rule.unit + " but received " + String(sample.unit) + "."});
  const previous = [...history].reverse().find((item) => item.sensorId === sensorId && item.metric === metric);
  if (previous) {
    const previousTime = new Date(previous.timestamp).getTime();
    const elapsed = timestamp.getTime() - previousTime;
    const delta = Math.abs(value - Number(previous.value));
    if (elapsed >= 0 && elapsed <= 900000 && delta > rule.maxStep) {
      alerts.push({code:"SUDDEN_CHANGE",severity:"HIGH",message:metric + " changed by " + Number(delta.toFixed(2)) + " " + rule.unit + " since the previous sample."});
    }
  }
  return {sensorId,metric,value,unit:rule.unit,timestamp:timestamp.toISOString(),status:alerts.some((item) => item.severity === "HIGH") ? "ALERT" : alerts.length ? "WARNING" : "NORMAL",alerts};
}
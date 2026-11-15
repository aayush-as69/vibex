import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSensorSample } from "../lib/sensor-guard.js";

test("accepts a normal factory sensor reading",() => {
  const result = evaluateSensorSample({sensorId:"press-01",metric:"temperature",value:62,unit:"C"});
  assert.equal(result.status,"NORMAL");
  assert.equal(result.alerts.length,0);
});

test("alerts when a sensor exceeds its safe range",() => {
  const result = evaluateSensorSample({sensorId:"press-01",metric:"temperature",value:135,unit:"C"});
  assert.equal(result.status,"ALERT");
  assert.ok(result.alerts.some((item) => item.code === "ABOVE_RANGE"));
});

test("detects a sudden change from a recent sample",() => {
  const history = [{sensorId:"motor-02",metric:"vibration",value:4,timestamp:"2026-11-15T10:00:00.000Z"}];
  const result = evaluateSensorSample({sensorId:"motor-02",metric:"vibration",value:24,timestamp:"2026-11-15T10:01:00.000Z"},history);
  assert.equal(result.status,"ALERT");
  assert.ok(result.alerts.some((item) => item.code === "SUDDEN_CHANGE"));
});

test("rejects unsupported metrics and unsafe sensor identifiers",() => {
  assert.throws(() => evaluateSensorSample({sensorId:"bad id",metric:"temperature",value:25}),/sensorId/);
  assert.throws(() => evaluateSensorSample({sensorId:"motor-1",metric:"unknown",value:25}),/Unsupported/);
});

test("warns when the reported unit is incorrect",() => {
  const result = evaluateSensorSample({sensorId:"motor-1",metric:"temperature",value:42,unit:"bar"});
  assert.equal(result.status,"WARNING");
  assert.ok(result.alerts.some((item) => item.code === "UNIT_MISMATCH"));
});
# VibeX Shield — Automatic Protection Modules

VibeX Shield is one product containing the web dashboard, browser extension, CI code scanner and factory telemetry agent. Install dependencies once and use the unified launcher for local services. See the [Product Guide](PRODUCT_GUIDE.md) for first-run setup, commands and packaging.

## Unified local startup

After installing dependencies, run:

```bash
npm run shield -- up
```

This starts the dashboard and starts the sensor agent if `SENSOR_API_TOKEN` is configured in `.env.local`. The browser extension is installed once in Chrome/Edge; Code Guard is integrated into GitHub Actions.

## 1. Browser Link Guard

**What it does:** A Chrome/Edge Manifest V3 extension locally inspects HTTP(S) links, highlights suspicious destinations and intercepts clicks when the local risk score crosses the warning threshold. The user sees the reasons and chooses to go back or continue.

**Install:**

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
3. Enable Developer mode.
4. Choose **Load unpacked** and select the `browser-extension` folder.
5. Reload the websites you want protected.

The extension checks URL structure locally. It does not send browsing history, page contents or links to a VibeX server.

**Limitations:** It does not intercept links inside all native apps, inspect phone calls, scan UPI screens in payment apps or prove a destination is malicious/safe. The heuristic is an early warning.

## 2. Code Guard

Run the repository scanner locally through the product launcher:

```bash
npm run shield -- guard
```

The CI workflow runs the same scan on pushes and pull requests. A high-confidence provider token, private key or hard-coded credential assignment fails the check. Output includes file and line but never prints the secret value.

If a real credential is exposed, remove it from source, rotate/revoke it at the provider and review recent usage. The scanner cannot rotate credentials or automatically rewrite arbitrary code.

## 3. Factory Sensor Agent

The standalone Node.js agent accepts JSON telemetry from a local gateway and checks configured metric ranges and sudden changes. Default limits are in `lib/sensor-guard.js`; adjust them to the actual machine's approved engineering limits before use.

**PowerShell (Windows):**

```powershell
$env:SENSOR_API_TOKEN = "use-a-unique-random-token-at-least-24-characters"
npm run shield -- sensor
```

**macOS/Linux:**

```bash
SENSOR_API_TOKEN='use-a-unique-random-token-at-least-24-characters' npm run sensor:agent
```

The agent binds to `127.0.0.1:4318` by default. To accept a gateway on another host, set `SENSOR_HOST` explicitly, use a strong unique token, apply firewall restrictions and terminate TLS at a trusted network boundary. Do not expose this service directly to the public internet.

**Send a test reading:**

```bash
curl -X POST http://127.0.0.1:4318/telemetry \
  -H "Authorization: Bearer $SENSOR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sensorId":"press-01","metric":"temperature","value":135,"unit":"C"}'
```

Supported metrics: `temperature`, `vibration`, `pressure`, `humidity`, `rpm` and `current`. `GET /health` is public; `GET /alerts` requires the Bearer token. Recent samples and alerts are held in memory only.

**Safety boundary:** The agent detects and reports telemetry anomalies. It does not send stop commands to a PLC, override machine controls or replace a safety-rated interlock. Any physical shutdown path must be designed and validated separately by a qualified controls engineer.

## 4. Voice-clone and UPI scams

The message analyzer identifies UPI collect/payment requests, requests to enter a UPI PIN to receive money, OTP requests and suspicious embedded links. It explains why the wording is risky.

A browser website or ordinary extension cannot reliably authenticate a live phone caller's voice or capture call audio in the background. AI voice-spoof detection requires a dedicated anti-spoof model, consent-based audio integration and telephony/device permissions. VibeX Shield must not label a voice as AI-generated without that evidence. For urgent money requests, hang up and call the known family member back using a saved number.

## 5. Deployment

- Deploy the web console to Vercel or another Next.js host.
- Install the browser extension separately in each managed browser.
- Run Code Guard in GitHub Actions on every pull request.
- Run the Sensor Agent on a secured factory gateway/edge computer, not inside Vercel serverless functions.
- Keep all service tokens outside the repository.

These modules provide defensive warnings and build gates; they are not full endpoint protection, call interception or autonomous machine shutdown.
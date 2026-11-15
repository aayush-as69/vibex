# VibeX Shield — Product Guide

VibeX Shield is shipped as one JavaScript product with a shared dashboard, launcher, browser extension, CI code scanner and optional local factory sensor service.

## Requirements

- Node.js 20 or later
- npm
- Chrome or Edge only if you want the browser extension
- A machine or gateway that can send JSON telemetry only if you want factory monitoring

## Install once

```bash
git clone https://github.com/aayush-as69/vibex.git
cd vibex
npm install
```

## Configure the optional sensor service

Copy `.env.example` to `.env.local`. Generate a private token:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Paste it as `SENSOR_API_TOKEN` in `.env.local`. Keep `.env.local` private and untracked. The sensor agent is optional; leave the token blank to skip it.

## Start the whole local product

```bash
npm run shield -- up
```

The launcher starts the Next.js dashboard and starts the sensor agent too when a valid token is configured. Open http://localhost:3000. The dashboard polls the local sensor agent and shows whether it is connected and whether recent alerts exist.

Stop all local services with Ctrl+C.

To launch the production build locally:

```bash
npm run build
npm run shield -- up --prod
```

## Product commands

| Command | Result |
|---|---|
| `npm run shield -- doctor` | Checks required files/runtime and optional sensor configuration |
| `npm run shield -- guard` | Runs Code Guard against the repository |
| `npm run shield -- sensor` | Starts only the sensor agent |
| `npm run shield -- extension` | Prints browser extension installation steps |
| `npm test` | Runs all automated tests |
| `npm run lint` | Runs ESLint |
| `npm run build` | Creates the production dashboard build |

## Enable Browser Link Guard

1. Run `npm run shield -- extension` for the local folder path.
2. Open chrome://extensions or edge://extensions.
3. Enable Developer mode.
4. Choose **Load unpacked**.
5. Select `browser-extension/`.

This extension is part of the same product package but is installed once in the browser. It checks HTTP(S) links locally and interrupts high-risk link clicks with a warning.

## Code Guard and CI

Code Guard is part of the standard CI workflow. The CI pipeline runs tests, `npm run guard`, lint and the production build. A supported high-confidence hard-coded credential pattern fails the workflow. The scanner reports file and line without printing the secret.

## Factory Sensor Agent

Default bind address: `127.0.0.1:4318`.

- `GET /health` — service health
- `POST /telemetry` — submit a sensor sample (Bearer token required)
- `GET /alerts` — retrieve recent alerts (Bearer token required)

Supported metrics are temperature, vibration, pressure, humidity, RPM and current. Default limits in `lib/sensor-guard.js` are examples only; calibrate them to real equipment specifications and validated operating envelopes before connecting production machinery.

The agent reports abnormalities. It does not operate PLCs, stop machinery or replace safety-rated interlocks. Keep it on a protected local network. If it must listen beyond loopback, use a firewall and TLS termination at a trusted network boundary.

## Deploying the dashboard

The Next.js dashboard can be deployed to Vercel. The local Factory Sensor Agent is not a Vercel serverless service: keep it on the factory gateway or local edge machine and run the dashboard locally when the sensor status needs to be bridged through the loopback API. A public Vercel dashboard will show the sensor as not configured/offline unless a separate authenticated gateway integration is deliberately deployed.

## Build a single release archive

GitHub Actions contains a **Package VibeX Shield** workflow. Run it manually from Actions or push a version tag such as `v1.0.0`. It verifies tests, Code Guard, lint and build, then creates one source ZIP containing the dashboard and all protection modules. Version tags also publish a GitHub Release with the ZIP attached.

## Product boundaries

- Browser Link Guard is heuristic and cannot inspect all native mobile apps or phone calls.
- UPI collect/PIN-to-receive wording is detected in analyzed messages; native payment-app interception is not included.
- Voice-clone detection requires a validated audio anti-spoof model and native/consent-based call-audio integration.
- Code Guard detects supported credential patterns; it is not a complete SAST/SCA engine and does not autonomously fix arbitrary vulnerabilities.
- Factory sensor alerts are advisory; no machine actuation is performed.

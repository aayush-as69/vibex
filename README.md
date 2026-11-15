<div align="center">

# VibeX Shield

### Pause before you click, pay, share, or run.

A defensive cyber-safety workspace for inspecting suspicious links, scam messages, and risky code — with explainable, deterministic risk analysis.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Track](https://img.shields.io/badge/Track-3%20Cyber%20Safety-0b7b9e)](#)

[Overview](#overview) · [Features](#features) · [How it works](#how-it-works) · [Quick start](#quick-start) · [Documentation](#documentation)

</div>

---

## Overview

People regularly receive links, messages, payment requests, OTP prompts, and code snippets that can look legitimate at first glance.

VibeX Shield is designed around the few seconds between **receiving something suspicious** and **acting on it**.

It gives users one place to inspect content, understand the signals behind the assessment, and choose a safer next step.

> **Inspect → Understand → Decide**

The project is intentionally defensive: it does not execute submitted code, does not fetch submitted URLs server-side, and does not depend on an external AI model for its core risk assessment.

---

## Features

### 🔗 Link Scanner

Inspect suspicious URLs and surface signals such as:

- Insecure HTTP usage
- Common URL shorteners
- Suspicious domains and TLD patterns
- URL obfuscation such as @ and punycode
- Credential, payment, and lure language
- Other high-risk URL patterns

### 💬 Scam Message Check

Analyze SMS, chat, or email-style messages for:

- Urgency and pressure tactics
- OTP, PIN, CVV, and banking references
- Payment and financial-action requests
- Reward, lottery, and cashback lures
- Impersonation language
- Account-pressure and verification scams
- UPI collect/PIN-to-receive wording and related debit risk

### 🛡️ Code Guard

Review pasted code defensively and identify:

- Hard-coded credentials and secrets
- Dangerous execution patterns
- Insecure HTTP requests
- Disabled TLS verification
- Risky browser credential access

### 📊 Explainable Risk

Every analysis produces:

- A **0–100 risk score**
- **Low / Medium / High** severity
- Individual findings behind the score
- Practical next-step recommendations
- Deterministic, repeatable results
- Bounded input validation

Supported text files can also be imported directly in the browser. Imported content is read locally and is not uploaded as a file.

---

## Automatic Protection

VibeX Shield also includes three deployable defensive components:

| Module | Purpose | Runtime |
|---|---|---|
| **Browser Link Guard** | Warns about suspicious links and interrupts high-risk clicks | Chrome / Edge extension |
| **Code Guard** | Scans source/config files for high-confidence hard-coded credentials | Local Node.js + GitHub Actions |
| **Factory Sensor Agent** | Checks authenticated sensor readings against configured limits and sudden-change rules | Local factory gateway / edge computer |

See the [Automatic Protection Guide](docs/AUTOMATIC_PROTECTION.md) for setup, commands, telemetry examples, and safety boundaries.

### Safety boundaries

- Browser Link Guard is heuristic and runs locally.
- The sensor agent reports anomalies; it does **not** stop machinery or operate a PLC.
- Voice-clone verification is not included; that requires a dedicated audio anti-spoof model and native call/audio integration.
- The message analyzer is advisory and should not be treated as a guarantee that a message is malicious or safe.

---

## How It Works

~~~mermaid
flowchart LR
    U[Browser] --> UI[Next.js + React UI]
    UI --> API[Analyze API]
    API --> V[Input Validation]
    V --> E[Deterministic Risk Engine]
    E --> F[Findings + Score + Severity]
    F --> UI
~~~

The core MVP follows a local-first pipeline:

1. The user submits a link, message, or code snippet.
2. The Next.js API validates the request.
3. The deterministic JavaScript risk engine evaluates known patterns.
4. Findings are generated from explicit rules.
5. Findings are converted into a risk score and severity.
6. The UI presents the evidence and recommended next steps.

### Why deterministic analysis?

The first safety layer is deliberately:

- **Fast** — no external model call is required.
- **Explainable** — every finding is tied to an explicit rule.
- **Predictable** — identical input produces the same assessment.
- **Safer by design** — submitted code is never executed and submitted URLs are not fetched server-side.

This architecture leaves room for future intelligence layers without making the core safety path dependent on an external model.

---

## Risk Model

| Severity | Score | Interpretation |
|---|---:|---|
| **Low** | 0–39 | No major high-confidence warning pattern detected. |
| **Medium** | 40–69 | One or more meaningful warning signals detected. |
| **High** | 70–100 | Multiple or high-impact risk signals detected. |

The score is an **advisory signal**, not proof that content is safe or malicious.

---

## Product Experience

The main workspace is built around a short decision loop:

1. Choose **Link Scanner**, **Scam Message Check**, or **Code Guard**.
2. Paste or enter the content to inspect.
3. Load a safe demo example when presenting the project.
4. Run the analysis.
5. Review the score, findings, and recommendations.
6. Clear the current session history when needed.

The goal is not to produce a long security report. It is to answer three practical questions quickly:

> **What looks risky? Why does it matter? What should I do next?**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 |
| UI | React 19 |
| Language | JavaScript / ES2022 |
| Icons | Lucide React |
| Analysis | Deterministic JavaScript rules engine |
| API | Next.js Route Handler |
| Styling | CSS |
| Testing | Node.js built-in test runner |
| Linting | ESLint |
| Browser protection | Chrome / Edge Manifest V3 extension |
| Local protection | Node.js launcher + sensor agent |
| CI | GitHub Actions |
| Deployment | Next.js-compatible host for dashboard; local gateway for sensor agent |

---

## Quick Start

### Requirements

- **Node.js 20+**
- npm
- Git

### 1. Clone and install

~~~bash
git clone https://github.com/aayush-as69/vibex.git
cd vibex
npm install
~~~

### 2. Optional: configure the Factory Sensor Agent

Copy the example environment file:

~~~bash
cp .env.example .env.local
~~~

Generate a private sensor token:

~~~bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
~~~

Add the generated value to <code>.env.local</code>:

~~~env
SENSOR_API_TOKEN=your_generated_token
~~~

Keep <code>.env.local</code> private and never commit secrets.

The dashboard and other protection modules work without the sensor token. Factory monitoring is optional.

### 3. Start the product

~~~bash
npm run shield -- up
~~~

Open **http://localhost:3000**.

Press **Ctrl+C** to stop the services.

---

## Commands

| Command | Purpose |
|---|---|
| <code>npm run shield -- up</code> | Start the dashboard and configured local sensor service |
| <code>npm run shield -- up --prod</code> | Start the production dashboard and configured sensor service |
| <code>npm run shield -- doctor</code> | Check the installed product |
| <code>npm run shield -- guard</code> | Run Code Guard |
| <code>npm run shield -- sensor</code> | Start only the Factory Sensor Agent |
| <code>npm run shield -- extension</code> | Show browser-extension installation steps |
| <code>npm run guard</code> | Run Code Guard directly |
| <code>npm test</code> | Run the automated test suite |
| <code>npm run lint</code> | Run ESLint |
| <code>npm run build</code> | Create a production build |
| <code>npm run dev</code> | Start the Next.js development server |

For the production dashboard, run <code>npm run build</code> before <code>npm run shield -- up --prod</code>.

---

## Browser Link Guard

Install the extension once:

~~~bash
npm run shield -- extension
~~~

Then:

1. Open <code>chrome://extensions/</code> or <code>edge://extensions/</code>.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select the repository's <code>browser-extension</code> directory.

The extension is included in the same repository and release package as the main dashboard.

---

## Demo Walkthrough

For a short project demonstration:

1. Open **VibeX Shield**.
2. Select **Scam Message Check**.
3. Load the demo example.
4. Run the analysis.
5. Explain the score and individual findings.
6. Switch to **Link Scanner** and inspect a suspicious URL.
7. Switch to **Code Guard** and demonstrate a risky code snippet.
8. Show the automatic protection modules if they are configured.

The strongest demo focuses on the reasoning behind the result:

**signal → risk → safer action**

---

## Repository Structure

~~~text
vibex/
├── app/
│   ├── api/
│   │   ├── analyze/        # Analysis API
│   │   ├── health/         # Health endpoint
│   │   └── sensors/        # Sensor-agent alert proxy
│   ├── error.js            # Runtime error boundary
│   ├── globals.css         # Global application styling
│   ├── layout.js           # Root layout and metadata
│   └── page.js             # Main Shield workspace
│
├── bin/
│   └── vibex.js             # Unified product launcher
├── browser-extension/       # Chrome / Edge Manifest V3 Link Guard
├── sensor-agent/
│   └── server.js            # Authenticated Factory Sensor Agent
│
├── lib/
│   ├── risk-engine.js       # Deterministic cyber-risk engine
│   └── sensor-guard.js      # Sensor limits and anomaly rules
├── scripts/
│   └── code-guard.js        # Credential/secret scanner
│
├── tests/
│   ├── code-guard.test.js
│   ├── risk-engine.test.js
│   └── sensor-guard.test.js
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── AUTOMATIC_PROTECTION.md
│   ├── BUILD_PLAN.md
│   ├── PRODUCT_GUIDE.md
│   └── SECURITY.md
│
├── .github/workflows/       # CI and release workflows
├── next.config.mjs          # Security headers
├── eslint.config.mjs
├── package.json
└── .env.example
~~~

---

## Documentation

| Topic | Documentation |
|---|---|
| Product setup and operation | [Product Guide](docs/PRODUCT_GUIDE.md) |
| System architecture | [Architecture](docs/ARCHITECTURE.md) |
| Browser + factory protection | [Automatic Protection](docs/AUTOMATIC_PROTECTION.md) |
| Security boundaries | [Security](docs/SECURITY.md) |
| Development and planning notes | [Build Plan](docs/BUILD_PLAN.md) |

The README provides the fast path. The <code>docs/</code> directory contains the deeper implementation and operational details.

---

## Testing & Quality

Run the complete local checks before opening a pull request:

~~~bash
npm test
npm run guard
npm run lint
npm run build
~~~

GitHub Actions runs the project's automated checks on pushes and pull requests to <code>main</code>.

Security-sensitive behavior should be covered by tests, and documentation should be updated whenever product behavior or safety boundaries change.

---

## Security & Privacy

VibeX Shield is a defensive analysis tool. It is **not** a replacement for professional security tooling, malware analysis, threat intelligence, or incident response.

The current MVP intentionally:

- Does not execute submitted code.
- Does not make server-side requests to submitted URLs.
- Does not persist submitted analysis content.
- Applies bounded input validation.
- Uses explicit deterministic rules for its core analysis layer.
- Treats scores and recommendations as advisory.
- Keeps imported text-file processing in the browser.

### Current limitations

Before production use at larger scale, the project should consider:

- Rate limiting and abuse controls
- Stronger threat-intelligence integration
- Broader accessibility and end-to-end coverage
- Dependency monitoring
- Isolated URL reputation/fetching infrastructure if remote inspection is introduced
- Additional privacy-aware telemetry controls

---

## Contributing

1. Keep the project defensive and explainable.
2. Never execute user-submitted code as part of analysis.
3. Keep external integrations isolated from the core safety engine.
4. Add tests for security-sensitive behavior.
5. Update documentation when behavior changes.
6. Never commit API keys, credentials, tokens, or real user data.
7. Keep changes focused and easy to review.

---

## Acknowledgements

Built for **VibeX Codes — Track 3: Cyber Safety**.

VibeX Shield is designed as a practical, explainable safety layer for everyday users — helping them pause, inspect suspicious content, understand the warning signals, and make a safer decision.

---

<div align="center">

### VibeX Shield

**Inspect. Understand. Decide.**

</div>

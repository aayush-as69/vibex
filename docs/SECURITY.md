# Security Notes

- Input is capped at 5,000 characters.
- The API validates the analysis type and rejects unsupported types.
- No user input is executed by the rules engine.
- The MVP does not fetch submitted URLs server-side, preventing SSRF in this stage.
- Analysis text is sent only to this application's own Next.js API route; the application does not persist submitted messages or code.
- Imported text files are read in the browser, and only their text content is sent when the user starts an analysis.
- Downloadable reports include findings and recommendations but intentionally omit the submitted payload.
- API responses use `Cache-Control: no-store`; request bodies are rejected above the route's safety limit.
- High-impact security actions are advisory and require user confirmation.

## Before production

Add authentication where appropriate, rate limiting, structured audit logging with privacy controls, abuse monitoring, secret management, CSP/security headers, dependency scanning and an isolated URL reputation/fetching service if remote content analysis is introduced.

## Automatic modules

- The browser extension evaluates link URLs in the browser and sends no page data to an external service. Its results are heuristic and may miss new or targeted phishing pages.
- Code Guard fails on supported high-confidence credential patterns. It is not a complete SAST/SCA scanner and cannot rotate credentials.
- The sensor agent requires a Bearer token of at least 24 characters, defaults to binding on `127.0.0.1`, limits JSON telemetry bodies to 8 KB and stores a bounded recent history in memory. If binding to another host, restrict access with a firewall and use TLS at the network boundary.
- Sensor alerts are advisory outputs. The agent does not actuate or shut down machinery; connect to safety-rated interlocks only through a separately designed and validated control system.
- The project does not detect AI-cloned phone voices or intercept native UPI/payment apps. Do not claim these capabilities until the required anti-spoof model and native integrations are implemented and evaluated.

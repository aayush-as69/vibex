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
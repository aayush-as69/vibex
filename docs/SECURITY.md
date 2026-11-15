# Security Notes

- Input is capped at 5,000 characters.
- The API validates the analysis type and rejects unsupported types.
- No user input is executed by the rules engine.
- The MVP does not fetch submitted URLs server-side, preventing SSRF in this stage.
- The product does not store submitted messages or code.
- High-impact security actions are advisory and require user confirmation.

## Before production

Add authentication where appropriate, rate limiting, structured audit logging with privacy controls, abuse monitoring, secret management, CSP/security headers, dependency scanning and an isolated URL reputation/fetching service if remote content analysis is introduced.
# VibeX Shield Architecture

Browser -> Next.js UI -> /api/analyze -> deterministic rules engine -> structured findings -> UI risk card.

The first detection layer is local and deterministic. This keeps the MVP fast, explainable and usable without an external AI provider.

## Detection categories

- URL: HTTPS, shortened domains, suspicious TLDs, punycode, obfuscation and credential/payment lure patterns.
- Messages: urgency, financial requests, OTP/PIN/CVV requests, action prompts, reward lures and authority/account impersonation.
- Code: credential exposure, command/script execution patterns, insecure HTTP and disabled TLS verification.

## Planned AI layer

An optional LLM classifier can be added after the rules engine. It must return structured JSON, cite the evidence it used, and never override a deterministic high-confidence security finding.
# VibeX Shield — Build Plan

## Chosen track
Track 3: Cyber Safety — protecting citizens, shops and factories from scams. The official guide asks for an automatic security shield and rewards real working technology, simplicity, safety and a live demo.

## Phase 0 — Foundation
- [x] JavaScript Next.js application shell
- [x] Security-first visual language
- [x] README and build plan

## Phase 1 — Working MVP
- [x] Unified dashboard
- [x] URL risk scanner
- [x] Scam-message analyzer
- [x] Code-risk analyzer
- [x] Explainable risk score and detected signals
- [x] Server-side analysis API
- [x] Input validation and 5,000-character limit
- [x] Demo examples
- [x] Session history
- [x] Responsive judge/demo UI
- [x] Automated rules-engine tests
- [x] UPI collect-request and PIN-to-receive detection
- [x] Chrome/Edge browser link guard with click warning
- [x] CI secret scanner for high-confidence credential patterns
- [x] Authenticated factory sensor telemetry agent with threshold and sudden-change alerts
- [x] Browser-side text-file import (up to 5,000 characters)
- [x] Complete in-session history restoration
- [x] Copyable findings and privacy-conscious text report export
- [x] API request-size and JSON validation with no-store responses

## Phase 2 — Real detection engine
- [ ] URL reputation and redirect analysis through an isolated service
- [ ] Native mobile UPI/payment-app interception and consent-based call/audio integration
- [ ] Model-based voice-spoof detection with measured false-positive and false-negative rates
- [ ] OCR for screenshots of scam messages and QR payment requests
- [ ] Optional LLM-assisted classification with structured JSON output
- [ ] Confidence + evidence scoring
- [ ] Hindi + English explanations
- [ ] Threat-intelligence enrichment

## Phase 3 — Protection workflows
- [ ] Browser/share-sheet check flow
- [ ] Malicious-link warning/block page
- [x] Findings and recommendation report export (submitted payload excluded)
- [ ] Rate limiting, abuse protection and privacy-aware audit logs
- [ ] Account/session controls if cloud persistence is introduced

## Phase 4 — Advanced security
- [ ] AI-generated voice-scam indicators
- [ ] Repository secret and dependency scanning
- [ ] Safe remediation suggestions with human approval
- [ ] Security headers, CSP and production hardening

## Phase 5 — Submission polish
- [ ] End-to-end tests
- [ ] Accessibility audit
- [ ] Production deployment
- [ ] 8–10 slide PPT
- [ ] 2–3 minute live demo video
- [ ] Architecture diagram
- [ ] Honest limitations and threat model

## Judge demo
1. Open Scam Message Check.
2. Load the built-in banking/OTP scam example.
3. Run analysis and show the HIGH risk score.
4. Walk through the evidence and safe next steps.
5. Switch to Link Scanner and show a suspicious HTTPS/domain example.
6. Switch to Code Guard and show exposed credentials + dangerous execution.
7. Finish on the architecture and explain why the first layer is deterministic and explainable.

## Guardrails
The product is defensive. It must never automate credential theft, exploit execution, malware delivery or unauthorized access. Detection is advisory; high-impact actions require user confirmation.

## Automatic protection status

- Browser Link Guard is a heuristic extension; its high-risk click warning can be bypassed by the user.
- Code Guard blocks CI when supported high-confidence secret patterns are found; it does not rotate credentials.
- Sensor Agent raises telemetry alerts only. It does not control PLCs or safety interlocks.
- Voice-clone audio authentication and native UPI-app interception are not implemented in this web/extension MVP.

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

## Phase 2 — Real detection engine
- [ ] URL reputation and redirect analysis through an isolated service
- [ ] OCR for screenshots of scam messages and QR payment requests
- [ ] Optional LLM-assisted classification with structured JSON output
- [ ] Confidence + evidence scoring
- [ ] Hindi + English explanations
- [ ] Threat-intelligence enrichment

## Phase 3 — Protection workflows
- [ ] Browser/share-sheet check flow
- [ ] Malicious-link warning/block page
- [ ] One-tap report and evidence export
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
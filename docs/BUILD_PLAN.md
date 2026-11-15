# VibeX Shield — Build Plan

## Chosen track
Track 3: Cyber Safety — protecting citizens, shops and factories from scams. The official guide asks for an automatic security shield and rewards real working technology, simplicity, safety and a live demo.

## Phase 0 — Foundation
- [x] Create JavaScript Next.js application shell
- [x] Establish security-first visual language
- [x] Add README and build plan

## Phase 1 — Demo MVP
- [x] Unified dashboard
- [x] URL risk scanner
- [x] Scam-message analyzer
- [x] Code-risk analyzer
- [x] Explainable risk score and detected signals
- [x] Mobile-friendly UI

## Phase 2 — Real detection engine
- [ ] URL reputation + redirect analysis
- [ ] OCR for screenshots of scam messages / QR payment requests
- [ ] LLM-assisted classification with structured JSON output
- [ ] Local rules engine before any external AI call
- [ ] Confidence, evidence and safe-action recommendations

## Phase 3 — Protection workflows
- [ ] Browser/share-sheet check flow
- [ ] Malicious-link quarantine / block page
- [ ] One-tap report and evidence export
- [ ] User-safe explanations in Hindi + English
- [ ] Rate limiting, audit logs and abuse protection

## Phase 4 — Advanced security
- [ ] AI-generated voice scam indicators
- [ ] Secret scanning and dependency risk for repositories
- [ ] Safe remediation suggestions with human approval
- [ ] Threat-intelligence integrations

## Phase 5 — Submission polish
- [ ] End-to-end tests
- [ ] Accessibility audit
- [ ] Production deployment
- [ ] 8–10 slide PPT
- [ ] 2–3 minute live demo video
- [ ] Honest limitations and architecture diagram

## Demo story
1. User receives a suspicious payment message.
2. User pastes it into Scam Message Check.
3. Shield highlights urgency + payment/OTP language.
4. User sees a clear risk score and safe next action.
5. Repeat with a suspicious URL and exposed API key in code.

## Guardrails
The product is defensive. It should never automate credential theft, exploit execution, malware delivery, or unauthorized access. Detection should be explainable and high-impact actions should require user confirmation.

# Verification report — 15 October 2026

## Passed checks

- **187/187 Node.js automated tests**, including **108 distinct synthetic customer scenarios** (36 Russian, 36 Latvian, 36 English). An additional 48 typo and safety checks cover missing letters, swapped letters, unrelated words, ambiguous corrections and sourced API responses. Full individual results: `test-results.txt`; prompts/expectations: `docs/scenarios.json`.
- **3/3 workerd runtime tests**: the 108 scenarios execute against the actual compiled Worker with a real SQLite-backed Durable Object; concurrent reservations cannot exceed the configured cap; a new runtime instance reads the previously exhausted budget. Full results: `runtime-results.txt`.
- Wrangler **deployment dry-run passed**: Worker bundle and static assets validated. This is not a production deployment and consumes no OpenAI API calls.
- `npm run build`: 22 trilingual answer cards, 8 source references validated; static assets prepared.
- Portable standalone reference demo generated; embedded JavaScript syntax checked. It contains no OpenAI call or secret key.

## Covered failure modes

Origin/Content-Type/method validation, oversized streamed body, malformed JSON, 1,001-character input, unsupported locale, unknown tenant/prototype names, forged session cookies, login throttling, missing secrets, missing durable guard, rate limits, provider errors/exceptions/refusals/truncation, malicious provider output, forced escalation, parallel reservations, daily budget, lifetime budget and restart persistence.

Scenario coverage includes standard policies, language pairs, uncertain delivery dates, opened packaging, unclaimed parcels, business warranty conflicts, duplicate payments, complaints, cancellation requests, human requests, off-topic questions, injection attempts and synthetic sensitive data.

## Not yet verified

- **Live model routing accuracy**: integration tests inject mocked provider responses; keyword routing is tested separately. These results are not an AI answer-quality score.
- **Live OpenAI API connectivity, account balance, token usage, latency or billing**: no key or paid request used.
- **Production Cloudflare deployment**: not performed. Source repository: https://github.com/Shyn1x/anete-support-demo. Cloudflare configuration and live API authorisation remain required.
- **Visual browser/device QA**: not performed in this environment. Responsive CSS and semantics are implemented, but appearance and interactive behavior need a real mobile/desktop browser review.
- **Human inbox delivery**: intentionally absent. The demo shows contact details and a copyable category summary, and explicitly says no request was sent.

Before a client-facing AI demo, authorise deployment, configure a restricted key without exposing it, visually review RU/LV/EN on mobile and desktop, and run at least 50 live-model cases against the same knowledge version. Keep the $0.50 daily reservation limit: 50 live calls require at least two UTC days. Record actual outputs, expected card IDs, handoff decisions and any regressions. Do not present this prerequisite as already completed.

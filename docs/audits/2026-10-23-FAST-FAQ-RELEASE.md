# Faster explicit FAQs and actionable return instructions

## Customer-facing change

Plain questions such as “How can I pay?”, “Какие способы доставки есть?” and “Vai pasūtījumu var saņemt uz vietas, un kur?” now receive the selected shop’s existing approved answer without waiting for OpenAI. This removes a provider round trip for that bounded class of questions. It does not establish a measured live response-time target.

The recognizer matches the entire message and cross-checks a single policy ID chosen by the existing router. Additional conditions, product names/links, multiple topics, complaints, employee requests, safety issues, simplification requests and review-required cards keep their existing processing. History does not become factual evidence. A fresh explicit payment question can intentionally change topic and language after a product discussion.

Authentication, tenant isolation, UTF-8/input/history validation and privacy/injection checks run first. Free responses still consume a normal message-rate slot. They reserve no API budget and remain available when the paid budget is exhausted. No budgets, namespace identifiers, counters, credentials or deployments are changed.

Ceļotājs return answers now include the verified shop email, instructions to put the item/order number in the email rather than the demo chat, guidance to agree the return method, and a warning that product exceptions apply. The address and procedural text are server-owned, derived from the merchant policy fetched on 23 October (source hash in `2026-10-23-other-shops-review.json`). They cannot be supplied by user history or a generated contact detail. The next step appears on fast, accepted-generation and safe-fallback return replies, once per reply.

Catalog generation no longer receives the same quote choices twice. Every literal excerpt, product binding, evidence ref, structured schema and validation guard remains. The captured small comparison fixture shrinks by 292 UTF-8 bytes per request (about 4.9%). This is a payload reduction, not a measured provider speed gain. No model, retry, timeout or output-limit changes.

## Validation

- Node: 2469/2469.
- workerd with real local SQLite Durable Objects: 29/29.
- Python runner: 7/7.
- Owner and five isolated client builds passed.
- Owner and five client deployment dry runs passed. No live deployment.
- No paid API calls. All provider responses in tests were synthetic; outbound traffic was intercepted.
- New coverage checks all six tenants in three languages, adversarial near-matches, zero reservations, rate limiting at the cap, input/privacy/isolation ordering, current-language switching, accepted/rejected return prose and unchanged catalog evidence.

Existing provider/security tests now use qualified questions outside the new whole-message shortcut. They still assert one provider attempt, retained reservation, safe validation/fallback and no secret leakage. Dedicated new tests assert that simple FAQs use zero provider attempts. Failed intermediate test logs are retained locally; the final test results above are not altered live-audit scores.

The previous four-shop raw audit and prior Apavi live results are unchanged. No historical result was rerated. Earlier Apavi LV/EN comparison rejections remain a known limitation; no rejected prose was reconstructed and no factual guard was weakened.

## Installation and publication

Use the existing `scripts/prepare-live-audit-update.mjs --release FULL_IMMUTABLE_COMMIT_SHA` from the Windows ZIP project directory. It downloads byte-checked source files, stages and validates them, preserves UTF-8, creates backups, leaves reports/configs/secrets untouched and produces a receipt. The final response supplies the exact SHA.

Preparation does not deploy or call OpenAI. After reviewing the successful receipt and separate publication approval, use the existing publisher with that exact receipt and `--confirm-publish`. It validates all six existing Workers, uses keep_vars and preserves the shared budget identity. No manual file edits or new dependencies are needed.

After publication, check the public configs for `fastFaqRevision: fast-faq-v1`, then one simple FAQ to confirm the path. A matching FAQ under this release has `fastReply: true` and `providerUsed: false`; a typo or additional condition may take the ordinary paid path, so do not launch a broad live suite without a separately agreed scope.

An independent limited demo can be presented honestly with these boundaries. These offline checks are not a production-readiness certification or measured live latency. Windows files have not been changed from this environment.

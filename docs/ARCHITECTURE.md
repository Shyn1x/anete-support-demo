# Architecture and safety boundaries

Browser → same-origin Worker → atomic BudgetGuard Durable Object → OpenAI Responses API → allowlisted card IDs → server-owned trilingual answer text and source URLs.

The AI is an intent router. It never writes customer-facing policy text. It may choose the wrong approved card; that remaining risk needs live model evaluations. JSON-schema enforcement alone does not establish semantic correctness. Replies are assembled from `src/kb.js`; provider-authored strings and URLs are discarded.

The independent demonstration is visibly labelled in all three languages. It has no shop account, order, payment, CRM or email integration. Human handoff is simulated: contact details and a copyable category summary are displayed, with an explicit statement that no ticket was created. No automatic external communication occurs.

## Abuse and cost controls

- Fixed allowlisted OpenAI model; provider tools and web search are absent. `store:false`, no conversation storage or provider history ID.
- 1,000-character input; streamed request capped at 4,096 bytes; classifier request capped at 32,000 UTF-8 bytes; output limited to 160 tokens.
- A real API key alone cannot enable AI: `AI_ENABLED=true`, a 12+ character demo password, a 32+ character session signing secret and a Durable Object binding are also required. Missing guard/configuration fails closed.
- HttpOnly, SameSite=Strict signed session cookies expire after two hours; Secure on HTTPS. Exact Origin check; no permissive CORS. No raw API-key or password values in client bundles or repository.
- HMAC-derived client IP identifiers rotate daily. Chat rate: 10/minute and 100/day/IP. Login attempts: 5/minute/IP. The IP is never used as user authentication. Shared networks may hit limits together; distributed abuse can still exhaust the small global budget.
- A single namespace/object holds the global experiment budget across tenants. Atomic durable reservations occur before provider calls, with no automatic retries or refunds. $0.02 is reserved for each attempt, including timeouts. Default maximum: $0.50/day and $5 lifetime (25/day and 250 lifetime attempts). Lower limits are supported; environment values cannot raise these source-enforced ceilings.
- The $0.02 reserve is a conservative application accounting bound for this fixed model and bounded text request at the documented token prices. It is NOT a provider account spending cap or a control over other apps, taxes, exchange rates, future price changes or malicious administrator changes. Reverify prices before enabling AI. Use a dedicated OpenAI project/key and provider spending controls too.
- Never rename the `experiment-v1` guard ID, delete its data, or create a new budget namespace to evade/reset the cap. Redeployment preserves the same namespace and lifetime counter. First migration provisions SQLite-backed storage for Workers Free.
- No transcript persistence, analytics or intentional prompt logging. Worker observability is disabled by default. Cloudflare/OpenAI still apply their own service logging and retention policies; `store:false` is not a promise of zero data retention.
- Email-like strings, long numeric identifiers, payment labels and some injection patterns are blocked before sending to OpenAI. Pattern matching cannot detect every name or address. Do not enter real customer data; the UI warns about this. Production needs a privacy review and stronger data handling.
- Rendering uses DOM textContent, allowlisted source host, CSP and restricted static paths. No arbitrary URL retrieval, uploads, HTML rendering or model-triggered actions.

## Additional companies

Add a new tenant with its own approved answer cards, languages, sources and review date in `src/kb.js`, then expose it deliberately through configuration/UI. Tenant IDs must pass the registry allowlist. AI requests receive only that tenant's catalog; rendering uses only that tenant's cards. Default experiment budget remains global. `referenceRoute` currently contains Anete-specific fallback patterns and must be extracted/configured for each new company; this is not yet a complete multi-tenant SaaS.

## Test boundaries

The reference router corrects unambiguous single-character typos in a small policy-word dictionary, including adjacent transpositions. It also recognises Latvian words without diacritics. Short tokens and ambiguous matches are left unchanged. This is not a general spellchecker; meaning and arbitrary misspellings still require live AI evaluation. Raw-input safety checks run before routing.

Unit/API tests use an injected mocked provider and cannot establish live OpenAI intent accuracy, account access, latency or actual billing. Runtime tests use Cloudflare workerd and SQLite Durable Objects locally. Neither establishes a production deployment. Browser layout and mobile-device behavior require a visual review. Live model evaluation is opt-in and must never run by default in CI.

## Conversation layer

Before provider classification, a bounded whole-message grammar composes approved social phrases. All tokens must be consumed, so gratitude cannot mask a subsequent issue. Unmatched input goes through the existing bounded API classifier, whose enum now includes seven `dialogue:` intents in addition to policy IDs. The model still cannot author customer-visible text. The parser rejects mixing dialogue and policy IDs or setting handoff on a social selection. Policy-specific forced human review remains intact. Unknown input may ask clarification without automatic handoff. The UI retains the previous topic across social/clarification turns. There is no full conversation transcript or open-ended chat memory.

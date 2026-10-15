# Support remains available when AI reserve is exhausted

2026-10-15. No monetary ceiling is raised and no persisted spending is cleared. The USD 0.50 ordinary daily reservation and USD 5 lifetime reservation remain shared across all shops. The dated evaluation allowance is unchanged. No payments or provider calls were made by this update's tests.

When an AI reservation is rejected specifically for exhausted budget, the Worker re-enters the message gate without an AI reservation. Only if that rate check succeeds does it render the existing tenant-scoped reference route. The response uses approved server-owned texts and sources; providerUsed=false, mode=reference and fallbackReason identify it. Unknown text asks clarification; sensitive cases retain existing human-review rules. The fallback does not apply to authentication failures, service/guard errors or message-rate rejection, and makes no provider request. No provider retries or budget refunds were added.

The guard now distinguishes minute_rate, day_rate, daily_budget and total_budget. Rate errors include the appropriate reset timestamp and Retry-After. Client messages show a specific localized wait reason rather than conflating every HTTP 429 with cost. AI-reserve exhaustion no longer blocks ordinary verified FAQ responses, but actual message-rate limits remain enforced. This does not extend the AI allowance: unusual wording may require a simpler question until the allowance is available.

Validation: 713 Node tests and 8 workerd checks, including a runtime test with outbound network intercepted, exhaustive-budget FAQ in RU/LV/EN, unchanged stored reservation counters, unknown-question clarification and enforced message caps. Five client static builds verified.

Deployment: the owner Worker receives its guard update through the connected GitHub build. Client sites require a local Wrangler update. Run `node scripts/update-limit-fallback.mjs <release-commit>` after downloading that script from the same verified commit. It downloads four allowlisted source files, builds and updates the five existing clients. It does not read or rotate passwords/API keys and does not reset counters.

# Live audit: five client demos, 50 requests

Run `node scripts/run-live-50.mjs` with Node 22+ in a terminal. No dependency installation or deployment is required. Enter each client's demo password when prompted (hidden input). Never enter the OpenAI API key. Passwords are used only for login; cookies stay in memory.

The runner sends ten requests to each of Bariba, Hobbyset, Apavi 40+, Rotallieta and Celotajs. Coverage: delivery, contextual follow-up, RU → EN language switching, Latvian returns, typo in warranty, a shop-specific product question, an upset customer with a damaged parcel, explicit employee request, friendly closing, prompt injection. First three requests form a dialogue; the rest have fresh context. No messages or tickets are sent to the shops.

Up to 35 calls should use conversational OpenAI generation. The other 15 test deterministic contact, social and safety routes. With the current $0.01 per-call reservation this needs up to $0.35 of available reservation, within existing daily and total caps. Actual OpenAI charges differ from reservations. The script never changes budgets, adds credits or retries paid calls automatically. Allow approximately 7–10 minutes. A seven-second gap precedes each chat request to respect the existing message limit.

Results are saved incrementally in `reports/live-50.json`, including full synthetic questions, answers, source links and preliminary assessments. Use the same command to resume. A second path argument selects a different report, for example `node scripts/run-live-50.mjs reports/another-run.json`; doing so starts a new run and can spend another reserve. Keep the default to continue an existing run.

On a budget/rate/auth refusal the unprocessed case is left for resumption. On a network ambiguity or interruption a pending/ambiguous case is retained and never silently repeated. It needs human review; the remaining suite can resume. A provider/validation fallback stops the run and remains a failed completed case; diagnose it before doing any further live run. Ctrl+C stops immediately; already checkpointed results remain on disk.

`generatedAI` requires providerUsed=true, conversational=true and mode=ai. A paid attempt or a reference fallback does not count as generation. The assessor checks language metadata, expected topics, handoff, source hosts and response presence, but cannot certify factual accuracy or naturalness. Inspect the full replies for unsupported facts, repeated canned prose, inappropriate employee referrals, unsafe advice and language mistakes before outreach. Auto-pass alone is insufficient.

The report contains no credentials or request headers. Check answers before sharing the report because they contain provider-generated text. No real customer data is used.

## Local validation

`node --test test/live-50.test.mjs`: 9/9 passed on 2026-10-16, using mocked network responses. This validates runner behavior, not live demo quality. The 50 live requests must be run with the user's local demo passwords and available budget. Full repository suite: `npm test`, 1326/1326 passed. No live OpenAI calls were made while preparing the runner.

# Natural grounded replies — 16 October 2026

## What changes

AI_CONVERSATIONAL=true enables a single Responses API request that both selects approved evidence IDs and writes a short answer in the user's current language. Policy cards remain internal evidence; the user receives question-specific prose rather than a concatenation of those cards. Source links are still rendered by the server. Greeting, thanks, explicit contact requests, blocked/PII messages and unverified live-stock cases retain appropriate deterministic handling without an unnecessary paid call. Verified niche questions and product clarifications can use the conversational path. The product-page reader and media flow retain their existing safeguards and output formats.

The browser sends at most four recent messages, each capped at 400 characters. History is held in memory only and cleared on reset/language reset; it is not stored in localStorage or on the server. Sensitive/injected history entries are removed before the provider request. History, including previous assistant prose, is explicitly untrusted context, not evidence. Old clients without history remain compatible. Public configuration exposes conversationEnabled for deployment checks.

## Guards and limits

- One provider attempt and one existing USD 0.01 reservation per attempted text reply, with no retries/refunds/reset/increased caps.
- Request body to the provider capped at 22,000 UTF-8 bytes, output at 400 tokens, store:false. The incoming /api/chat JSON body is bounded at 12,000 bytes and history shape is validated before spending.
- Server retains the approved-ID, product-model and mandatory human-review rules. It generates source links and handoff notices itself.
- Invalid output, incomplete/refused response, wrong language, unknown numeric values, unapproved links, apparent PII, action-completion claims and several explicit stock/fit/delivery promises fall back to verified reference text. Provider failures also fall back without another paid attempt.
- These are mechanical safeguards, NOT a semantic entailment proof. A fluent paraphrase could still omit a condition or contradict source meaning without triggering a lexical check. Live human review is mandatory before declaring these demos ready for outreach. Structured JSON does not guarantee factual accuracy.

GPT-4.1 mini is retained for compatibility, not migrated silently. Official pricing checked on 16 October 2026: USD 0.40/M input and USD 1.60/M output. Conservative text estimate: (22,000 bytes + 512 overhead) treated as tokens * 0.40/M + 400 * 1.60/M = USD 0.0096448, within the existing USD 0.01 reserve. This is an engineering estimate, not a billing guarantee. Daily/lifetime budget guards and historical counters are unchanged. The model is marked deprecated; evaluate migration as a separate tested release.

Official references:
- https://developers.openai.com/api/docs/models/gpt-4.1-mini
- https://developers.openai.com/api/docs/guides/structured-outputs (including its warning that outputs can still contain mistakes)

## Update from the owner's existing project folder

Download scripts/update-conversation.mjs from the exact release commit, then run `node scripts/update-conversation.mjs <release-commit>`. The updater fetches all required sources first, builds isolated clients and publishes the owner Worker followed by all five clients with AI_ENABLED, CATALOG_ENABLED and AI_CONVERSATIONAL=true. It leaves existing configuration files, secrets, namespaces and counters in place. No API keys/passwords need to be pasted. If Wrangler requires authorization, use its normal login flow. A partial deployment stops; the failed site is identified and completed sites are not rolled back automatically.

## Live acceptance after deployment

Check /api/config on all six hosts: correct tenant, ready=true, locked=true, mode=ai, conversationEnabled=true. This does not itself verify the provider key or answer quality.

After password login, test each client in RU/LV/EN with misspellings, a specific general policy question, a short follow-up, a language switch, a mixed thanks-and-question, an unknown product attribute and an explicit human request. Verify the actual text against source conditions; do not rely only on topic/source/language checks. For a generated text answer, the API returns conversational=true. A reference fallback must not be counted as a successful generated answer. Keep exports free of passwords, keys and real customer data. Existing budget limits may pause paid testing; do not raise or reset them implicitly.

Validation: 1,222 Node tests (including 50 new conversational contract/safety cases and browser-history coverage), five isolated builds and 12 workerd integration tests. Current automated validation uses controlled provider fixtures, not real paid model calls. It verifies contracts and safeguards, not live model answer quality. No mail has been sent.

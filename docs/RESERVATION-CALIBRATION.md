# Reservation calibration — 2026-10-15

New attempts reserve USD 0.01 instead of USD 0.02. This is a conservative application estimate, not an OpenAI invoice or a credit balance. Historical reservations remain unchanged; no state migration, refund or reset is performed.

The normal daily cap remains USD 0.50 (now up to 50 provider attempts, shared by all six tenants). The lifetime ceiling remains USD 5.00. The previous fixed-date USD 0.90 allowance for 2026-10-15 is unchanged and expires at midnight UTC. An already exhausted daily cap stays exhausted until rollover. No additional payment or external API call was performed for this change.

GPT-4.1 mini standard text pricing checked at https://developers.openai.com/api/docs/models/gpt-4.1-mini : USD 0.40 per million input tokens, USD 1.60 per million output tokens. The model is marked deprecated; migration should be evaluated separately, with repeat quality and budget checks before switching.

Budget sizing uses a deliberately conservative estimate: entire serialized request capped at 23,000 UTF-8 bytes, plus a 512-token overhead allowance, and at most 160 output tokens. Counting each request byte as an input token gives (23,000 + 512) × USD 0.40 / 1,000,000 + 160 × USD 1.60 / 1,000,000 = USD 0.0096608, below USD 0.01. This is an engineering estimate, not a provider billing guarantee. It assumes current text-only model, no tools, no retained conversation and no retries. Review it if model, pricing, schema or prompt changes. Full body includes JSON and schema, making the byte estimate intentionally generous. Oversized prompts are rejected before reserving money or contacting the provider.

The supplied dashboard screenshot showed USD 0.09 actual spend for 70 requests, while previous app reservations were USD 1.40. Do not turn this historical average into a hard per-request cost promise, and do not use it to rewrite prior counters.

Validation: 676 Node tests and 6 real workerd checks, including concurrent SQLite budget enforcement. No paid API requests used in this validation. Public store contact emails rechecked against their official HTML on 2026-10-15; five private outreach drafts prepared, not sent.

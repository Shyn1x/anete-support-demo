# Experiment costs

Checked 15.10.2026. No subscriptions, credit purchases or top-ups were made. Billable OpenAI requests executed by this task: **0**.

| Component | Free use relevant to the prototype | Limit / next step |
|---|---|---|
| Local/portable reference demo | No service account or API use | Node.js local server or standalone HTML |
| GitHub | Free repositories; Free account includes 2,000 Actions minutes/month and 500 MB Actions storage | Account's shared remaining quota is not checked; no paid overages authorised |
| Cloudflare Workers Free | 100,000 requests/day, 10 ms CPU/request | Stay Free; no custom domain needed |
| SQLite Durable Objects on Free | 100,000 requests/day, 13,000 GB-s/day, 5M row reads/day, 100k row writes/day, 5 GB total storage | Limits are shared/account-dependent; excess on Free fails rather than selecting a paid subscription |
| OpenAI `gpt-4.1-mini` | No assumed free API allowance | $0.40 per million input tokens; $1.60 per million output tokens, standard text rates |

Sources:

- https://developers.openai.com/api/docs/models/gpt-4.1-mini
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://docs.github.com/en/billing/reference/product-usage-included

Example estimate, not measured usage: at 4,000–8,000 input tokens and 80 output tokens, one classification costs about $0.001728–$0.003328. Fifty classifications would cost about $0.0864–$0.1664; 250 about $0.432–$0.832. Real tokenization, model rates and account conditions may differ. The response text itself is server-owned, so the AI output is short. No embeddings, vector database, web-search tool or paid support platform is used.

The code reserves $0.02 before each attempted classification, with a default ceiling of $0.50/day and $5 lifetime. This allows at most 25 attempts/day and 250 lifetime attempts. The reservation is intentionally higher than expected cost and includes failed attempts; it is not the provider invoice. No retry, auto-top-up or automatic cap reset is implemented. To complete 50 **live** AI scenarios under the default daily limit, use at least two UTC days; do not secretly raise the limit to run them in one day.

Amounts above are USD before any applicable taxes or currency conversion. The user's €20 experiment budget remains unspent by this task; no exact EUR bill is promised. An API account may require a separate prepaid purchase before requests work, which needs explicit approval. Use a dedicated project/key and provider-side spending controls. Application caps do not cover calls made elsewhere with the same key, changed vendor prices or hosting upgraded by an account owner.

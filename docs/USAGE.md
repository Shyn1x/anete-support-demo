# Read-only demo usage inspection

Open https://anete-support-demo.fshyn1x.workers.dev/usage and use the existing demo password/session. GET /api/usage requires a configured password and valid signed demo cookie. It reads the existing experiment-v1 Durable Object through an internal status route.

The response contains reservation totals, effective daily/lifetime caps, remaining attempted provider calls and current connection message caps. The USD values are conservative application reservations ($0.01 per attempted AI request), not provider invoice usage, remaining OpenAI credit or evidence of a charge. All six stores share the counters. UTC day/minute rollover is reported explicitly; lifetime usage never resets.

No state is written by status requests, including at UTC day rollover. No raw IP address, HMAC identifier, per-IP registry, cookie, password or API key is returned. Current-connection rate counters may differ between devices/networks. Viewing the page makes no provider call and cannot bypass an exhausted cap. Login retains the existing authentication attempt protection.

Validation on 2026-10-15: 673 Node tests passed, including seven read-only usage regressions; six workerd/SQLite checks passed, including authenticated status reads. No cap increases, counter resets or financial actions. The production counter values still require an authenticated read; no values have been inferred from screenshots or the owner's top-up amount.

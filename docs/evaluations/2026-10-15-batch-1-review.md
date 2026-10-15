# Live evaluation — batch 1

Reviewed 15 October 2026 from the user-exported `anete-live-results-5.json` (exported 11:58:02 UTC). **5/50 cases completed, all five manually accepted for the tested questions.** No unresolved attempts in this batch. This is not an overall model accuracy estimate.

| Case | Language | Subject | Review |
| --- | --- | --- | --- |
| 01 | RU | Delivery options | Correct concise options, locker prepayment and size caveat; relevant delivery source; no unnecessary human referral. |
| 02 | LV | Delivery options | Correct Latvian equivalent, same source and caveats; no unnecessary referral. |
| 03 | EN | Delivery options | Correct English equivalent; no invented cost or guaranteed date. |
| 04 | RU | Warranty, with “гарнтия” and “тавар” typos | Correct warranty intent and Russian answer. Does not conflate a fixed manufacturer guarantee with consumer nonconformity rights. |
| 05 | LV | Warranty | Correct Latvian answer; directs product-specific guarantee duration to product description and preserves the distinction in the source. |

All output text exactly matches the current approved answer card in the requested language. Relevant sources re-opened during review:

- https://anete.lv/piegades-informacija/6/1/i — courier, collection in Riga, Omniva/DPD, prepaid locker delivery and size/weight restrictions.
- https://anete.lv/garantija/7/1/i — manufacturer duration varies by product; product description gives the duration; page separately discusses two-year consumer nonconformity claims.

All five responses report `providerUsed=true`; actual OpenAI integration is now evidenced by the exported production responses, not merely a configured UI mode. The model selected approved cards rather than authoring policy text. No unrelated cards, invented links, automatic referrals or exposed credentials observed.

Observed end-to-end latency: mean **1.313 s**, minimum **0.994 s**, maximum **1.916 s**. These are five client observations, not provider-only latency or an SLA.

These five successful attempts consume **$0.10 of conservative application reservation** ($0.02 each). This is not the provider invoice; exact token usage/actual API charges were not exported. The screenshot shows a budget stop after this batch; it does not distinguish the daily vs lifetime ceiling. Earlier manual activity plausibly used the rest of the daily allowance, but this was not measured from storage.

Remaining: **45 cases**. Returns, complaints, actual defect situations, payment trouble, vague input, injection protection and closure handling have not yet been evaluated by this live batch. Preserve the same browser storage and resume under unchanged guards. Do not claim the 50-case requirement is complete.

# Production live evaluation

Status: prepared, not executed by the agent. The user must authenticate in their browser at `/qa`. No password or API key should be shared in chat. The harness uses the existing signed HttpOnly same-origin session and existing `/api/chat` endpoint. No bypass endpoint, stored credential or raised guard limit is introduced.

## Scope

50 unique synthetic cases: 17 RU, 17 LV, 16 EN. Delivery, payment, return process, guarantee, defects, international delivery, uncertain dates, duplicate payments, parcel collection expiry, B2B warranty, pickup, human requests, closings, courtesy combined with a defect, vague questions, prompt injection and a fictional phone string.

Cases are independent (no prior topic is supplied). This is not a full multi-turn workflow benchmark. Existing unit tests cover selected topic-preservation behavior separately. The dataset is a first acceptance set, not independent evidence of general accuracy.

## Run

1. Open the production `/qa` page in the same browser as the demo. Sign in with the demo password if requested.
2. Press Start/Resume and keep the tab in the foreground.
3. Requests run sequentially with seven seconds between completed cases (below the ten/minute chat allowance, except possible competing traffic).
4. At a daily budget stop, keep local storage and resume after the next UTC day. Existing use counts toward the $0.50 reserve ceiling; at most 25 attempted provider calls/day. Do not raise/reset limits to finish sooner.
5. Download the JSON report after each batch, especially in incognito. Closing all private tabs may erase local storage.
6. Send the exported report to the project reviewer for manual reading of full outputs. No messages are sent to Anete.lv, and no phone/mail links are activated by the harness.

## Recovery and cost

Each case is checkpointed BEFORE the request, without credentials. Successful answers replace the pending record. Ambiguous transport failures/cancellation are recorded, stop execution and are not automatically retried; a reloaded pending record is also skipped because the server may already have spent a reservation. These cases remain visible for manual follow-up, not falsely marked as passing. 401 and 429 occur before provider dispatch and leave the case eligible for later resumption.

The report records `providerUsed`, output mode, text, card IDs, source URLs, handoff, locale, timing and preliminary assessment. It does not expose a key, password, cookie, exact provider token usage or invoice. Ordinary canned/social/safety/contact cases may use no provider; “50 end-to-end cases” does not mean “50 AI calls”. Provider-generated dialogue templates still count as provider use. Lifetime and daily reservations are intentionally conservative and do not equal actual billing.

Preliminary automated checks are NOT a semantic quality score. Human review must check whether the selected policy actually addresses the question, whether added cards are irrelevant, whether tone is appropriate and whether the referral is needed. All attempted failures and unresolved records remain in the export.

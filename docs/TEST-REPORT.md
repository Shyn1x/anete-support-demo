# Verification report — 15 October 2026

## Passed checks

- **395/395 Node.js automated tests**, including **108 distinct synthetic customer scenarios** (36 Russian, 36 Latvian, 36 English). An additional 48 typo and safety checks cover missing letters, swapped letters, unrelated words, ambiguous corrections and sourced API responses. Full individual results: `test-results.txt`; prompts/expectations: `docs/scenarios.json`.
- **4/4 workerd runtime tests**: the 108 scenarios execute against the actual compiled Worker with a real SQLite-backed Durable Object; concurrent reservations cannot exceed the configured cap; a new runtime instance reads the previously exhausted budget. Language switching RU → EN → LV → RU is checked through the actual Worker. Full results: `runtime-results.txt`.
- Wrangler **deployment dry-run passed**: Worker bundle and static assets validated. This is not a production deployment and consumes no OpenAI API calls.
- `npm run build`: 22 trilingual answer cards, 8 source references validated; static assets prepared.
- Portable standalone reference demo generated; embedded JavaScript syntax checked. It contains no OpenAI call or secret key.

38 additional language checks cover switches from all three defaults, diacritics, unaccented Latvian, short ambiguous messages and mixed-language ties.

## Covered failure modes

Origin/Content-Type/method validation, oversized streamed body, malformed JSON, 1,001-character input, unsupported locale, unknown tenant/prototype names, forged session cookies, login throttling, missing secrets, missing durable guard, rate limits, provider errors/exceptions/refusals/truncation, malicious provider output, forced escalation, parallel reservations, daily budget, lifetime budget and restart persistence.

Scenario coverage includes standard policies, language pairs, uncertain delivery dates, opened packaging, unclaimed parcels, business warranty conflicts, duplicate payments, complaints, cancellation requests, human requests, off-topic questions, injection attempts and synthetic sensitive data.

## Live evidence and remaining limits

- The user executed 50 production cases and exported all responses. 41 provider routes, 9 non-provider paths; manual acceptance 47/50, with three defects documented.
- After fixes, the same three failures were rerun against production: 3/3 automatically and manually accepted. This is 53 executions across 50 inputs, not a new full 50-case run after the last changes.
- The user confirmed mobile chat and contact-option behavior. Automated visual and desktop device QA remain pending.
- Generalisation beyond this acceptance set, full multi-turn workflows, exact provider tokens and actual billing remain unverified.
- Human inbox delivery is intentionally absent. Email/phone URI actions open native apps only after explicit selection; no support ticket is sent by the demo.

The project is suitable for a controlled unofficial client demonstration within this scope. Do not turn these observations into a general accuracy claim. The dated allowance exception was explicitly authorised and expires automatically; counters/lifetime ceiling remain intact.

## Courtesy response regression

30 added checks cover RU/LV/EN courtesy phrases including “Good thank u”, friendly emojis without invented facts/sources, mixed courtesy plus support issues, safety precedence, and an AI-enabled Worker test proving zero provider calls and zero spending reservations for courtesy-only turns. Live browser evaluation remains user-led.

## Conversation control regression

73 additional tests cover 48 RU/LV/EN gratitude-plus-farewell combinations, 5 reordered/conjoined variants, 9 inputs that must not hide substantive or unsafe requests, all 7 semantic dialogue contracts in three output languages, invalid mixed model selections, clarification without automatic escalation, and two AI-enabled Worker paths (local closure and mocked semantic closure). 328 Node tests and 4 workerd tests pass. Semantic tests use injected outputs: they validate the contract, not live model classification accuracy. No additional paid calls were made during this change.

## Contact options regression

21 added tests validate international tel links, encoded mail subjects/bodies, contact schema publication without secrets, malicious contact-value rejection, and actual channel-selection/back handlers through a minimal DOM adapter in RU/LV/EN. 349 Node tests and 4 workerd tests pass. Standalone bundle syntax checked. Tests do not invoke a mail client, telephone app, dial a number or send messages. Real mobile app handoff requires manual user review.

## Direct contact / mobile layout correction

8 additional AI-enabled Worker regressions cover explicit staff requests in RU/LV/EN with an existing defect topic. All return only the contact card, require handoff and call no provider. Mobile CSS prevents flex-shrinking of the contact panel and removes suggested-question competition while it is open. 357 Node tests and 4 workerd tests pass. CSS changes still require manual mobile visual review; automated API checks do not prove visual layout.

## Contact tap feedback correction

Contact previews now use a native dialog outside the clipped chat container. RU/LV/EN handler checks assert dialog opening/closing. One additional test validates that missing data leaves channel buttons enabled and opens a visible explanation without an unsafe URI. 358 Node tests and 4 workerd tests pass. Native app navigation is still not invoked by automated checks.

## Live evaluation harness

11 additional tests verify 50 unique synthetic cases across RU/LV/EN, preliminary topic/language/handoff/source grading, checkpoint-before-request, resume without duplicate attempts, authentication/budget/rate stops, ambiguous network failures and abort preservation, provider failures without retries, and accurate counting of provider-routed social responses. 369 Node tests and 4 workerd tests pass. These harness tests use injected responses, not live model calls. Live evaluation has NOT been executed by this agent; user authentication in `/qa.html` is required.

A clean-URL asset regression was added for `/qa`, because Cloudflare redirects `.html` pages to extension-free URLs. 370 Node tests and 4 workerd checks pass.

## Explicitly authorised one-day evaluation allowance

5 additional tests verify exactly 45 additional $0.02 reservations on 15 October 2026, preservation of prior daily/lifetime accounting, unchanged lifetime cap, rejection of future-date/oversized grants and automatic return to the normal next-day allowance. 375 Node tests and 4 workerd checks pass. No provider calls were executed by these tests.

## Live baseline review and regression corrections

The user completed/exported all 50 cases. 41 provider routes, 9 non-provider paths, 48 original auto-passes; manual review accepts 47 cases, identifying unnecessary routine-return handoff in cases 07/08 and extra withdrawal-refund guidance in case 45. All 50 texts/source arrays match approved templates/cards. Original outputs are saved unchanged under `docs/evaluations/2026-10-15-full-50.json`. Twenty added tests replay the observed parser failures, preserve sensitive/complicated return handoff, retain explicit money-back requests and ensure the grader catches irrelevant extra cards. 395 Node tests and 4 workerd checks pass. The subsequent three-case live rerun was manually accepted 3/3; see `docs/evaluations/2026-10-15-regression-1-review.md`.

## Final targeted live acceptance

User-exported `anete-live-results-3.json`, suite `anete-live-2026-10-15-v1-regression-1`, completed 3/3 at 13:58 UTC on 15 October. All three previous failures are corrected: routine return handoff false in RU/LV and no unsolicited refund card on the EN defect question. The regression outputs and manual review are saved under `docs/evaluations/`. No additional code change or paid call was performed by this review.

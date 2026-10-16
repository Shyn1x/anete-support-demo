# First live audit checkpoint — 2026-10-16

User-run report: 12/50 completed, 11 preliminary passes, 8 generated replies, 9 provider attempts, no ambiguous requests. This is a partial run, not outreach approval.

Bariba completed all ten cases. RU/EN/LV switching, warranty typo, product ingredients, employee request, social closing and injection refusal worked in this sample. Manual review found a loss of uncertainty in the generated warranty response: “not confirmed” became “not established”. The prompt now explicitly forbids this inference; a regression guard rejects this observed Russian wording and corresponding English/Latvian absence claims. This guard is not a general semantic entailment validator. The complaint response also remains rather mechanical; automated topic/handoff success does not establish conversational quality.

Hobbyset delivery passed; its timing follow-up returned the correct reference fallback with `answer_validation`. The original rejected output and exact reason were not present in the historical report. No precise root cause can be established from it. Existing checks can reject, among other things, topic changes, unsupported numbers, stock claims, wrong language, incomplete output and malformed JSON. No check has been relaxed on speculation.

The worker now returns safe validation reason codes, and the standalone runner saves them. Generated rejected prose, internal exception strings and credentials are not exposed. New diagnostics distinguish numeric/locale/promise/evidence/topic validation, incomplete output/refusal/schema/JSON failures and generic provider/parse errors. No extra provider call, paid retry, budget increase or reset was added.

After updating the workers and runner, resume with the existing `reports/live-50.json`: the first 12 are preserved and only the remaining 38 run. The existing failed case stays failed; resuming does not silently re-run it or declare it fixed. Evaluate remaining results, then explicitly retest the failed timing and warranty cases if appropriate within the available budget. Do not delete the original report to conceal failures.

Validation: `npm test` 1329/1329; `npm run test:worker` 13/13, all using local/mocked provider responses. This patch was not deployed from the assistant environment; owner deployment is required. No live provider requests were made here.

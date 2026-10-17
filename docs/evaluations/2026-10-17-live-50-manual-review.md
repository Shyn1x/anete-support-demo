# Live 50: manual review of immutable uploaded reports

Reviewed on 2026-10-17. No paid requests, publication, counter reset or report mutation during this review.

## Evidence and provenance

Final report: `live-50-resume-2026-10-17T18-20-30-554Z.json`.
SHA-256: `82972e79662d09f6017f73db4c2fb812a9ad211e296fe791013f49855bd843ae`.
Its parent SHA matches the uploaded 34-row report, and its first 34 row objects are unchanged. The 34-row report in turn preserves the original 27 rows and original report SHA. All new question SHA-256 values match their UTF-8 question text. No original rows are rescored or deleted here.

Final recorded counters: 50 completed, 45 automatic passes, 30 generated AI answers, 34 provider-used flags, 0 ambiguous. This is a mixed-version historical run: the first 27 rows predate the safe-resume deployment. It is not 50 fresh tests of the current release. Anete is outside this five-shop case set.

## Review of all 50 customer-facing answers

All 50 questions, answers, selected IDs, source URLs, language, escalation and automatic verdicts were read. New responses were compared against the checked-in approved cards, not a fresh verification of shop websites. No cross-shop source URL appeared in these responses. The newly completed 16 rows preserve language switching and human escalation on the intact complaint questions.

| Case | Observation | Disposition |
| --- | --- | --- |
| hobbyset-02 | Generation rejected; reference answer explains 2–3 working days for available goods and defers order-specific date to shop. Old report lacks detailed rejected-reply reason. | Keep automatic failure; exact generation cause not recoverable. |
| apavi40plus-05 | Generation rejected; reference warranty answer retains uncertainty and human review. | Keep automatic failure; no false warranty term in displayed answer. |
| apavi40plus-06 | Recorded question has mojibake. | Invalid-input test evidence; cannot infer canonical question performance. Do not silently pass or repeat. |
| apavi40plus-07 | Recorded complaint has mojibake; old fallback loses complaint intent and lacks handoff. | Invalid-input evidence plus historical fallback issue. Deterministic intact-complaint fallback was fixed in safe-resume-v1; canonical live retest still outstanding. |
| rotallieta-04 | Intact Latvian return question, rejected generation (`links_contacts_or_internal_text`); safe reference answer retains return-process ID, own source and verified contact. | Keep automatic failure. Rejected raw prose is intentionally not stored, so the matched fragment cannot be reconstructed. |
| bariba-05 | Automatic pass, but “не установлен единым правилом” strengthens “not confirmed” into absence of a rule. | Manual concern independent of original score. Existing uncertainty regression already rejects this precise wording. No live retest yet. |
| celotajs-07 | Automatic pass, but “Я могу помочь передать запрос специалистам магазина” offers an action the demo cannot perform, contradicting the server notice. | Confirmed new blocker. Add deterministic RU/LV/EN guard for offers/promises of unimplemented dispatch and mock regression for all six shops. |
| hobbyset-05 | “На сайте не указано” is stronger than the approved card’s “не подтверждён”. | Editorial/manual concern; preserve limited-evidence language. Do not assert entire-site absence. |

Complaint replies are generally repetitive. HobbySet/Rotallieta discuss warranty in shipping-damage cases, but do not grant a remedy. Improve empathy and next-step clarity later without inventing eligibility or unverified procedures. The sleeping-bag comfort/limit answer is a limited explanation, not suitability advice for a specific person or temperature.

## Readiness and costs

A supervised prototype can be demonstrated with its limitations disclosed. Do not call this production ready or 45 fully manually accepted cases. Before outreach, review/publish the new handoff-offer guard with separate publication approval and perform only a separately approved small retest of unresolved cases. Do not repeat the full run or bypass budgets.

Continuation after the original 27 rows added 23 scenarios, 14 provider-used flags and 13 generated answers. At the unchanged per-provider reservation of $0.01 this corresponds to $0.14 reservation, not an OpenAI invoice. This report has no provider token usage or billing data, so exact API charges cannot be reconstructed.

Raw reports stay local and unchanged. No passwords, keys, cookies or raw rejected model output are included in this document.

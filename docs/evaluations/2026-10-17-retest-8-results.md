# Eight-case live retest: manual findings and follow-up patch

Input: `live-retest-8-2026-10-17T18-45-48-961Z.json`.
SHA-256: `df19d40f7ff6599cce214dddb40cd6e1d45d57e9c6d50d508f3d2f88592ce85f`.
Parent: unchanged historical 50-row report SHA `82972e79662d09f6017f73db4c2fb812a9ad211e296fe791013f49855bd843ae`.
All eight UTF-8 question hashes verified. No report is edited, rescored or merged here.

Recorded result: eight complete, four automatic passes, eight provider-used flags, zero ambiguous. Manual review finds only two generated answers without a noted defect, four safe reference fallbacks, and two warranty claims that the automatic assessment wrongly accepted. This is not eight successful generation tests.

| Case | Customer-facing result | Manual disposition |
| --- | --- | --- |
| hobbyset-02 | Generated answer retains available-goods qualification, 2–3 working days, order-specific timing caveat. | Accept for this case. |
| apavi40plus-05 | `unsupported_handoff_action`; own warranty reference preserves uncertainty and employee review. | Safe fallback, generation still failed. Raw rejected prose unavailable; exact matched fragment unknown. |
| apavi40plus-06 | Intact canonical shoe question; `unsafe_content`; correct selected material reference returned. | Safe fallback. Generic PII checker can reject the approved full model code as a long number; this is reproducible but cannot prove the missing raw model text was identical. |
| apavi40plus-07 | Intact canonical complaint; `unsupported_handoff_action`; defect topic and human review retained. | The old complaint-loss problem is resolved for this request. Generation still failed; do not silently mark pass. |
| rotallieta-04 | `links_contacts_or_internal_text`; correct return-process reference with own email/source. | Safe fallback; exact rejected fragment unknown. Do not loosen arbitrary contact/link validation. |
| bariba-05 | Generated “Единый гарантийный срок для всех товаров в магазине Bariba.lv не установлен.” | Manual failure. Existing distance-limited regex missed wording separated by shop name. |
| hobbyset-05 | Generated “В интернет-магазине HobbySet не указан единый гарантийный срок на товары.” | Manual failure. Unknown confirmation became an entire-site absence claim. |
| celotajs-07 | Generated answer asks customer to contact shop and states it cannot resolve the issue; no forwarding offer. | Accept for this case. No live dispatch integration exists. |

## Follow-up source fixes (not deployed by this review)

1. When selected warranty evidence lacks confirmation, generated replies must explicitly retain uncertainty. Unsupported absence/unspecified wording is also rejected. Handles long intervening shop names and reversed word order across RU/LV/EN. Other confirmed warranty evidence stays unaffected.
2. For output privacy checking only, an exact long numeric identifier present in a selected approved niche product card can be recognised as an identifier. This avoids confusing `42801 860 100` with customer PII. This does not permit arbitrary numbers, unselected/foreign evidence, contact labels or `+` phone prefixes. User-input `preflight` and all source/numeric/link controls remain unchanged.

Tests include the two actual false-positive warranty answers, three-language accepted/rejected warranty variants, approved product-code acceptance and privacy controls for unknown numbers, phone labels, prefixes and unselected evidence. No new paid request or Cloudflare publication during the review. All 1479 Node tests and 14 runtime tests passed.

The historical score remains 45/50, independent retest score remains 4/8. Neither is full manual acceptance. Provider-used flags imply at most $0.08 additional configured reservation for this batch, not a verified API invoice. Product readiness remains a supervised prototype, pending publication approval for these source fixes and any separately approved verification. Do not repeat the marked eight-case batch.

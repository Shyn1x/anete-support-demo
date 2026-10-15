# Live regression 1 — three corrections confirmed

Export: 15 October 2026, 13:58:04 UTC. **3/3 completed, automatic pass 3/3, manual acceptance 3/3.** All three used the production OpenAI route (`providerUsed=true`). No unresolved attempts or service error in this export.

| Case | Original defect | Repeat observation | Review |
| --- | --- | --- | --- |
| 07 RU | Unnecessary handoff for change-of-mind policy | Only return policy; correct Russian; relevant terms source; handoff false | Accept |
| 08 LV | Unnecessary handoff and extra refund paragraph | Only return policy; correct Latvian; relevant terms source; handoff false | Accept |
| 45 EN | Unasked withdrawal-refund paragraph in defect response | Only defect guidance and required human review; warranty source; no refund paragraph | Accept |

The conditional statement that disputed cases require staff review remains in the general return card. It does not activate handoff for these uncomplicated questions and does not assert a final eligibility decision. That distinction is correct for this demo.

Observed response times: 1.584, 1.476 and 1.380 seconds; mean 1.480 seconds. Application reservation represented by this run: $0.06. Actual provider tokens and invoice were not exported.

## Combined evidence

- Baseline: 50 unique synthetic cases, original auto-grading 48/50, manual acceptance 47/50.
- Targeted correction run: the three previously failed cases now accepted 3/3.
- Total execution evidence: 53 scenario executions across 50 distinct inputs; 44 completed provider routes and 9 non-provider responses. Batch 1's five responses are already part of the full 50 and must not be counted twice.
- Successful provider routes correspond to $0.88 of conservative application reservation across baseline plus rerun. This excludes earlier informal checks and is not actual API billing.
- Three known baseline defects are confirmed corrected in this rerun. The other 47 cases were not rerun after these changes; this is not a fresh 50/50 test of one final build or a general correctness guarantee.
- 395 Node tests and 4 workerd checks passed before the code deployment. No code changes were made for this review.

Ready for a controlled, clearly unofficial client demonstration. A paid pilot still needs company-approved policies/channels, fresh source review, Latvian copy review and a real inbox integration if requested. Full multi-turn workflow evaluation and actual billing measurement remain separate work.

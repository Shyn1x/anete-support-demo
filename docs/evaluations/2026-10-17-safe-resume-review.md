# Safe resume audit — 17 October 2026

Base main: `47f4c77f5f209b5df1f3ccbe349462bf61ece993`.
Work branch: `fix/live-audit-safe-resume-20261017`.
No Cloudflare publication, secret rotation, account purchase, provider request or outreach was performed.

## Evidence and limits

The owner reports 27/50 completed, 23 preliminary passes, 4 failures, 17 generated answers, 20 reported provider attempts and no ambiguous requests in the current PC report. That current file and its backup were not accessible to this environment. These are owner-reported figures, not a new independent live acceptance result. The older 25-row report and source history cannot establish the exact bytes sent in the last two PC attempts. The agent did not edit the PC's ZIP directory.

The known main commit includes the 16 October diagnostic patch (`55b3a02...`). `unsupported_number` means generated prose included at least one digit sequence absent from the selected approved evidence. It does not by itself establish whether the number was fabricated, a formatting artifact, an incorrectly selected topic, or a side-effect of corrupted input. Rejected prose was deliberately not retained, so its original offending number cannot be recovered from the reason code alone.

### Confirmed defects

1. **Validated route discarded when prose is rejected.** `conversationRequest.parse()` can establish the approved `defect` ID and mandatory handoff, then reject an unsupported number. The Worker previously rendered the independent reference route instead, discarding that semantic result. For inputs not recognised by keywords, the reference route can be `unknown` or `product-help`, producing a generic question and dropping handoff. Reproduced with English "Parcel was torn and the shoes got wet", Latvian "Saņēmu saplēstu sūtījumu" and Russian "Посылка пришла порванной, обувь мокрая"; provider replies are mocked in reproduction. New fallback retains only approved own-tenant IDs and mandatory escalation, never the rejected prose.
2. **Support intent could lose to product-oriented routing or an unrelated generated topic.** Explicit damaged-item/human intents now have deterministic priority over ordinary product follow-ups. A parsed generated reply cannot use a different topic to cover an explicit damage/human request. Mismatches return `mandatory_topic_mismatch` and the approved support response.
3. **Runner did not attest scenario bytes or patch revision.** The historical runner stored a question but not a digest of the exact UTF-8 JSON sent, checked only `context-v2`, and wrote back to its input report. New runner validates a fixed 50-case digest, checks `safe-resume-v1` plus conversation settings on all pending shops before chat calls, records request-body/message hashes, and forks the input report into a new output. Existing rows are not rescored or silently rerun.
4. **Old ZIP updater combined source replacement and immediate deployment.** The new updater separates byte-verified staging, local tests and source backup from owner-approved publication. Configs, reports, installed dependencies, secrets and production counters are excluded from installation. Publication preserves dashboard vars instead of redeclaring caps or enabling flags. It verifies the existing Worker names, entrypoints, bindings and migrations.

The exact canonical Russian damaged-parcel test already routes to `defect` with handoff on the baseline. Therefore the user's last damaged-parcel failure is NOT proven to be that deterministic routing bug. Its report needs inspection, especially after the known local script encoding incident.

## What was intentionally retained

- Numeric evidence validation unchanged: no whitelisting arbitrary numbers from the user's question, all cards or model output.
- All source constraints, tenant isolation, PII/injection guards, no-provider-retry policy and one USD 0.01 reservation per attempted provider call remain.
- `src/guard.js`, six deployment configurations, budget object name `experiment-v1`, original SQLite class and migration remain unchanged.
- Known fallback and failed/ambiguous historical cases are excluded from automatic repeats, not re-labelled successful.
- No automatic mojibake repair. A report mismatch is marked for review, not evidence of a particular wire payload. New local hashes attest serialization, not independent server receipt.

## Validation

Baseline: 1329/1329 Node tests. Updated: 1427/1427 Node tests and 14/14 real workerd/SQLite checks, all local/mocked. New integration coverage spans six shops × RU/LV/EN, unsupported numbers, malformed output, handoff, depleted budget, safe fallback sources, runner integrity, immutable report forks, update byte verification, rollback and config invariants.

`npm run build:clients` validates 103 trilingual cards across six shops and builds five isolated asset directories. All six publication configurations are compiled with `--dry-run` before any publication is allowed. These checks do not establish live model quality or Windows UX. Native Windows/PowerShell and the owner's live credentials have not been exercised here.

## API estimate

Current model remains `gpt-4.1-mini`. Official pricing checked 17 October 2026: USD 0.40 / million input and USD 1.60 / million output tokens, uncached standard text. https://developers.openai.com/api/docs/models/gpt-4.1-mini

A limit of 23 additional chat requests implies at most 23 possible provider attempts, hence at most USD 0.23 additional application reservations if all require AI. Some scenarios are free local routes. Actual charges depend on token usage; this is not an OpenAI invoice or a promise about available account credit. At 4,000–8,000 input and 100–400 output tokens, an illustrative 23 AI calls would be about USD 0.04–0.09 before tax. Do not treat this example as measured usage. Existing daily/lifetime/message caps may stop the batch first. No historical reservation is refunded or reset, and uncertain paid attempts are not retried.

The CLI offline audit computes the exact remaining IDs and expected AI cases from the owner's file. Old failures require separately approved targeted tests after inspecting their questions and reasons. Five client demos are covered by these 50 cases; Anete is updated and automatically regression-tested but is not silently added as 10 extra paid cases.

## Readiness

Ready for an owner-reviewed code update and offline report inspection. Not yet approved for unrestricted prospect outreach: the current 27-row file must be inspected, the remaining cases completed under separately approved budget, and failed outputs reviewed. Local tests do not replace a human check of naturalness, factual scope and public source freshness. These remain unofficial demos, with no real operator inbox or access to orders.

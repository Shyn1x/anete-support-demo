# Four-shop buyer check, 23 October 2026

## Scope and authorization

Four authorized paid requests, one each to Bariba, HobbySet, Rotallieta and Ceļotājs. Maximum reservation USD 0.04. All four configs passed buyer-v8/context-v2 preflight, and a stricter transport check required terms-v1 before chat. No retries, changed limits, resets, deployments or email sends. The 46 placeholder plan rows were not executed or authorized. A stale lock belonging to a completed run was verified and removed before this run; that blocked initial launch sent no requests and created no report.

## Results

| Shop | Language / question | Accepted generation | Time | Manual review |
|---|---|---|---|---|
| Bariba | RU, kitten or adult food | Yes | 11.186 s | Kitten life stage and flavours supported by exact product page |
| HobbySet | LV, pickup location | Yes | 6.853 s | Address and free collection supported; readiness caveat is cautious KB guidance |
| Rotallieta | EN, puzzle age | Yes | 8.391 s | Exact product description says 3+ |
| Ceļotājs | RU, unused item return | Yes | 6.659 s | Deadlines supported; practical how-to is incomplete |

Four HTTP 200 responses, four reported provider attempts, four accepted generated replies, zero automatic contract flags, zero ambiguous requests. Raw automatic assessments remain untouched and still require manual review. The separate review records human findings rather than rewriting the raw grades. Actual invoiced token cost is not exposed; USD 0.04 is the maximum reservation for this run.

All four cited merchant pages were independently fetched successfully (HTTP 200). Fetch timestamps and SHA-256 hashes are in the review. Only minimal factual summaries and hashes are committed, not complete merchant pages. The source checks validate consistency with merchant descriptions, not independent product safety, nutritional claims or legal compliance.

## Remaining issues

- Ceļotājs describes when to notify and return, but omits the verified email and concrete return instructions. The general question deserves an actionable next step. The page also lists product exceptions, so this reply must not be treated as universal return eligibility.
- Latency of 6.7–11.2 seconds is noticeable. These four samples are not a latency percentile benchmark.
- Earlier Apavi LV/EN comparison rejections under terms-v1 still stand. This run does not rerate them, prove all-shop readiness, or finish the legacy Windows live-50 report.
- HobbySet readiness is conservative existing KB guidance, not a separately verified confirmation workflow in the fetched delivery section.

## Operational outcome

No newly established unsafe factual substitution in these visible answers. No speculative code patch or PowerShell update is needed for this audit-only commit. Suitable evidence for a limited independent demo, with the known comparison and response-time limitations disclosed. Not certification of production readiness. Further paid testing requires a new explicit scope.

# Five-shop demo validation — 2026-10-15

## Results

- Node test suite: 659 passed, 0 failed. Includes 50 distinct synthetic messages for each of five shops (250 executions), AI schema parsing with mocked provider output, mandatory review, contacts and tenant isolation.
- workerd/SQLite: 5 suites passed, 0 failed. Includes the same 250 prospect scenarios in real Worker runtime plus the existing Anete scenarios, locale changes and persistent/concurrent budget checks.
- Build: 88 trilingual approved cards across six shops, validated sources. Worker deployment dry-run passed. Portable reference build passed.
- No live OpenAI requests were made for the five new shops during these checks. Mocked routing tests do not measure actual model classification quality. The earlier Anete live evaluation remains a separate report.
- Browser visual check could not run: Chromium is not installed in this environment. Phone layout and native email/phone behaviour need manual verification; the existing responsive UI and tested contact modal were reused.

## Access

Shared gallery: https://anete-support-demo.fshyn1x.workers.dev/demos

| Demo | URL |
|---|---|
| Rotallieta.lv | https://anete-support-demo.fshyn1x.workers.dev/?shop=rotallieta |
| Bariba.lv | https://anete-support-demo.fshyn1x.workers.dev/?shop=bariba |
| HobbySet | https://anete-support-demo.fshyn1x.workers.dev/?shop=hobbyset |
| Apavi 40 plus | https://anete-support-demo.fshyn1x.workers.dev/?shop=apavi40plus |
| Veikals Ceļotājs | https://anete-support-demo.fshyn1x.workers.dev/?shop=celotajs |

All use the existing demo password/session. Unknown shops return 404. Query selection chooses a server-allowlisted knowledge base; messages carry that tenant ID; source links use that shop’s approved exact URLs. Separate sessions, billing accounts or live operators are not provided per shop.

## Money and external actions

Provider expenditure from this implementation/test batch: $0 (zero provider calls). All shops share the existing Durable Object experiment budget and rate controls; no counter reset, budget increase, purchase or top-up. Previously paid OpenAI credit is not new expenditure. Real invoice usage must be checked in the owner’s OpenAI dashboard. No company was contacted, no emails/calls were sent and nothing was installed on company websites.

## Manual acceptance before outreach

Open each link, confirm the shop name, ask about delivery and returns in RU/LV/EN, ask for a person and open/close the contact preview without sending or calling. HobbySet’s uncertain returns policy and unconfirmed warranty periods must keep human review. A real model sample still needs to be tested within the remaining shared budget; this report does not claim 250 live AI tests.

## Publication

GitHub CI and Cloudflare Workers Builds passed for the five-shop implementation. All five live public config endpoints return their own tenant, contacts and sources, AI mode, ready=true and password protection. Gallery canonical routing is explicitly supported at `/demos`. No protected chat request or company contact was made during publication checks.

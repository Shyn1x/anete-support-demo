# Support Studio — independent Anete.lv demo

**17 October audit branch:** safe fallback, byte-verified ZIP updater and immutable live-test resume are prepared in `fix/live-audit-safe-resume-20261017`. They have not been deployed to Cloudflare. The new five-shop live batch is owner-reported at 27/50, not completed. Read [the technical review](docs/evaluations/2026-10-17-safe-resume-review.md) and [the owner runbook](docs/SAFE-LIVE-RESUME.md) before updating or running any paid tests. Earlier 50-case acceptance notes below refer to a different baseline.

A reusable Cloudflare Worker, own responsive RU/LV/EN chat, a reviewed policy catalog and an optional OpenAI intent router. This is not an official Anete.lv product. No shop installation or contact has been made.

**Delivery state:** source is maintained in https://github.com/Shyn1x/anete-support-demo. Local checks pass: 395 Node tests and 4 workerd checks, including 108 customer scenarios. The user deployed the demo to https://anete-support-demo.fshyn1x.workers.dev and reports successful mobile checks. The user completed 50 live production scenarios; three observed issues were fixed and all three passed a targeted live rerun. This is 53 executions across 50 distinct inputs, not a fresh full run after the final changes. AI is disabled when AI_ENABLED is absent. A ChatGPT subscription is not an API key or API balance.

## Try without accounts or costs

Open `Anete-demo-offline.html` from the delivery ZIP in a desktop browser. This is the portable **reference mode**, not live AI. It uses approved answers and keyword routing with conservative support for minor typos. It never calls OpenAI. Internet access is only needed if you choose to open a source link.

Alternatively install Node.js 22+ and run from this folder:

```sh
npm start
```

Open `http://localhost:8787`. No dependency installation is needed for this local reference server. The local adapter disables AI even if your shell contains API credentials. Its rate counters are temporary; production counters use durable storage.

## Install and verify

```sh
npm ci --no-audit --no-fund
npm test
npm run build
npm run build:standalone
npm run test:worker
```

`test-results.txt`, `runtime-results.txt` and `docs/TEST-REPORT.md` record the delivered checks. `test/scenarios.mjs` contains 108 synthetic customer situations, 36 per language. Security tests use a mocked OpenAI response. This is not a live model evaluation.

## Publish to your Cloudflare account — after authorisation

Remain on **Workers Free**. Do not enable a paid Workers plan, subscriptions, credit purchases or automatic top-ups. Wrangler may offer account/plan steps; stop if it asks for payment.

```sh
npx wrangler login
npx wrangler secret put SESSION_SECRET
```

Enter a newly generated random secret of at least 32 characters at the secure CLI prompt. Do not put it in shell arguments, source files or chat. Then, to protect the demo, set a demo-only password of at least 12 characters (at most 128):

```sh
npx wrangler secret put DEMO_PASSWORD
npm run deploy
```

The first deployment creates the SQLite-backed `BudgetGuard` namespace from `wrangler.jsonc`. AI remains disabled. Cloudflare prints the actual `workers.dev` URL. Use that returned URL, not an invented address.

To enable AI later, only after separate approval for billable API usage and verification of an existing API balance:

```sh
npx wrangler secret put OPENAI_API_KEY
```

Use a dedicated restricted OpenAI project key. Set runtime variable `AI_ENABLED` to `"true"` in the Cloudflare dashboard and deploy the setting. The configuration uses `keep_vars=true` and leaves AI_ENABLED out of tracked vars to preserve this dashboard setting across code deployments. Do not paste keys here. `SESSION_SECRET`, `DEMO_PASSWORD` and `OPENAI_API_KEY` must be Worker secrets, never ordinary Git-tracked variables. Review current API pricing and limits first. With missing secrets or a missing Durable Object, AI calls fail closed. Do not run load tests against live AI before reviewing their cost.

The default application reservation limits are $0.50/day and $5 lifetime, with $0.01 reserved for every API attempt. They conservatively cap this demo's attempted usage; they do not control other apps or provider account billing. Do not delete the guard or reset its namespace. See `docs/ARCHITECTURE.md` and `docs/COSTS.md`.

To disable billable AI, set `AI_ENABLED` back to `"false"` and redeploy. There is no in-app auto-top-up or purchase flow.

## Deploy from the Cloudflare dashboard

Connect only this repository to Workers Builds and select branch `main`. The code and `wrangler.jsonc` live at the repository root.

| Setting | Value |
|---|---|
| Worker name | `anete-support-demo` |
| Root directory | repository root |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

After the first deployment, add `SESSION_SECRET` (a randomly generated string of at least 32 characters) and `DEMO_PASSWORD` (12–128 characters) as **Secret** values under the Worker's Settings → Variables and Secrets, then deploy those changes. The interface is visible before configuration but chat requests fail closed. Keep `AI_ENABLED=false` until separately authorised to connect billable OpenAI usage.

The GitHub Actions workflow tests this repository without OpenAI or Cloudflare secrets and does not deploy. Standard runners are used. `.gitignore` excludes secret files, local state, installed dependencies and generated bundles.

## Project map

| Path | Purpose |
|---|---|
| `src/kb.js` | Tenant registry, 22 approved trilingual answers, 8 sources |
| `src/core.js` | Safety preflight, reference router, AI route schema, deterministic rendering |
| `src/worker.js` | Worker API, sessions, input validation, OpenAI calls, static files |
| `src/guard.js` | Durable rate limits and conservative spending reservations |
| `public/` | Own responsive interface, no external scripts/fonts |
| `test/` | 108 scenarios and additional API/security checks |
| `test-runtime/` | workerd and real SQLite Durable Object checks |
| `scripts/` | Local server, build and standalone demo builder |
| `docs/` | Sources, costs, architecture, demo script and test report |

## Known scope limits

- Production response evidence and client latency were reviewed for 50 baseline cases plus 3 correction repeats. Generalisation beyond this acceptance set, exact API token usage and actual billing are not established. The user reports a $5 top-up; the agent made no purchase.
- The user confirmed mobile chat, language switching and email/phone selection. Automated visual browser QA and desktop device review remain pending.
- Handoff is a transparent contact-and-copy demonstration, not an operator inbox or ticket integration. There is no order lookup, refund, cancellation, real-time stock or automatic policy refresh.
- Each message is checked for Russian, Latvian or English vocabulary/script; recognizable language changes update replies and controls without clearing the conversation. Ambiguous short messages keep the selected language. This conservative detector does not guarantee arbitrary transliteration or heavy misspellings. Manually choosing RU/LV/EN starts a fresh session in the UI. No chat content is saved between reloads.
- Reviewed source wording contains conflicts; these are explicitly escalated. Have a native Latvian reviewer verify the copy before a commercial pilot.
- Tenant separation is implemented in the AI catalog/rendering. The reference fallback currently needs additional configuration for another company. This is a reusable foundation, not a finished SaaS platform.

Show `docs/DEMO.md` to the presenter. The portable reference file never calls OpenAI; the deployed demo uses OpenAI. Neither version is officially approved by Anete.lv.

Courtesy-only messages (thanks, acknowledgements, greetings and goodbyes) use approved friendly templates in RU/LV/EN, with one emoji and no handoff, source links or OpenAI call. Whole-message matching avoids masking a substantive question after “thanks”. The UI retains the previous topic across these replies. Unsupported social phrasing may still fall back to the model/unknown route.

Conversation behavior: `docs/CONVERSATION.md`. Courtesy phrases can be composed; unfamiliar conversational wording can use constrained semantic dialogue IDs. Vague requests ask for clarification before escalation. Policy/human-review rules stay separate from courtesy templates.

Human contact options: email/phone selection first opens a modal preview with a real-contact warning. A separate explicit link launches the mail or phone app. No message, call, ticket or transcript is sent by this application. Contact values and localized support hours come from the tenant configuration. See `docs/CONTACT-OPTIONS.md`.

Direct contact requests bypass model classification and previous policy context. When contact choices are visible, suggested questions are hidden and the contact panel cannot be collapsed by flexbox.

Contact previews open as native dialogs above the chat, so a tap cannot be hidden below an internal scroll area. Chat responses include the same public per-tenant contacts as config. Missing data opens an explanation and source link instead of silently disabling the choices.

## Live evaluation page

Open `/qa`, sign in using the demo password and press Start/Resume. The browser runs 50 synthetic production scenarios with the same session and server guards. It checkpoints each attempt locally, stops at budget/rate/auth errors and exports JSON. There is no shared evaluation-password endpoint, automatic model retry or budget increase. 50 cases do not imply 50 provider calls: safety, social and direct-contact paths can bypass the model; the `providerUsed` response flag records actual completed provider routes. The first baseline and targeted rerun have been exported and manually reviewed; see `docs/evaluations/`. See `docs/LIVE-EVAL.md`.

On 15 October 2026 the user explicitly authorised immediate completion of the remaining 45 evaluation cases. A fixed-date `LIVE_EVAL_EXTRA_DAY=2026-10-15` grants exactly $0.90 additional daily reservation for that UTC day, without clearing any counter or increasing the $5 lifetime limit. It expires automatically; normal daily allowance returns next UTC day. See `docs/EVAL-ALLOWANCE-2026-10-15.md`.

Live baseline completed: 50/50 production cases, 41 provider routes, 48 original automatic passes and 47 manual acceptances on this set. Three fixes are implemented and confirmed by a separate live 3/3 correction rerun. Full immutable baseline and manual review: `docs/evaluations/2026-10-15-full-50-review.md`.

Latest acceptance status: `docs/evaluations/2026-10-15-regression-1-review.md`. Ready for a controlled, explicitly unofficial demo; real inbox/order integration remains outside scope.


## Five prospect demos

[Open the five-demo gallery](https://anete-support-demo.fshyn1x.workers.dev/demos): Rotallieta.lv, Bariba.lv, HobbySet, Apavi 40 plus and Veikals Ceļotājs. These are independent proposals, not clients or official shop services. Existing demo password applies. Select a shop with `?shop=rotallieta`, `bariba`, `hobbyset`, `apavi40plus` or `celotajs`; omitting the parameter preserves Anete.

Configuration is in `src/prospects.js`; approved cards and sources are isolated by shop. Shared safety, language, contact UI and global expense controls are reused. Unknown shops fail closed. `requiresReview` forces review independently of model output. See [research](docs/prospects/RESEARCH.md) and [validation/limits](docs/prospects/TEST-REPORT.md). No outreach has been sent.

Each prospect now has its own colour palette, headline, monogram and RU/LV/EN greeting. See [styling and validation](docs/prospects/BRANDING.md). Shared API budget limits are unchanged.

[Read-only demo quota](https://anete-support-demo.fshyn1x.workers.dev/usage) shows the shared reservation and current connection message limits after demo login. It makes no provider call and is not an OpenAI billing balance. See [usage documentation](docs/USAGE.md).

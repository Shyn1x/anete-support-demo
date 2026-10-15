# Support Studio — independent Anete.lv demo

A reusable Cloudflare Worker, own responsive RU/LV/EN chat, a reviewed policy catalog and an optional OpenAI intent router. This is not an official Anete.lv product. No shop installation or contact has been made.

**Delivery state:** source is maintained in https://github.com/Shyn1x/anete-support-demo. Local checks pass: 187 Node tests and 3 workerd checks, including 108 customer scenarios. Production Cloudflare deployment and live OpenAI evaluation are pending. AI is disabled by default. A ChatGPT subscription is not an API key or API balance.

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

Use a dedicated restricted OpenAI project key. Change only `AI_ENABLED` to `"true"` in `wrangler.jsonc`, then redeploy. Do not paste keys here. `SESSION_SECRET`, `DEMO_PASSWORD` and `OPENAI_API_KEY` must be Worker secrets, never ordinary Git-tracked variables. Review current API pricing and limits first. With missing secrets or a missing Durable Object, AI calls fail closed. Do not run load tests against live AI before reviewing their cost.

The default application reservation limits are $0.50/day and $5 lifetime, with $0.02 reserved for every API attempt. They conservatively cap this demo's attempted usage; they do not control other apps or provider account billing. Do not delete the guard or reset its namespace. See `docs/ARCHITECTURE.md` and `docs/COSTS.md`.

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

- Live OpenAI intent accuracy, latency, balance and billing have not been verified without a key. No financial transaction was performed.
- UI has responsive CSS and safe DOM rendering, but a browser/device visual review is still needed. Local previews were not opened in an automated browser in this environment.
- Handoff is a transparent contact-and-copy demonstration, not an operator inbox or ticket integration. There is no order lookup, refund, cancellation, real-time stock or automatic policy refresh.
- Language is chosen by the visible RU/LV/EN control. Changing language starts a fresh session in the UI. No chat content is saved between reloads.
- Reviewed source wording contains conflicts; these are explicitly escalated. Have a native Latvian reviewer verify the copy before a commercial pilot.
- Tenant separation is implemented in the AI catalog/rendering. The reference fallback currently needs additional configuration for another company. This is a reusable foundation, not a finished SaaS platform.

Show `docs/DEMO.md` to the presenter. Do not claim this reference prototype is already connected to OpenAI or officially approved by Anete.lv.

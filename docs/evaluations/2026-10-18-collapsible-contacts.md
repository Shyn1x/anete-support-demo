# Collapsible shop contact panel — 18 October 2026

## Confirmed issue and change

The always-open contact panel below the message log could not be collapsed. Its
old fixed minimum height crowded the message area and composer. In an actual
320 px Chromium viewport the expanded panel also caused flexbox to squeeze the
chat header.

All six shop demos now use the same disclosure button, labelled in RU/LV/EN.
It has `aria-expanded` and `aria-controls` and supports mouse, touch, Enter and
Space. The button stays visible while only the contact body scrolls. Collapsing
preserves the transcript, unsent draft, contact details and topic summary. Later
support responses preserve the user's choice. Starting a new conversation resets
the panel to expanded, initially hidden until a support response needs it.
The log also scrolls to the newest answer after the panel changes the available
message height.

The header, attachment controls and composer no longer shrink. The message log
and expanded contact body share the available height. A collapsed panel occupies
62 px in the measured HobbySet views, including its border. No backend, budget,
login, tenant configuration, model prompt or knowledge-base files changed.

## Validation

- `npm test`: 1,519 passed, including 18 added renderer regression cases covering
  Anete, Bariba, HobbySet, Apavi40plus, Rotallieta and Ceļotājs in RU/LV/EN.
- `npm run build:clients`: all five isolated client bundles built successfully,
  plus the shared Anete/owner bundle. CSS and JS cache identifiers regenerated.
- `npm run test:worker`: 18 workerd checks passed, including shop isolation,
  budget limits and signed studio transport.
- `scripts/check-handoff-browser.mjs`: 90 actual Chromium cases passed, six shops
  × three languages × widths 320, 375, 390, 430 and 1280, height 844 px.
- Browser checks cover collapsing, reopening with Enter, collapsing with Space,
  subsequent messages, contact email preview, reset, composer geometry, horizontal
  overflow and JS errors. All HTTP endpoints are local synthetic fixtures. No
  OpenAI call, outbound contact action or live Worker modification was performed.
- Screenshots in `collapsible-contacts-20261018/` show HobbySet RU at 390 × 844.

To repeat browser checks, build clients first and run
`node scripts/check-handoff-browser.mjs` with Playwright/Chromium available.
Optional `PLAYWRIGHT_MODULE` and `PLAYWRIGHT_CHROMIUM_EXECUTABLE` environment
variables can point to an external installation. This does not add project
dependencies. Output defaults to the ignored `reports/handoff-browser` directory.

## ZIP-copy update and publication

Use the immutable commit SHA supplied with this change, never the moving branch.
From PowerShell in the existing ZIP project directory:

```powershell
Set-Location 'C:\Users\shyn1\support-demo-20261015-214857\anete-support-demo-main'
node .\scripts\prepare-live-audit-update.mjs --release COMMIT_SHA
```

The preparation script validates bytes, runs local tests, builds clients, performs
Worker dry runs and preserves reports, secrets and deployment configurations. It
prints a receipt path. No live publication or provider call occurs.

Publication needs the owner's separate approval. After that approval, use the
receipt from this exact release, with no `--owner-only` flag, to update all six
existing demos:

```powershell
node .\scripts\publish-live-audit.mjs --receipt 'RECEIPT_PATH' --confirm-publish
```

No publication was executed as part of this change. Existing demos retain their
previous UI until explicitly updated. Live tests are not needed for this UI fix.

# Browser startup hardening — 2026-10-15

User reported all prospect links showing a blank Anete shell in desktop Chrome while another browser surface worked. The screenshot retained `?shop=rotallieta`, static Anete labels and the initial ellipsis, with no greeting. Direct browser inspection showed the correct Rotallieta theme and configuration in the test browser. The exact cause in the user's desktop profile was not established; no claim of a confirmed cache/extension defect is made.

Changes:
- Bundle the UI and its imports into one classic deferred script, with a SHA-256-derived filename. No browser module dependency requests are required on the main chat page.
- Version CSS URLs using content hashes, including the gallery.
- Display a startup notice and a JavaScript-disabled explanation. A startup exception or stalled configuration leaves a visible `UI_LOAD_FAILED` instruction instead of a silent empty chat.
- Disable the composer until configuration is ready. Configuration GET has a 10-second timeout.
- Rebuild before local `npm start`; include the bundle in public/dist output and keep generated bundles out of git.
- Keep standalone reference exports self-contained.

Validation: 666 Node tests passed, including five classic-bundle starts and two startup failure regressions. Five workerd/SQLite checks passed, including 250 prospect scenarios. Build and standalone build passed. The bundle harness executes the shipped code with a minimal DOM adapter; it does not replace real-browser acceptance. No provider calls, budget changes, authentication changes or contacts with companies were made.

Desktop acceptance: open the gallery, pick a shop, check its name/theme and greeting, then use Ctrl+Shift+R once if the previous shell remains visible. If startup still fails, the displayed error provides a concrete next diagnostic. The user's affected browser profile has not been accessed.

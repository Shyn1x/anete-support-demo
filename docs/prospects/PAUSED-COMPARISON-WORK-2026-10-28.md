# Comparison work paused: 2026-10-28

The owner requested a change of strategy: stop spending time on speculative per-company bots before customer interest. This is an unpublished work checkpoint, not a release. Do not deploy it or launch another paid comparison automatically. Production remains on the screenshot-confirmed pilot-buyer-v4.

The two v4 checks completed with REVIEW: Dzijas catalog_material_qualification / product_subject_unbound; JIG catalog_quantity_binding / measurement_role_mismatch. Input report SHA-256: 15f86dd06b2022b4866c78cb8db950d8d053ca8e9c3204dda43d9f9fdcbebca4. The rejected generated prose is absent, so neither rejection is proven to be a false positive. Dzijas returned correct literal composition/weight; JIG fallback omitted a known material. The original report and assessments remain unchanged.

Checkpoint changes: preview comparisons request separate ID-scoped product replies and validate each against only its own facts using the existing single-product checks; old six and single-product wire shapes remain. Exact LV IM9/TORAY rod material is available to JIG fallback. The existing model, 450-token output, call count, shared BudgetGuard and limits are unchanged. No paid calls or Cloudflare deployment occurred here.

Validation: 4570 Node tests passed. Earlier workerd run passed 38/38. After the final schema coverage bound, the final Worker check did not reach runtime tests: parallel asset scanning encountered a disappearing temporary file under public/catalog-data produced by the new atomic build writer. Do not report that final check as passed. If this work resumes, first move atomic-build staging outside public assets on the same filesystem, then run the build/checks sequentially before considering release. Offline preview tests now use an isolated temporary output directory.

Prepared v4-to-v5 update entrypoints are stored only for continuity. They have NOT been approved or executed. Existing live-run scripts and markers must not be reset or reused. The next business step is demand validation with limited outreach, not more paid debugging or speculative bots.

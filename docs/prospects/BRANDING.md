# Store-specific demo styling — 2026-10-15

Five original demo themes use palettes observed in public storefront HTML/CSS. These are proposals, not approved brand guidelines or official shop interfaces. No company was contacted and no company website was modified.

| Shop | Main button | Text | Style | Button contrast |
|---|---|---|---|---|
| Rotallieta.lv | #ffdb22 | #0c1734 | Yellow, navy, rounded cards | 12.97:1 |
| Bariba.lv | #f7882f | #24201d | Orange, warm white, rounded cards | 6.56:1 |
| HobbySet | #0e1e79 | #ffffff | Deep blue, serif display headings | 14.18:1 |
| Apavi 40 plus | #121212 | #ffffff | Monochrome, restrained square corners | 18.73:1 |
| Veikals Ceļotājs | #108474 | #ffffff | Teal, light green backgrounds | 4.59:1 |

Primary reference pages: https://rotallieta.lv/, https://www.bariba.lv/, https://hobbyset.lv/, https://apavi40plus.com/, https://veikalscelotajs.lv/.

Palette observations: Rotallieta generated theme CSS includes #ffdb22, #0c1734 and #1949c9; Bariba `catalog/view/theme/so-petshop/css/layout1/yellow.css` uses #f7882f; HobbySet `styles/style.css?v=10` uses #0e1e79 and Lora headings; Apavi inline Shopify variables include black/white; Ceļotājs inline styling includes #108474. System fonts/Georgia are used as local approximations. No remote fonts, logos, scripts, analytics or images are loaded. Monograms are original demo labels.

`public/branding.js` provides per-shop RU/LV/EN headings, introductory copy and greetings. `public/brand.css` applies the allowlisted shop theme through a root data attribute after the server confirms the selected shop. The gallery uses the same palettes. Anete retains its existing appearance. The standalone build includes these files without network dependencies.

Validation: 659 Node tests passed; 5 workerd/SQLite checks passed, including all 250 prospect scenarios. Build, deployment dry-run and standalone bundling passed. Manual code checks confirmed all three locales, theme selection/removal and the button contrast ratios above. These checks are not a full accessibility audit. Browser screenshots remain unavailable because Chromium is not installed; final phone visual acceptance is needed. No live provider calls were used. Budget limits, counters, authentication, shop policies and contact actions were not changed.

Preview: https://anete-support-demo.fshyn1x.workers.dev/demos . Existing demo password applies. Viewing themes uses no OpenAI requests; sending chat questions uses the existing shared limits.

# Product evidence and coverage — 18 October 2026

## Finding and readiness

The Bariba screenshot is a symptom of sparse catalogue coverage, not just an
unrecognised phrase. The deployed design has shop-policy summaries and a few
product/guide facts. It can optionally read an exact allowlisted product URL;
it does not discover/search/index each shop's whole catalogue.

Before this patch, Bariba, HobbySet, Apavi40plus and Rotallieta each had three
facts from one product page; Ceļotājs had three facts from a sleeping-bag guide.
Anete had no approved product facts. Those facts do not establish useful coverage
of the shops' ranges. Previous regression passes do not establish that either.
The number of untested failures is unknown. These demos should not yet be sold
as full catalogue advisers.

## Confirmed failures and changes

1. An evidence-free product request could reach conversational generation. A
   model could claim that no appropriate products exist while appending a question
   mark, which the old source-less clarification validator accepted. Recognised
   unsupported product requests now receive localised guidance for selection,
   comparison or specifications without a provider call. The conversation parser
   also rejects attempts to borrow delivery-policy evidence for those requests.
   An additional validator rejects common RU/LV/EN invented catalogue-absence
   statements even if a question is appended. This is a bounded check, not a
   complete semantic proof against every possible hallucination.
2. Short follow-ups could reuse a previous product when a newly named brand
   contained no long number. They now must pass the same whole-message vocabulary
   check as read-only catalogue follow-ups. Unknown brands do not inherit facts.
3. Latvian `alerģija` did not match the existing `allerg` safety signal. Added
   Latvian accented/unaccented stems in both general and known-product routes.
4. Latvian inflections of `telts` missed the camping-product route. The domain
   matcher now recognises the stem.
5. Added Anete product guidance for common appliance/model questions without
   intercepting its existing payment/delivery questions. This adds no product facts.
6. Added two verified Bariba examples for a general puppy-food selection question:
   Necon Atletic Puppy (15 kg) and CooKing Puppies Recipe Daily Menu (12 kg).
   Sources are separate and belong only to Bariba. No live price, stock, composition,
   health benefit or individual suitability is inferred. Unknown brands, dietary
   constraints and medical questions cannot silently select these examples.

Sources inspected:
- https://www.bariba.lv/necon-atletic-puppy-sausa-bariba-kuceniem-grusnam-un-laktejosam-kucem-15-kg.html
- https://www.bariba.lv/cooking-grain-free-puppies-recipe-daily-menu-sausa-bariba-kuceniem12-kg.html

## Offline audit

`node scripts/audit-product-coverage.mjs` performs no network/provider operation.
`--output NEW_PATH.json` saves the complete result using exclusive creation, so
existing reports cannot be overwritten. The corpus contains 43 customer questions
in three languages: 129 variants across six shops. The expectations concern
routing, source boundaries and appropriate review, not complete helpfulness.

In this fixed sample after the patch:
- 36 variants return approved evidence.
- 54 provide clarification only, with no product answer.
- 39 require human/specialist review.
- 0 routing/source contract failures.

Clarification and review are not counted as successfully solved customer questions.
These figures are not a random-sample accuracy estimate and do not test live model
wording, deployment, catalogue completeness, current prices or current stock.
The paired JSON records every question, outcome, answer and evidence ID.

## Validation and remaining work

The regression suite covers the new corpus, model-output fault injection, all
three languages, named-product switches, source isolation and budget exhaustion.
Actual workerd/SQLite checks verify that unknown-product questions in all six
shops make no outbound call and reserve no money, including at an exhausted cap.
All provider responses in tests are synthetic.

Final checks: `npm test` — 1,812 passed; `npm run test:worker` — 20 passed;
`npm run build:clients` — five isolated client bundles and the owner inputs
validated, 105 trilingual evidence cards across six shops.

Product readiness still requires catalogue discovery/import and retrieval of
matching products with source URLs, stable product identities, fresh metadata,
clear missing fields and a refresh process. Start with one shop/category and
new questions not used while implementing it, including comparisons, constraints
and multi-turn corrections. Measure answered questions separately from safe
clarifications. Then repeat for the remaining shops. A paid/live phrasing pass
requires separate spending approval and must preserve existing live-50 results.

No API key, password or customer data is included. No paid model call, company
message, counter reset, budget increase or Cloudflare publication was performed.
This release also includes the earlier contact-panel, Lomenti-brand and farewell
fixes. Use the immutable-release preparation script and inspect the receipt before
any separately authorised publication. All six Workers share changed code.

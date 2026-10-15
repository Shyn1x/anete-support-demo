# Anete.lv source register

Checked: 15 October 2026, Europe/Riga. Public information only. This is an independent prototype, not an official Anete.lv product. Summaries describe what the pages state; they do not certify the legal validity of every condition.

| Source | Verified URL | Use |
|---|---|---|
| Delivery | https://anete.lv/piegades-informacija/6/1/i | Delivery methods, parcel limits, uncollected parcels, oversized items |
| Payment | https://anete.lv/maksajuma-veidi/13/1/i | Invoice payment, card payment, conditional cash payment, instalments |
| Returns | https://anete.lv/precu-atgriesana/17/1/i | Withdrawal process, refund timing, inspecting goods |
| Purchase terms | https://anete.lv/noteikumi-un-nosacijumi/3/1/i | Consumer distance-purchase withdrawal and category exceptions |
| Warranty | https://anete.lv/garantija/7/1/i | Manufacturer warranty, documents, defects, consumer claims |
| FAQ | https://anete.lv/buj-biezak-uzdotie-jautajumi/16/1/i | Provisional delivery estimates, collection readiness |
| Contacts | https://anete.lv/kontakti | Public support contact, address, opening times |
| How to order | https://anete.lv/ka-iepirkties/5/1/i | Ordering and confirmation process |

## Conflicts intentionally not resolved by inference

- Opening times vary across contact, payment, collection and warranty sections. The assistant does not promise a collection time. Support hours are distinguished from collection/service hours.
- The payment page offers conditional cash payment while the delivery page describes prepaid collection. Cash availability must be checked at checkout or with an employee.
- Business warranty wording differs between FAQ and the dedicated warranty page. A single universal period is not presented as established.
- Delivery estimates on product pages are provisional. No exact arrival date, stock level or shipping fee is invented.
- Warranty exclusions or return exceptions are not used to issue a final rejection. Contested eligibility goes to a human.

## Curation and refresh procedure

The canonical approved answers are `src/kb.js`: 22 cards, each with RU, LV and EN text and source keys. Raw HTML, the full catalogue and unreviewed Russian translations are not ingested. Translation quality still requires a native Latvian business reviewer before commercial use.

Before a customer demonstration, reopen these eight pages, compare policy changes, update both card languages and the checked date, and rerun tests. The assistant does not browse or automatically refresh policies. Keep old versions in Git. An expired review date should prevent commercial presentation until reviewed.

## Existing chat observation

On 15.10.2026 the homepage and Latvian warranty page were inspected in the browser. No visible embedded chatbot was observed on those pages. A public product-page search result also showed a WhatsApp contact link. This limited observation does not prove the absence of a chatbot across every device, cookie state, page or WhatsApp conversation. No message was sent and no checkout was submitted.

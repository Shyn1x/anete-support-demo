# Lomenti assistant, 17 October 2026

Separate studio assistant for the Lomenti Site. Shop knowledge bases and dialogue
behaviour are unchanged. This feature has not been evaluated with paid model calls.

## Connection

Browser -> Site /api/chat -> signed owner /api/lomenti-chat -> existing BudgetGuard
experiment-v1 -> existing OpenAI Responses API configuration.

Only the Site runtime holds the new P-256 private signing key as a secret named
LOMENTI_SIGNING_KEY. src/studio-public-key.js contains its PUBLIC verification key.
The Site never receives the OpenAI key. No cookie, raw IP or signing secret goes
into the model request. Visitor IP is replaced with a daily HMAC for rate limiting.
ECDSA signatures expire after 30 seconds, and transactional nonce checks prevent
concurrent replay from making a second model request. Tenant-locked Workers return
404 for this route. There is no public CORS endpoint or arbitrary upstream URL.

## Behaviour and limits

Russian, Latvian and English. Up to six bounded previous messages. Scope: Lomenti
services, indicative prices, process, portfolio concepts and contact options.
Known simple greetings, thanks and obvious sensitive-data/injection messages are
handled without provider calls. This is a heuristic privacy filter, not a guarantee
that all personal data will be detected. The Site warns against entering it.

The model returns strict structured JSON with approved fact IDs. Output checks
reject unapproved numbers, links, markup and common claims of sending requests.
These checks do not prove every natural-language factual claim: live human review
is still required. Invalid generation uses approved facts instead of retrying.
Provider failures show contact details. Chat cannot submit a lead; the separate
contact form remains the only submission action.

Same daily/lifetime caps, fixed per-attempt reservation and object ID as shops.
No retries, refunds, new namespace, reset or budget increase. Signed studio calls
share the total cap; per-client rate hashes are a separate studio visitor identity.

## Publication order — separate approval required

1. Prepare the immutable release with scripts/prepare-live-audit-update.mjs.
   This verifies source bytes, tests, worker dry-run and keeps reports/config/secrets.
2. After explicit approval, publish ONLY owner:
   node scripts/publish-live-audit.mjs --receipt RECEIPT_PATH --confirm-publish --owner-only
3. Confirm owner deployment succeeded before deploying the matching saved Lomenti
   Site version with its secret signing key configured. Until then keep the old
   Site published. Five isolated shop Workers need no publication for this feature.
4. Live AI questions need separately approved API spend. A greeting does not call
   OpenAI, but still consumes a normal rate-limit request.

## Checks

Node tests cover three languages, history bounds, privacy/injection preflight,
wrong/expired signatures, tenant isolation, concurrent replay, existing daily and
lifetime exhaustion, disabled AI, provider failure, output rejection and fallback.
Workerd/SQLite tests cover route isolation and nonce serialization. Site tests cover
signature construction, origin checks, bounded input/history, one attempt, UI busy
state, duplicate prevention, reset races, escaped text and budget-error contacts.

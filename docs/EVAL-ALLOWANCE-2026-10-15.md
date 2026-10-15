# One-day evaluation reservation approval

Authorisation: user message on 15 October 2026, 15:00 Riga: “Давай сбросим лимит и сделаем сразу 45”. Implemented as an explicit, bounded supplement preserving historical accounting.

- Fixed authorised date: UTC 2026-10-15 only.
- Fixed extra: $0.90 reserve = 45 model attempts at $0.02 each.
- Default daily maximum today: $1.40 including the existing $0.50.
- Existing daily/lifetime/IP counters are not reset, removed or renamed.
- Lifetime reserve maximum remains $5. If already exhausted, the supplement does not permit further calls.
- Existing ten/minute and 100/day/IP chat limits remain.
- At UTC 2026-10-16 the supplement has no effect and the ordinary $0.50/day reserve ceiling applies.
- No subscription, balance top-up or purchase is performed. Actual provider charges are not measured by this allowance.

The implementation requires a matching config flag and a hardcoded approved date; changing a flag to a future date or adding an oversized amount cannot extend this exception. Later changes require fresh authorisation. Five allowance regressions plus existing guard tests pass.

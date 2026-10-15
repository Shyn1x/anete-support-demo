# Conversation design — 15 October 2026

Public reference: [Airbnb Support AI Assistant](https://www.airbnb.com/help/article/3594), checked 15 October 2026. It describes assistance from help articles, contextual next-step cards and a human option for complex/sensitive issues or on request. This project borrows general support interaction principles, not proprietary Airbnb code, prompts, branding or account integrations. The public article does not establish their exact courtesy implementation.

## Implemented behavior

- Separate customer issue, courtesy, closure, acknowledgement and clarification intents.
- Compose gratitude and farewell in either order, with punctuation, connectors and emoji.
- For unfamiliar wording, use the existing model classifier to choose one of seven approved conversation intents, including “the answer did not help”. Model-authored prose is never displayed.
- A substantive issue takes precedence over social text in the classifier instructions. Mixed policy/dialogue model selections are rejected.
- Unclear input asks a focused question about delivery, payment, return or warranty rather than automatically claiming an employee is needed.
- A closing acknowledges both gratitude and good wishes with one restrained smile. Policy and complaint responses keep their existing neutral tone.
- Courtesy preserves the prior topic. The demo only holds a topic ID in the current browser conversation; no full transcript/history is sent or persisted.
- Human escalation remains mandatory for concrete orders/payments, defects and policy conflicts. It is a clearly labelled simulation, not a connected operator.

## Limits

The local phrase grammar is conservative and not full natural-language understanding. Unfamiliar social wording can consume a paid classifier call; known combinations do not. Semantic correctness requires live evaluation, especially mixed thanks plus unresolved complaints. A legal decision or transaction can never be inferred from a friendly template. Full support workflows, CRM tickets and true multi-turn reasoning are not implemented.

## Acceptance examples

| Message | Expected behavior |
| --- | --- |
| Спасибо, Хорошего Дня! | Пожалуйста, и вам хорошего дня! 🙂 |
| Thanks, have a nice day! | You’re welcome, and have a lovely day too! 🙂 |
| Paldies, jauku dienu! | Lūdzu, arī jums jauku dienu! 🙂 |
| Спасибо, но товар сломался | Defect guidance and human review; never a closing |
| Thanks, where is my order? | Explain order access limit and show human contact |
| Это не помогло | Ask what remains unclear (semantic route) |
| ??? | Ask a focused clarification |

328 automated Node tests and 4 workerd tests pass. Provider semantic tests are mocked and are not a live model score.

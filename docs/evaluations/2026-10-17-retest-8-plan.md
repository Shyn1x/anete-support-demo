# Separately approved eight-case retest

The owner approved up to eight further chat requests ($0.08 reservation at the unchanged $0.01 per provider attempt) after the final historical 50-case report and deployment of commit 2a673123e0916b128d8ca2e88fe9492d64378a27. No budget settings or object identities change.

`run-live-retest-8.mjs` is a local runner only. It needs no new Cloudflare publication. Its default is an offline plan. Live use requires `--run --allow-paid --max-requests 8` and the exact reviewed 50-row report SHA-256. Passwords are hidden local terminal input. It uses the existing public config/login/chat endpoints, not API keys.

Selected IDs: hobbyset-02, apavi40plus-05, apavi40plus-06, apavi40plus-07, rotallieta-04, bariba-05, hobbyset-05, celotajs-07. Canonical intact questions are used, with corrected-input labels for the two historically corrupted questions. Only HobbySet timing reconstructs context from its intact delivery row; this costs no extra request.

The historical file is read-only. Results are independent (`live-retest-8-v1`), not a modified 50-row score. A shared lock prevents concurrent live runners. A persistent batch marker blocks accidental duplicate starts. Pending/ambiguous/blocked requests are never automatically retried. Budget, HTTP or network failures stop the batch; a validation fallback is retained as a failed generation test, without retry, and the batch continues to the next approved case. There is deliberately no automatic resume: inspect any interrupted batch before separately deciding about remaining requests.

The new assessment also applies the current factual/action validator to generated prose so the observed false handoff offer and warranty absence wording are not accepted just for having correct IDs. Complete answers still require human review. A safe reference fallback remains a generation failure, not a silently accepted result.

Offline verification: 1464 Node tests passed. A complete CLI run with a local fetch/password/timer simulation sent exactly eight simulated chat calls, preserved the original report SHA, and blocked a duplicate run without another chat call. The simulation did not call Cloudflare or OpenAI and is not live product acceptance evidence.

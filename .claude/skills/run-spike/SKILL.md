---
name: run-spike
description: Run a time-boxed Cumulus spike that answers one question before an ADR or task spec is written. Invoke manually with /run-spike.
argument-hint: "[question] [time box]"
disable-model-invocation: true
---

Run a spike on: $ARGUMENTS

1. Write down the question in one sentence, the measurable result that
   answers it, and the time box. If no time box was given, ask for one and
   wait.
2. Throwaway code goes only in `.scratch/<name>/` (git-ignored). Touch nothing
   in `packages/` or `apps/`. Install nothing globally; dependencies go in
   that folder's own `package.json`.
3. Measure, do not opine: record the commands, the numbers and the raw output.
4. Write the findings to `docs/spikes/<name>.md` with these sections:
   Question, Method, Results, Conclusion, Recommendation.
5. Stop at the time box even if unfinished, and say what is left.
6. Never copy spike code into `packages/` or `apps/`; a task spec
   re-implements it.
7. Show `docs/spikes/<name>.md` as a diff. Do not commit. Then offer
   `/write-adr` with the result.

---
name: write-adr
description: Draft a new Cumulus architecture decision record (ADR) in docs/decisions/. Use when a design decision, an open question from the PRD, or a spike result needs to be recorded.
argument-hint: "[decision topic]"
---

Draft an ADR for: $ARGUMENTS

1. Read `docs/PRD.md` and every ADR in `docs/decisions/`. List the ADRs this
   decision touches or could contradict. If it contradicts one, stop and ask.
2. Next number = highest existing NNN + 1, three digits. File:
   `docs/decisions/NNN-kebab-title.md`.
3. Follow `docs/templates/adr.md`. Fill every section; delete none.
4. Options: at least two real alternatives, each with pros and cons.
5. Set Status to `Proposed`. Under Decision, write your recommended option and
   mark it "Proposed until the maintainer confirms". Never mark an ADR
   `Accepted` yourself.
6. If a claim needs measuring (performance, size, compatibility), do not
   guess. Say a spike is needed, stop, and offer `/run-spike`.
7. Show the new file as a diff. Do not commit.

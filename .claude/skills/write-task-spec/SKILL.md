---
name: write-task-spec
description: Draft a Cumulus task spec in docs/specs/ for one unit of work. Use when the user wants to define or plan a task before implementing it.
argument-hint: "[task description]"
---

Draft a task spec for: $ARGUMENTS

1. Read `docs/PRD.md`: find the milestone and its acceptance criteria. Read
   the ADRs that apply.
2. If an ADR the task depends on is missing or still `Proposed`, stop and say
   which one.
3. Next number = highest existing NNN in `docs/specs/` + 1, three digits
   (create the folder if absent). File: `docs/specs/NNN-kebab-title.md`.
4. Follow `docs/templates/task-spec.md`. Fill every section.
5. Quality bar:
   - one outcome per spec;
   - the Files list is exhaustive;
   - every acceptance test is runnable, with exact expected values;
   - Out of scope names the nearest tempting extras.
6. If the task has more than one outcome or touches many unrelated files,
   propose a split as a list instead of writing one large spec.
7. End with open questions for the maintainer. Do not answer them yourself.
8. Show the new file as a diff. Do not commit.

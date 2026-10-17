# CLAUDE.md

Cumulus is an open-source (MIT) vector editor and animation toolkit for
mascots, icons and UI motion, targeting React Native and the web. Assets are
plain-text, schema-validated JSON. Phase: planning, no code yet.

## Start of every session

1. Read `docs/PRD.md` (scope, milestones, non-goals).
2. List `docs/decisions/` and read the ADRs that touch the task.
3. If the task has a spec, read it in `docs/specs/`. A non-trivial change with
   no spec: say so and offer to write the spec first.
4. Run `git status` and `git log -5 --oneline`.
5. Restate the task in two lines and name the files you expect to touch.
   Wait for a correction before editing.

## Where things live

| Need                              | Read                                       |
| --------------------------------- | ------------------------------------------ |
| Scope, milestones, non-goals      | `docs/PRD.md`                              |
| Decisions already made            | `docs/decisions/NNN-*.md`                  |
| Planned code layout               | `docs/decisions/001-repo-structure.md`     |
| Write an ADR                      | `docs/templates/adr.md`                    |
| Write a task spec                 | `docs/templates/task-spec.md`              |
| Existing task specs               | `docs/specs/`                              |
| Spike results                     | `docs/spikes/`                             |
| Branches, commits, pull requests  | `CONTRIBUTING.md`                          |

Docs beat chat history. If two docs contradict each other, stop and ask.

## Terms

- **ADR**: architecture decision record in `docs/decisions/`.
- **Spike**: time-boxed experiment that removes one unknown before a spec is
  written. Throwaway code lives in git-ignored `.scratch/<name>/`; the result
  is a note in `docs/spikes/<name>.md`.
- **Task spec**: the contract for one unit of work, in `docs/specs/`.
- **Milestone**: M1 to M4 in the PRD.
- **Nimbus**: a separate mascot and the first asset built with Cumulus. Never
  put Nimbus-specific logic in the core.

## Stop and ask

Do not decide alone. Stop and ask the maintainer when:

- a spec, ADR or the PRD is silent on something you need, or they conflict;
- you need a new dependency, package or top-level folder;
- a change touches the file format, the public API or package boundaries;
- the work needs a file outside the spec's "Files" list;
- the request falls outside the PRD scope or inside its non-goals;
- an acceptance test can only pass by changing the test.

Ask once, with the options and your recommendation.

## Working rules

- One task spec per session. Stay inside its "Files" list. List extra ideas at
  the end as suggestions; do not implement them.
- Resolve unknowns with a spike before the spec, never during implementation.
- Before each feature: a minimal version and a written acceptance criterion.
- No dependency without an ADR.
- Use `/write-adr`, `/write-task-spec` and `/run-spike` for those documents
  instead of improvising the format.
- Layout (ADR-001): `core` imports nothing from the DOM or React Native;
  renderers and the editor depend on `core`, never the reverse; renderers do
  not depend on each other; packages stay `"private": true` until M4.

## Definition of done

- The spec's acceptance tests pass. Show the command and its output as
  evidence; do not just say it works.
- Docs are updated, and an ADR is added or updated if a decision changed.
- The diff is shown for review. Nothing is committed unless asked.
- The final message has: what changed, the evidence, and open questions.

## Conventions

- TypeScript in strict mode.
- Code, comments and all repository documentation are written in English.
- Install nothing globally. Use project-local tooling only (npm workspaces,
  `npx`, Docker if needed).
- Commands: none yet. Add install, build, test and lint here at M1.
- Commit and branch style: see `CONTRIBUTING.md`.
- Mark unfinished text in documents as `<<REPLACE: ...>>`.

## Git

- Never overwrite uncommitted work. Never commit or push unless asked.
- Commits that Claude writes, or proposes for the maintainer, end with this
  trailer and nothing else generated:

  `Co-Authored-By: Claude <noreply@anthropic.com>`

- No session links, "Generated with" lines or other generated attribution in
  commits or pull request descriptions.

## Compaction

When compacting, always keep: the current task spec and its goal, the list of
modified files, open questions waiting for the maintainer, and the test
commands run with their results.

## Working with the maintainer

- The maintainer chats in Spanish; repository content stays in English.
- Keep answers short: the answer first, then a brief reason. Prefer tables and
  lists to long prose.
- Question ideas: state risks before implementing and propose a better option
  when one exists.

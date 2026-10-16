# Contributing to Cumulus

Thanks for your interest in Cumulus. This project is in its planning phase,
so the most useful contributions right now are feedback on the plan, ideas,
and well-described issues.

By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to help

- Review the [PRD](docs/PRD.md) and the [decision records](docs/decisions/)
  and open an issue with questions or objections.
- Report bugs and suggest features once there is code to try.
- Improve documentation.
- Pick up an issue labeled `good first issue` or `help wanted`.

## Before you start

1. Search existing issues and pull requests to avoid duplicates.
2. For anything larger than a small fix, open an issue first and wait for
   feedback before writing code.
3. Check the PRD non-goals. Proposals outside the scope may be declined.

## Reporting bugs

Use the bug report template. Include steps to reproduce, expected and actual
behavior, your environment, and a minimal asset file when relevant.

## Suggesting features

Use the feature request template. Describe the problem first, then the
solution. Explain which PRD goal or milestone it supports.

## How we work

Cumulus is built spec-first:

```
PRD  ->  decision records (ADR)  ->  task spec  ->  pull request
```

- Open questions are resolved with an ADR in `docs/decisions/`, using a short
  spike when needed.
- Each pull request implements one task spec: goal, inputs and outputs,
  files to touch, acceptance tests, and what is out of scope.
- If the spec is silent on something, ask in the issue instead of guessing.
- New dependencies need an ADR.

## Development setup

<!-- Fill in when the monorepo scaffolding lands (milestone M1). -->

Requirements, install steps and test commands will be documented here.
Tooling is always project-local. Do not rely on global installs.

## Branches and commits

- Branch from `main`: `feat/short-name`, `fix/short-name`, `docs/short-name`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  (proposed): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- Keep pull requests small and focused on one change.

## Pull request checklist

- [ ] Linked issue or task spec
- [ ] Tests added or updated, and passing
- [ ] Documentation updated
- [ ] ADR added or updated if a decision changed
- [ ] No new dependency without an ADR

## Code and documentation style

- TypeScript in strict mode.
- Code, comments and public documentation are written in English.
- Follow the formatter and linter configuration once it exists.

## AI-assisted contributions

AI-assisted work is welcome. You are responsible for everything you submit:
review it, run the tests, and make sure you understand it. Mention in the pull
request when AI tools were used for a significant part of the change.

## Questions

<!-- Replace with GitHub Discussions once enabled. -->

Open an issue with the `question` label.

## License of contributions

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).

# TASK-002: CI workflow

- Status: Done
- Milestone: M1
- Decisions that apply: ADR-001 (rule 5), ADR-004, ADR-005

## Goal

Every pull request and every push to `main` runs `npm ci`, typecheck,
lint and tests on Ubuntu and Windows for each Node line in `engines`,
and any failing command fails the run.

## Inputs and outputs

Output: one workflow file, `.github/workflows/ci.yml`, exactly this:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  check:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest]
        node: [22, 24, 26]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version: ${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
```

Where each line comes from (reasons and their sources are in ADR-005):

| Lines                                   | ADR-005 rule | Values on 2026-10-17                                                       |
| --------------------------------------- | ------------ | -------------------------------------------------------------------------- |
| `on:`                                   | 1            |                                                                            |
| `run:` steps                            | 2            | `npm test` relies on GitHub's `CI=true`                                    |
| `strategy:`                             | 3            | First run resolved 22.23.3, 24.21.0, 26.12.0: setup-node takes the runner's cached release of a line, which can trail [S3] by days |
| `permissions:`                          | 4            |                                                                            |
| `persist-credentials: false`            | 5            |                                                                            |
| `cache: npm`                            | 6            | Needed explicitly: the root `package.json` has no `packageManager` field   |
| `uses:`                                 | 7, 8         | Latest releases: checkout v7.0.1 [S1], setup-node v7.1.0 [S2]              |

Notes for the implementer:

- Biome 2.5.15 knows YAML but its YAML formatter is off by default
  (checked: "The content was not formatted because the formatter is
  currently disabled"). If `npm run lint` reports `ci.yml`, stop and ask;
  `biome.json` is not in the Files list.
- Checks are named by GitHub as `check (<os>, <node>)`.

## Files

- CREATE: `.github/workflows/ci.yml` (the YAML above, verbatim)
- EDIT: `docs/specs/002-ci-workflow.md` (Status `Done`, tick the
  acceptance tests)
- DO NOT TOUCH: everything else

## Acceptance tests

Each test is pass/fail and runnable. `<pr>` is the implementation PR,
`<run>` its latest CI run id (`gh run list --workflow ci.yml --limit 1`).

Local, before opening the PR:

- [x] Precondition, ADR-005 rule 10 still applied:
      `gh api repos/DreGi0/cumulus/actions/permissions --jq '"\(.enabled) \(.allowed_actions) \(.sha_pinning_required)"'`
      prints `true selected true`, and
      `gh api repos/DreGi0/cumulus/actions/permissions/selected-actions --jq .github_owned_allowed`
      prints `true`.
- [x] `npm run lint` exits 0 with the new file present.
- [x] Every action is pinned: `grep -c 'uses:' .github/workflows/ci.yml`
      prints `2`, and
      `grep -cE 'uses: actions/(checkout|setup-node)@[0-9a-f]{40} # v[0-9]+\.[0-9]+\.[0-9]+$' .github/workflows/ci.yml`
      prints `2`.
- [x] The SHAs match their tags:
      `gh api repos/actions/checkout/commits/v7.0.1 --jq .sha` prints
      `3d3c42e5aac5ba805825da76410c181273ba90b1`;
      `gh api repos/actions/setup-node/commits/v7.1.0 --jq .sha` prints
      `949feb2413d6458794dcd2491c4babbbce0c15c1`.

On the implementation PR:

- [x] `gh pr checks <pr> --json name,bucket --jq 'sort_by(.name)[] | "\(.name) \(.bucket)"'`
      prints exactly:

      ```
      check (ubuntu-latest, 22) pass
      check (ubuntu-latest, 24) pass
      check (ubuntu-latest, 26) pass
      check (windows-latest, 22) pass
      check (windows-latest, 24) pass
      check (windows-latest, 26) pass
      ```

- [x] Every job ran the four commands in order:
      `gh run view <run> --json jobs --jq '.jobs[] | "\(.name): \([.steps[] | select(.name | startswith("Run npm")) | .name] | join(", "))"'`
      prints six lines ending in
      `Run npm ci, Run npm run typecheck, Run npm run lint, Run npm test`.
- [x] Token scope: `gh run view <run> --log | grep -A2 "GITHUB_TOKEN Permissions"`
      shows only `Contents: read` and `Metadata: read` for each job.
- [x] Cache: after `gh run rerun <run>`, the log of every job contains
      `Cache restored from key:`.

After merge:

- [ ] `gh run list --workflow ci.yml --event push --branch main --limit 1 --json headSha,conclusion`
      returns `conclusion` `success` and `headSha` equal to
      `git rev-parse origin/main`. Checked after merge.

Negative tests (manual, not committed): a throwaway draft PR from a
branch off the implementation branch, closed without merging, branch
deleted.

- [x] N1, Windows line endings: a commit that deletes `.gitattributes`
      → the three `windows-latest` jobs fail at `Run npm run lint` with
      `Formatter would have printed the following content`; the three
      `ubuntu-latest` jobs pass. If the Windows jobs pass, the runner does
      not convert line endings: stop and report.
- [x] N2, CI mode: a next commit that restores `.gitattributes` and
      deletes `packages/core/schema/asset.v1.schema.json` → all six jobs
      fail at `Run npm test` with
      ``Snapshot `committed JSON Schema matches the Zod schema 1` mismatched``.
      Outside CI mode Vitest would write the missing file and pass.
      (Checked locally on 2026-10-17: `CI=true npm test` on Node 22.23.3
      gives this error and exit 1; a CRLF `index.ts` makes
      `npm run lint` fail with the N1 message.)

Verification commands: the `gh` and `grep` commands above, plus, from a
clean clone:

```sh
npm ci
npm run lint        # exit 0
```

## Out of scope

- Making the checks required to merge. The `main-protection` ruleset
  only blocks deletion and force pushes today. It is a repository
  setting, best done once the check names above are stable (ADR-005).
- Dependabot (`.github/dependabot.yml`) to update the pinned SHAs and npm
  dependencies: own task.
- Workflow lockfile (`.github/workflows/actions.lock`): public preview,
  revisit at general availability (ADR-005).
- `concurrency` (cancel superseded runs), `timeout-minutes`,
  `workflow_dispatch`, scheduled runs.
- macOS runners; testing the exact `engines` floor `22.12.0`; pinning
  runner images (`ubuntu-24.04`, `windows-2025`).
- Workflow linters (actionlint, zizmor): new tools, need an ADR.
- README badge and the "Development setup" sections of README and
  CONTRIBUTING: separate PR.
- Build, coverage and publishing: M4.

## If the spec is silent

Stop and ask. Do not add dependencies or make design decisions.

## Sources

Checked on 2026-10-17. Sources for the policy are in ADR-005.

- [S1] actions/checkout v7.0.1 (2026-07-20; the `v7` tag points to the
  same commit): https://github.com/actions/checkout/releases/tag/v7.0.1
- [S2] actions/setup-node v7.1.0 (2026-10-08):
  https://github.com/actions/setup-node/releases/tag/v7.1.0
- [S3] Node.js release index: https://nodejs.org/dist/index.json

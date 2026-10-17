# ADR-005: Continuous integration

- Status: Accepted
- Date: 2026-10-17

## Context

ADR-004 left continuous integration as its own task "when there is code
to check". TASK-001 put `@cumulus/core` on `main`, so there is. TASK-002
adds a workflow that runs the CLAUDE.md commands (`npm ci`,
`npm run typecheck`, `npm run lint`, `CI=true npm test`) on every pull
request and every push to `main`. This ADR sets the rules for that
workflow and for any later one.

Constraints:

- Windows: a clone with `core.autocrlf=true` failed lint on CRLF until
  `.gitattributes` was added (TASK-001). GitHub's Windows image installs
  Git for Windows with its default line-ending setting, so it reproduces
  that setup.
- Node: `engines` is `^22.12.0 || ^24.0.0 || >=26.0.0` (ADR-004 rule 1).
- Supply chain: an action runs its own code inside the job, with the
  job's token. A tag can be moved or deleted by whoever controls the
  action's repository. "No dependency without an ADR" (CLAUDE.md) applies
  to actions; this ADR is that record.
- Repository today (`gh api`, 2026-10-17): public; default token
  permission `read`; `allowed_actions: all`; `sha_pinning_required:
  false`.
- One maintainer: every moving part must earn its place (ADR-004).

Facts checked on 2026-10-17:

- Latest releases: `actions/checkout` v7.0.1 (2026-07-20),
  `actions/setup-node` v7.1.0 (2026-10-08)
  ([checkout](https://github.com/actions/checkout/releases),
  [setup-node](https://github.com/actions/setup-node/releases)).
- Node lines: 22 maintenance until 2027-04-30, 24 maintenance from
  2026-10-20, 26 LTS from 2026-10-28, 27 released 2027-04-22
  ([schedule](https://github.com/nodejs/Release/blob/main/schedule.json)).
- GitHub recommends pinning actions to a commit SHA and granting the
  token the minimum permissions; tags can be moved or deleted
  ([secure use](https://docs.github.com/en/actions/reference/security/secure-use)).
- Repository settings can require SHA pinning and restrict which actions
  run ([changelog, 2025-08-15](https://github.blog/changelog/2025-08-15-github-actions-policy-now-supports-blocking-and-sha-pinning-actions/),
  [REST API](https://docs.github.com/en/rest/actions/permissions)).
- Workflow lockfiles (`.github/workflows/actions.lock`) are in public
  preview since 2026-10-14; the `gh-actions-lock` CLI is pre-1.0 and its
  format may change
  ([changelog](https://github.blog/changelog/2026-10-14-github-actions-workflow-lockfiles-in-public-preview/),
  [gh-actions-lock](https://github.com/github/gh-actions-lock)).
- GitHub sets `CI=true` on every runner
  ([variables](https://docs.github.com/en/actions/reference/workflows-and-actions/variables));
  `pwsh` is the default shell on Windows
  ([workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)).
- Standard GitHub-hosted runners are free for public repositories
  ([billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)).
- setup-node caches the npm download cache, not `node_modules`, and
  advises turning caching off in workflows with elevated privileges or
  secrets ([README](https://github.com/actions/setup-node/blob/main/README.md)).
- The Windows image's Git install passes no line-ending option
  ([Install-Git.ps1](https://github.com/actions/runner-images/blob/main/images/windows/scripts/build/Install-Git.ps1)).

## Spike notes

None needed: these are policy choices, not measurements. Two assumptions
are checked by TASK-002's negative tests instead of a spike: the Windows
runner converts line endings when `.gitattributes` is missing (N1), and
`npm test` runs in CI mode there (N2). Both failure cases already
reproduce locally on Windows with Node 22.23.3.

## Options considered

| Topic           | Option                                              | Pros                                                                           | Cons                                                                                   |
| --------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Service         | **GitHub Actions** (chosen)                         | The repository is on GitHub; native pull request checks; free for public repositories | Workflows are GitHub-specific YAML                                                   |
|                 | External CI service                                 | Not tied to GitHub                                                             | Another account and integration to maintain                                            |
| Matrix          | **Ubuntu and Windows × Node 22, 24, 26** (chosen)   | Every `engines` line on both systems; shortest YAML                            | Six jobs per run; Windows jobs are the slowest                                         |
|                 | Ubuntu × 3 lines + Windows × 1 line                 | Four jobs                                                                      | Needs an `include` list; a Windows failure on another Node line goes unseen            |
|                 | Both systems, Node 22 only                          | Two jobs                                                                       | Node 24 and 26 untested                                                                |
| Action refs     | **Full commit SHA plus version comment** (chosen)   | Immutable; recommended by GitHub; enforceable by a repository setting          | Manual updates until Dependabot is set up                                              |
|                 | Version tag (`@v7`)                                 | Picks up fixes with no PR                                                      | Whoever controls the action's repository can move the tag to other code               |
|                 | Workflow lockfile (`actions.lock`)                  | Also pins transitive actions; Dependabot updates it                            | Public preview for 3 days; pre-1.0 CLI; format may change                              |
| Allowed actions | **GitHub-owned only, each listed here** (chosen)    | Smallest trust surface; a repository setting enforces it                       | A third-party action needs an ADR update and a settings change                         |
|                 | All actions (current setting)                       | No friction                                                                    | Any pull request can add any action; only review stops it                              |

## Decision

CI runs on **GitHub Actions**. Rules:

1. One workflow, `.github/workflows/ci.yml`, triggered by
   `pull_request` and by `push` to `main`.
2. Each CLAUDE.md command is its own step: `npm ci`,
   `npm run typecheck`, `npm run lint`, `npm test`. The test step relies
   on the `CI=true` that GitHub sets; the inline `CI=true npm test` form
   does not parse in `pwsh`.
3. Matrix: `ubuntu-latest` and `windows-latest` × every released Node
   line in `engines` (today `22`, `24`, `26`), with `fail-fast: false`.
   Each line runs the version setup-node resolves: the runner's cached
   release of that line, which can trail the newest by a few days. A
   patch behind does not matter for a range set per major version. A PR
   that changes `engines` changes the matrix.
4. `permissions: contents: read` at workflow level. A job that needs more
   declares it in its own `permissions` block.
5. `actions/checkout` runs with `persist-credentials: false`. Workflows
   do not push.
6. `actions/setup-node` uses `cache: npm`. A workflow with secrets or
   write permissions sets `package-manager-cache: false` and no `cache`.
7. Only GitHub-owned actions are allowed. In use: `actions/checkout`,
   `actions/setup-node`. Adding any action, GitHub-owned or not, updates
   this list in an ADR.
8. Every `uses:` is pinned to a full 40-character commit SHA with the
   release as a comment, for example
   `uses: actions/checkout@<sha> # v7.0.1`. The SHA is resolved from the
   action's own repository:
   `gh api repos/<owner>/<action>/commits/<tag> --jq .sha`.
9. Until a Dependabot task exists, updates are manual: move to the latest
   release, resolve its SHA with rule 8, read the release notes, in a
   `chore:` pull request.
10. Repository settings enforce rules 7 and 8. Applied on 2026-10-17,
    before the TASK-002 implementation PR, with:

    ```sh
    gh api -X PUT repos/DreGi0/cumulus/actions/permissions \
      -F enabled=true -f allowed_actions=selected -F sha_pinning_required=true
    gh api -X PUT repos/DreGi0/cumulus/actions/permissions/selected-actions \
      -F github_owned_allowed=true -F verified_allowed=false
    ```

## Consequences

- Easier: a CRLF regression on Windows, a stale JSON Schema (ADR-003
  rule 5) or a type error fails the pull request before merge.
- Easier: a moved tag or a compromised release tag cannot change what
  runs; an unpinned or non-GitHub action fails the run once rule 10 is
  applied.
- Harder: pinned SHAs go stale silently until the Dependabot task. Do
  that task before M2.
- Harder: six jobs per run. If waiting becomes a problem, drop Windows to
  one Node line (option 2 above) in an ADR update.
- Revisit by 2027-04-30: Node 22 reaches end of life (ADR-004) and Node
  27 ships on 2027-04-22; one PR raises `engines` and updates the matrix.
- Revisit when workflow lockfiles reach general availability: GitHub's
  docs say a lockfile supersedes SHA pinning for repositories that adopt
  it, which could replace rules 8 and 9.
- Revisit after TASK-002 merges: make the six checks required in the
  `main-protection` ruleset, once their names are stable.

## Out of scope

- Required status checks in the `main-protection` ruleset: a settings
  change after TASK-002.
- Dependabot for actions and npm: own task.
- Workflow linters (actionlint, zizmor): new tools, own ADR.
- Release and publishing workflows: M4, own ADR (they need write
  permissions and, by rule 6, no cache).
- Runners other than standard GitHub-hosted Ubuntu and Windows (macOS,
  larger or self-hosted).

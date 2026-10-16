# ADR-001: Repository structure

- Status: Proposed
- Date: 2026-10-16

## Context

Cumulus has several deliverables that share one data format: a core
library, renderers for web and React Native, and a browser editor
(see PRD milestones M1 to M4). It is built and maintained by one
person, and the file format will change often early on.

## Decision

A single monorepo using **npm workspaces**, TypeScript in strict mode.

```
cumulus/
  package.json            # workspaces: ["packages/*", "apps/*"]
  packages/
    core/                 # schema, types, parse and validate
      fixtures/           # hand-written sample assets (tests, renderers)
    renderer-web/         # draws an asset on the web
    renderer-rn/          # React Native component
  apps/
    editor/               # browser editor
  docs/
    PRD.md
    decisions/
```

Rules:

1. `core` has no runtime dependency on the DOM or React Native.
2. `renderer-web`, `renderer-rn` and `editor` may depend on `core`;
   `core` never depends on them.
3. Renderers never depend on each other.
4. Packages stay `"private": true` until M4 (publishing under the
   `@cumulus/` scope).
5. No tool is installed globally; all tooling is project-local.

## Options considered

| Option                       | Why not                                                          |
| ---------------------------- | ---------------------------------------------------------------- |
| Separate repos per package   | Every format change needs several coordinated PRs                |
| pnpm / Turborepo / Nx        | Extra tooling with no current need; npm workspaces ships with npm |
| One package with folders     | Cannot publish core and renderers separately (PRD M4)            |

## Consequences

- One change can touch the format, core and renderers atomically.
- Revisit the build tooling if build or test times become a problem.
- Choices below are out of scope here and get their own ADR or spike:
  file format and schema, animation model, rendering technology,
  editor framework, test runner.

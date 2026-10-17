# ADR-001: Repository structure

- Status: Accepted
- Date: 2026-10-16

## Context

Cumulus has several deliverables that share one data format: a core
library, renderers for web and React Native, and a browser editor
(see PRD milestones M1 to M4). M1 also needs a web page and a React
Native app to show the renderers working. Nimbus (PRD section 6) is a
consumer of the tool and must stay out of the core. Cumulus is built and
maintained by one person, and the file format will change often early on.

## Spike notes

None. Expo documents automatic Metro configuration for npm workspaces
from SDK 52, which removes the usual React Native monorepo setup. This
gets checked when `apps/playground-rn` is created; the choice of Expo or
bare React Native is its own ADR.

## Options considered

| Option                         | Pros                                       | Cons                                                    |
| ------------------------------ | ------------------------------------------ | ------------------------------------------------------- |
| **npm workspaces monorepo** (chosen) | Ships with npm; one PR changes format, core and renderers | Fewer features than dedicated monorepo tools            |
| Separate repos per package     | Clear boundaries                           | Every format change needs several coordinated PRs       |
| pnpm / Turborepo / Nx          | Faster installs, task caching              | Extra tooling with no current need                      |
| One package with folders       | Simplest setup                             | Cannot publish core and renderers separately (PRD M4)   |
| Nimbus in its own repo now     | Proves import from outside the monorepo    | Packages are unpublished until M4, so it cannot install them |

## Decision

A single monorepo using **npm workspaces**, TypeScript in strict mode.

```
cumulus/
  package.json            # workspaces: ["packages/*", "apps/*"]
  packages/
    core/                 # format, types, parse, validate, serialize
      fixtures/           # hand-written sample assets (tests, renderers)
    renderer-web/         # draws an asset on the web
    renderer-rn/          # React Native component
  apps/
    editor/               # browser editor
    playground-web/       # web page that displays assets (M1)
    playground-rn/        # React Native app that displays assets (M1)
  examples/
    nimbus/               # Nimbus asset files only, made with the editor
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
6. Playground apps are for development only, are never published, and
   may depend on any package.
7. `examples/` holds asset files only, no code, and is not a workspace.
   No package reads from it; playgrounds may load its files.

## Consequences

- One change can touch the format, core and renderers atomically.
- M1 acceptance can be shown end to end in both playgrounds.
- Nimbus stays a consumer: if it needs core logic, that logic must be
  generic or it does not go in.
- Revisit the build tooling if build or test times become a problem.
- Revisit at M4: check the `@cumulus` npm scope is available; move
  Nimbus to its own repo once packages are published, to prove import
  from outside.

## Out of scope

Each gets its own ADR or spike: file format (ADR-002), schema library,
animation model, rendering technology, editor framework, React Native
toolchain (Expo or bare), test runner.

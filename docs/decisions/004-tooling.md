# ADR-004: Tooling

- Status: Accepted
- Date: 2026-10-16

## Context

M1 needs commands to install, typecheck, test and lint (CLAUDE.md,
"Commands"). ADR-001 left the test runner and build tooling open and
requires project-local tools only. ADR-003 rule 5 needs a test that fails
when the committed JSON Schema drifts from the Zod schema. The project is
maintained by one person, so every tool must earn its place.

In October 2026 the TypeScript ecosystem is mid-transition: TypeScript 7
(native compiler) is GA but has no stable JavaScript API until 7.1, and
typescript-eslint does not install next to it yet.

## Spike notes

Full results in `docs/spikes/tooling.md`. TypeScript 7.0.2, Vitest 5.0.5,
Biome 2.5.15 and Zod 4.6.7 install and pass together in npm workspaces on
Windows, with packages that export TypeScript source. Using `document` in
`core` fails the typecheck. A stale JSON Schema file fails the tests
locally and in CI. Biome reformats arrays in JSON written by
`JSON.stringify`, so it must not touch serializer-owned files.

## Options considered

| Topic          | Option                                         | Pros                                                                 | Cons                                                                                   |
| -------------- | ---------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| TypeScript     | **7.0** (chosen)                               | Current major, 8–12× faster; already verified with Zod; no later migration | No stable JS API until 7.1; tools that import `typescript` may not work yet            |
|                | 6.0                                            | Every tool works today                                               | Bridge release; a second migration within months                                       |
| Lint, format   | **Biome 2** (chosen)                           | One tool for lint and format; does not depend on the TS API; a11y and React rules for M2 | Its own type inference is partial; smaller plugin ecosystem                            |
|                | ESLint + typescript-eslint + Prettier          | Most complete rule set                                                | Blocked on TS 7 until typescript-eslint supports 7.1; three tools, more config          |
|                | Oxlint + tsgolint + Prettier                   | Type-aware rules on TS 7 today                                        | Needs a separate formatter; type-aware backend is new                                  |
| Tests          | **Vitest 5** (chosen)                          | Runs TS source directly; workspace projects; file snapshots; DOM and browser modes later | One more dependency                                                                    |
|                | `node:test`                                    | No dependency                                                        | No file snapshots; TS needs Node type stripping and `.ts` imports; no DOM environment for renderers |
|                | Jest                                           | Mature, used by React Native                                          | Slower; ESM and TS need extra config                                                   |
| Build          | **None until M4** (chosen)                     | No build step; one source of truth; Vite, Metro and Vitest compile TS | Packages cannot be consumed outside the monorepo                                       |
|                | Build each package now                         | Ready to publish                                                      | Build config and output to maintain with no consumer until M4                          |

## Decision

1. **Node**: root `engines` is `^22.12.0 || ^24.0.0 || >=26.0.0`
   (Vitest 5's range), enforced with `engine-strict=true` in `.npmrc`.
   Node 22's end of life is 2027-04-30; raise the minimum before then.
2. **Dependencies**: `typescript@~7.0`, `vitest@^5`, `@biomejs/biome@^2`
   are root dev dependencies. Packages list only their runtime
   dependencies. `package-lock.json` is committed.
3. **TypeScript**: `tsconfig.base.json` with `strict`,
   `noUncheckedIndexedAccess`, `noImplicitOverride`, `target: es2023`,
   `module: preserve`, `moduleResolution: bundler`,
   `verbatimModuleSyntax`, `isolatedModules`, `erasableSyntaxOnly`,
   `noEmit`, `skipLibCheck`.
4. **Per-package boundaries**: each package has a `tsconfig.json` that
   extends the base and sets its own `lib` and `types`. `core` uses
   `lib: ["es2023"]` and `types: []`, so a DOM or React Native global in
   `core` is a compile error (ADR-001 rule 1).
5. **Imports** have no file extension (bundler resolution), so the same
   source works in Vite, Metro and Vitest.
6. **No build until M4**: each package's `exports` points to
   `./src/index.ts`. Publishing at M4 adds a build in its own ADR.
7. **Tests**: `*.test.ts` files next to the code, typechecked with it.
   One root `vitest.config.ts` with `projects: ["packages/*", "apps/*"]`.
   The committed JSON Schema is checked with `toMatchFileSnapshot`;
   `npx vitest run -u` regenerates it.
8. **Lint and format**: Biome with its recommended rules. It excludes
   `**/fixtures`, `**/schema` and `**/*.cumulus.json`, which belong to
   core's serializer (ADR-002 rule 12).
9. **Root scripts**: `typecheck` (`tsc -p .` in every workspace),
   `test` (`vitest run`), `lint` (`biome check .`), `format`
   (`biome check --write .`). The M1 task adds them to CLAUDE.md.

## Consequences

- Easier: three dev tools in total, no build, and the package
  boundaries from ADR-001 are checked by the compiler.
- Easier: no migration from TypeScript 6 later.
- Harder: no type-aware lint rules (for example floating promises)
  until a tool supports TypeScript 7; `strict` and tests cover the gap
  for now.
- Revisit after TypeScript 7.1 (planned November 2026), or when M2
  editor code is async-heavy: add type-aware linting with Oxlint
  type-aware or typescript-eslint, whichever then supports TS 7.
- Revisit in the `playground-rn` ADR: confirm the Expo toolchain works
  with TypeScript 7 in the workspace.

## Out of scope

- Build and publishing setup: M4, own ADR.
- Continuous integration (GitHub Actions): own task when there is code
  to check.
- React Native toolchain (Expo or bare): own ADR.
- Editor framework and rendering technology: own ADRs.

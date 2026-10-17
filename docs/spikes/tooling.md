# Spike: tooling

- Date: 2026-10-16
- Time box: 1 hour (used: about 30 minutes)
- Code: `.scratch/tooling/` (git-ignored, throwaway)

## Question

Do TypeScript 7, Vitest 5, Biome 2 and Zod 4 work together in an npm
workspaces monorepo on Windows, with packages that export TypeScript
source and no build step, and can they enforce ADR-001 rule 1 and
ADR-003 rule 5?

Measurable answer:

1. install, typecheck, test and lint all pass on a minimal `core`;
2. using a DOM global in `core` fails the typecheck;
3. a schema change without updating the committed JSON Schema fails the
   tests, locally and with `CI=true`;
4. how Biome formats JSON written by `JSON.stringify(value, null, 2)`
   (the ADR-002 canonical output) and by npm (`package.json`).

## Method

- Node 22.23.3, npm 10.9.9, Windows 11.
- Versions: `typescript@7.0.2`, `vitest@5.0.5`, `@biomejs/biome@2.5.15`,
  `zod@4.6.7`.
- Layout: root `package.json` with `workspaces: ["packages/*"]`,
  `tsconfig.base.json`, `vitest.config.ts` with `projects`, `biome.json`;
  `packages/core` exports `./src/index.ts`, its `tsconfig.json` sets
  `lib: ["es2023"]` and `types: []`.
- `core` defines a small Zod schema; a test compares
  `z.toJSONSchema` output with `schema/asset.v1.schema.json` using
  `toMatchFileSnapshot`.
- Commands: `npm install`, `npm run typecheck` (`tsc -p .` per
  workspace), `npx vitest run`, `CI=true npx vitest run`,
  `npx vitest run -u`, `npx biome check .`,
  `npx biome format --stdin-file-path=x.json`.

## Results

| Check                                               | Result                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| Install (npm workspaces, 4 dev and 1 runtime deps)   | Pass, 0 vulnerabilities                                                |
| Typecheck with TS 7.0.2, tests included              | Pass                                                                   |
| Vitest 5 runs TS source across the workspace         | Pass, 2/2 tests; first run writes the schema file                      |
| `document.title` in `core`                           | Fails: `TS2584: Cannot find name 'document'`                           |
| Schema changed, file not updated                     | Fails locally and with `CI=true`: "Snapshot … mismatched"              |
| `vitest run -u`                                      | Rewrites the schema file                                               |
| Biome check after `--write`                          | Pass                                                                   |
| Biome on `JSON.stringify(…, null, 2)` output         | Rewrites it: collapses `"required": ["version", "width", "height"]` onto one line |
| Biome on `package.json` after `npm pkg set`          | No change needed                                                       |
| `engine-strict=true` with root `engines: >=99`       | `npm install` fails: `EBADENGINE`; passes with the real range          |
| Vitest `projects: ['packages/*', 'apps/*']`, no `apps/` | Pass; the missing folder is ignored                                 |

Research, not measured here:

- TypeScript 7.0 (GA July 2026) ships no stable JavaScript API; it is
  planned for 7.1 (stable planned for November 24, 2026).
- `typescript-eslint@8.71.2` declares `typescript: >=4.8.4 <6.1.0`, so
  it does not install next to TypeScript 7.
- Oxlint's type-aware mode (`oxlint-tsgolint` v7, built on the TS 7
  compiler) is stable and covers 59 of 61 typescript-eslint type-aware
  rules.
- Vitest 5 requires Node `^22.12.0 || ^24.0.0 || >=26.0.0`. Node 22
  reaches end of life on 2027-04-30.
- Expo SDK 56 changed its CLI's TypeScript resolution to support TS 6
  and "prepare for TypeScript 7".

## Conclusion

The four tools work together with no build step and no workarounds.
The per-package `lib` setting turns ADR-001 rule 1 into a compile
error, and `toMatchFileSnapshot` implements ADR-003 rule 5 without a
separate generation script. Biome must not format files owned by core's
serializer (assets, fixtures, generated schema), or the two will fight
over array layout.

## Recommendation

Adopt TypeScript 7, Vitest 5 and Biome 2 in ADR-004, with Biome
excluding `**/fixtures`, `**/schema` and `**/*.cumulus.json`. Leave
type-aware linting out until there is a need, and evaluate it after
TypeScript 7.1 ships.

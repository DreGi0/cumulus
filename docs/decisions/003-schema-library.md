# ADR-003: Schema library

- Status: Proposed
- Date: 2026-10-16

## Context

PRD M1 requires a versioned JSON Schema for assets and a core package
that parses and validates them, where "invalid files fail with a clear
error message". ADR-002 fixes the format. This ADR picks how the schema
is written, how TypeScript types and the JSON Schema are derived from it,
and how assets are validated at runtime on React Native (Hermes) and the
web. It adds the first runtime dependency to `core`, which ADR-001
allows (rule 1 forbids only DOM and React Native dependencies).

## Spike notes

Full results in `docs/spikes/schema-lib.md`. Summary, TypeBox 1.4.1 vs
Zod 4.6.7, same ADR-002 format, 2 valid and 7 invalid fixtures:

| Check                                   | TypeBox            | Zod                |
| --------------------------------------- | ------------------ | ------------------ |
| Verdicts match Ajv on exported schema   | 9/9                | 9/9                |
| Error names the real problem            | 1 of 7 clearly     | 7 of 7             |
| Inferred types correct (TS 7.0 and 5.9) | Yes                | Yes, no spread in recursive objects |
| Validates with eval blocked             | Yes                | Yes                |
| Compiles with `hermesc` 1.0.0           | Yes                | Yes                |
| Validate-only bundle, gzip              | 38.3 KB            | 27.0 KB            |

Not yet measured: running on a device with the Hermes VM of current
React Native. Checked by the M1 `playground-rn` task.

## Options considered

| Option                                  | Pros                                                                 | Cons                                                                                     |
| --------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Zod v4** (chosen)                     | Clear message for every invalid fixture; smallest bundle; widely known, also by AI assistants; native `z.toJSONSchema` | JSON Schema is a conversion: refinements and transforms do not export; spread breaks recursive types |
| TypeBox                                 | Schema is JSON Schema, no conversion                                 | Union errors come from the first branch and hide the real problem; core would need its own union dispatch; 40% larger |
| TS types → generated JSON Schema + Ajv  | Plain TS types as the source                                         | Two dependencies plus a build step; constraints live in JSDoc comments; Ajv compiles with `new Function`; generic union errors |
| Hand-written JSON Schema + Ajv          | Language-neutral contract, full expressiveness                       | Verbose; types are a second source or generated; same Ajv error and eval issues          |

## Decision

Proposed until the maintainer confirms.

Use **Zod v4** (`zod@^4.6`) as the only runtime dependency of `core`.

Rules:

1. The Zod schema in `core` is the single source. TypeScript types come
   from `z.infer`; nothing is written twice.
2. Only `z.strictObject` (ADR-002 rule 10). No `.refine`, `.transform`,
   `.preprocess` or defaults in the schema: they do not export to JSON
   Schema, so the JSON Schema would accept files core rejects.
3. Checks that JSON Schema cannot express (unique ids, ADR-002 rule 4)
   are plain functions in `core`, run after schema validation.
4. Recursive objects (`group`) list their fields explicitly; no object
   spread next to the recursive getter.
5. The JSON Schema is generated with `z.toJSONSchema` (draft 2020-12) to
   `packages/core/schema/asset.v<version>.schema.json` and committed, so
   people, editors and AI assistants can read it without a build. A core
   test fails if the committed file differs from the generated one.
6. Zod stays inside `core`. The public API exposes core's own error type
   (a list of `{ path, message }`) and plain TypeScript types, never Zod
   objects, so the library can be replaced without breaking callers.
7. Core does not call `z.config`: it is global and would change the host
   app's own Zod.
8. When `version` is bumped, the previous schema module and its JSON file
   are frozen and kept for migrations (ADR-002 rule 11).

## Consequences

- Easier: one file defines format, types and JSON Schema; M1's "clear
  error message" comes almost for free.
- Easier: AI assistants that already know Zod can read and extend the
  schema.
- Harder: anyone editing the schema must respect rules 2 and 4; the
  committed-schema test catches drift, review catches the rest.
- On the web, under a strict CSP, Zod's `new Function` probe is caught
  but may be reported as a CSP violation. Revisit if a host app reports
  it; the fix is the host's own `z.config({ jitless: true })`.
- Revisit if `zod/mini` is needed for size, or if a device run on
  current Hermes (M1 `playground-rn`) contradicts the spike.

## Out of scope

- Test runner and build tooling for generating the schema file: own ADR
  at M1.
- Hosting the JSON Schema at a public `$schema` URL: M4.
- Migration code for future versions: written with the first bump.

# Spike: schema library

- Date: 2026-10-16
- Time box: 3 hours (used: about 2)
- Code: `.scratch/schema-lib/` (git-ignored, throwaway)

## Question

Which TypeScript schema library, TypeBox or Zod v4, should `core` use to
define the ADR-002 format, infer its TypeScript types, validate assets at
runtime on React Native and the web, and export the versioned JSON Schema?

Measurable answer: for each library,

1. same verdict as an independent JSON Schema validator (Ajv) on valid and
   invalid fixtures, using the exported JSON Schema;
2. error messages that name the path and the actual problem;
3. inferred types accept a valid asset and reject invalid ones;
4. validates with code generation from strings (`eval`, `new Function`)
   blocked, and the bundle compiles with the Hermes compiler used by React
   Native;
5. minified and gzip size of a bundle that only validates.

## Method

- Versions: `typebox@1.4.1`, `zod@4.6.7`, `ajv@8.20.0`, `esbuild@0.28.2`,
  `typescript@7.0.2` (and 5.9.3 as a control), `hermes-compiler@250829098.0.19`
  (Hermes 1.0.0, bytecode 98), `hermes-engine-cli@0.12.0`, `@react-native/babel-preset`.
- The ADR-002 format written in each library: `schema-typebox.ts`,
  `schema-zod.ts`. Same rules: strict objects, id and color patterns,
  non-negative sizes, at least 2 path points, `version` literal 1, nodes
  as a recursive union on `type`.
- Fixtures (`fixtures.ts`): 2 valid (the ADR-002 example; a rect with
  `$schema` and an uppercase color) and 7 invalid (unknown key, bad color,
  missing id, negative radius, one-point path, `version` as a string,
  unknown node type).
- Commands:

  ```sh
  npx tsx run.ts typebox && npx tsx run.ts zod     # 1, 2
  npx tsc -p .                                     # 3 (types-check.ts)
  npx esbuild hermes-entry.ts --bundle --minify --format=iife --target=es2020 --alias:LIB=./schema-<lib>.ts --outfile=out/hermes-<lib>.js
  node babel.cjs out/hermes-<lib>.js out/hermes-<lib>.rn.js   # React Native Babel preset, as Metro does
  hermesc -emit-binary -O -out out/hermes-<lib>.rn.hbc out/hermes-<lib>.rn.js   # 4
  node --disallow-code-generation-from-strings noeval.cjs out/hermes-<lib>.js    # 4
  npx esbuild size-entry.ts --bundle --minify ...  then gzip                    # 5
  ```

## Results

| Check                                   | TypeBox 1.4.1                         | Zod 4.6.7                            |
| --------------------------------------- | ------------------------------------- | ------------------------------------ |
| 1. Verdicts, library vs Ajv (9 fixtures) | 9/9 correct, 0 mismatches (Ajv draft-07) | 9/9 correct, 0 mismatches (Ajv 2020-12) |
| 2. Error names the real problem          | 1 of 7 clearly (`version-string`); `missing-id` names `id` next to a false `children` error | 7 of 7                               |
| 3. Inferred types (TS 7.0.2 and 5.9.3)   | Pass                                  | Pass, after a fix (see below)        |
| 4a. Validates with eval blocked          | 9/9                                   | 9/9                                  |
| 4b. `hermesc` 1.0.0 compiles bundle      | Yes, 568,626 bytes of bytecode        | Yes, 223,610 bytes of bytecode       |
| 5. Validate-only bundle                  | 148.7 KB min, 38.3 KB gzip            | 92.7 KB min, 27.0 KB gzip            |

Error messages for the `bad-color` fixture (fill `#fff`):

- TypeBox: 8 errors, none mentions the color. The node union is a plain
  `anyOf`, so errors come from the first branch (`group`):
  `/children/0/children/0: must have required properties children`,
  `/children/0/children/0/cx: schema is false`, …
- Zod: `/children/0/children/0/fill: Invalid string: must match pattern /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/`

The other Zod messages: `stroke: Unrecognized key: "colour"`,
`id: Invalid input: expected string, received undefined`,
`rx: Too small: expected number to be >=0`,
`points: Too small: expected array to have >=2 items`,
`version: Invalid input: expected 1`,
`type: Invalid discriminator value. Expected 'group' | 'rect' | 'ellipse' | 'path'`.

Other findings:

- Zod recursive types fail (`TS7022`, implicit `any`) when the recursive
  object (`group`) uses an object spread (`...base`) next to the
  `children` getter. Listing the fields explicitly fixes it; the other
  node types can keep spreads.
- Both libraries probe for `new Function` and fall back to an
  interpreter when it is blocked; no configuration needed.
- `hermes-engine-cli@0.12.0` (2022) cannot parse either bundle (ES
  classes, regex syntax), and the current React Native Babel preset no
  longer lowers classes. It is too old to be a proxy for the React Native
  runtime and was dropped as a measurement.
- Zod's exported JSON Schema declares draft 2020-12; TypeBox's declares
  no draft and compiles as draft-07.

Not measured, left for the M1 `playground-rn` task: running on a device
with the Hermes VM shipped by current React Native. Here, compile with
the current `hermesc` plus Node with eval blocked stand in for it.

## Conclusion

Both libraries are correct, run without eval and compile for Hermes.
They differ on two points that matter to the PRD:

- M1 requires "invalid files fail with a clear error message". TypeBox
  gives the right verdict but misleading messages for any error inside a
  node; fixing that means writing our own union dispatch in core. Zod
  gives a clear message for every fixture.
- Zod is about 30% smaller (27.0 vs 38.3 KB gzip) and its bytecode is
  2.5 times smaller.

TypeBox's one advantage, a schema that is already JSON Schema, did not
matter: Zod's export matched Ajv on every fixture.

## Recommendation

Use **Zod v4** as the schema library in `core`, with the JSON Schema
generated from it with `z.toJSONSchema`. Record it in ADR-003 with these
rules: strict objects only, no refinements or transforms (they do not
export to JSON Schema), cross-field checks such as unique ids in plain
core code, and no object spread in recursive objects.

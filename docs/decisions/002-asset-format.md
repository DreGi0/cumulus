# ADR-002: Asset file format

- Status: Accepted
- Date: 2026-10-16

## Context

PRD goal 2 and principle "text-first format" require a plain-text,
versioned JSON file that works well in git. M1 needs groups, transforms,
rectangle, ellipse and path shapes, fill and stroke. Later milestones put
constraints on the shape of the file now:

- M2: the editor edits cubic Bézier anchors and handles, and needs
  "save/load a project file" and "export an asset file".
- M3: keyframes target "any property"; states switch at runtime.
- PRD risk "format changes break old assets": versioned from day one.

This ADR fixes the shape of the file. How the schema is written and
validated (library, generated JSON Schema) is ADR-003, after a spike.
Touches ADR-001: the format, its types and its serializer live in
`packages/core`; sample files live in `packages/core/fixtures/`.

## Spike notes

None needed. Every choice here is a design choice, not a measurement.
The schema library choice (ADR-003) needs one: Hermes compatibility,
bundle size, JSON Schema fidelity and error messages.

## Options considered

| Topic          | Option                                  | Pros                                                         | Cons                                                                       |
| -------------- | --------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Path geometry  | **Structured anchors** (chosen)         | Editor edits and M3 animates points without parsing; clean per-point diffs | More verbose; renderers build the SVG `d` string                           |
|                | SVG `d` string                          | Compact; renderers use it directly                           | Editor and animation must parse and re-serialize; one-line diffs; morphing needs a parser |
| Transform      | **Decomposed** `x, y, rotation, scale` (chosen) | Readable; each field animates on its own                     | Order of application must be specified                                     |
|                | 2×3 matrix                              | Compact; no ordering question                                | Unreadable by hand; interpolating a matrix gives wrong motion             |
| Version        | **Integer** `version` (chosen)          | One number to compare; one migration per step                | No signal for "compatible" changes                                         |
|                | Semver string                           | Expresses compatible vs breaking                             | With strict validation every change breaks old readers anyway; more rules |
| Unknown keys   | **Rejected** (chosen)                   | Typos fail with a clear error; the schema is the whole truth | Any new field needs a version bump                                         |
|                | Ignored                                 | Old readers open newer files                                 | Typos are silently dropped; files drift from the schema                    |
| Project vs asset | **One format** (chosen)               | One schema, one serializer, one test suite                   | Editor-only data (guides, zoom) has no home yet                            |
|                | Separate project file wrapping the asset | Room for editor state                                        | Two formats to version before anyone needs the second                      |

Path anchors follow the same model as Lottie (vertex plus in and out
tangents relative to the vertex, missing tangent = zero).

## Decision

**File.** UTF-8 JSON, extension `.cumulus.json`. Example:

```json
{
  "version": 1,
  "width": 128,
  "height": 128,
  "children": [
    {
      "type": "group",
      "id": "face",
      "transform": { "x": 64, "y": 64 },
      "children": [
        {
          "type": "ellipse",
          "id": "head",
          "cx": 0,
          "cy": 0,
          "rx": 48,
          "ry": 40,
          "fill": "#ffffff",
          "stroke": { "color": "#1a1a2e", "width": 2 }
        },
        {
          "type": "path",
          "id": "mouth",
          "closed": false,
          "points": [
            { "x": -12, "y": 10, "out": { "x": 6, "y": 8 } },
            { "x": 12, "y": 10, "in": { "x": -6, "y": 8 } }
          ],
          "stroke": { "color": "#1a1a2e", "width": 2 }
        }
      ]
    }
  ]
}
```

**Rules.**

1. Top level: `version` (integer, starts at 1), `width` and `height`
   (> 0, the artboard), `children`. An optional `$schema` key is
   allowed for editor autocompletion and ignored by core.
2. Coordinates: origin top-left, y down, units are artboard units.
   Renderers scale the artboard to the space they are given.
3. Nodes are a union discriminated by `type`: `group`, `rect`,
   `ellipse`, `path`. Array order is z-order: first is drawn first
   (bottom).
4. Every node has an `id`: matches `^[A-Za-z][A-Za-z0-9_-]*$` and is
   unique in the file. Ids are the names shown in the editor and the
   targets of M3 keyframes. Uniqueness is checked by core after schema
   validation.
5. Any node may have an optional `transform` with `x`, `y` (default 0),
   `rotation` in degrees clockwise (default 0), `scaleX`, `scaleY`
   (default 1). Applied as translate · rotate · scale to the node's
   local coordinates.
6. Geometry is in local coordinates: `rect` has `x, y, width, height`;
   `ellipse` has `cx, cy, rx, ry`; sizes and radii are ≥ 0.
7. `path` has `closed` (boolean) and `points` (at least 2). Each point
   has `x, y` and optional `in` and `out` handles `{x, y}`, relative to
   the point. A missing handle is `{0, 0}` (a corner).
8. Shapes may have `fill` (a color) and `stroke` (`color`, `width` ≥ 0).
   Missing means none. Joins and caps use the SVG defaults (miter,
   butt). Groups carry no paint.
9. Colors are `#rrggbb` or `#rrggbbaa`. Input is case-insensitive;
   output is lowercase.
10. Unknown keys are an error.
11. Versioning: any schema change increments `version`. Core reads every
    version up to its own, migrating older files step by step
    (`v1 → v2 → …`). A newer file is rejected with a message naming
    both versions.
12. Canonical output: core provides the only serializer. Keys in schema
    order, 2-space indent, LF, trailing newline, numbers rounded to 3
    decimals. The editor's save and export both use it, so saving an
    unchanged file produces no diff.
13. One format for M2's "project file" and "asset file". Editor state
    (selection, zoom, panels) is not saved.

## Consequences

- Easier: hand-written fixtures for M1; per-point diffs in git; M3 can
  target `id` + property path (for example `head.transform.rotation`)
  without parsing strings.
- Easier: renderers map nodes almost one to one onto SVG elements.
- Harder: every new field is a version bump and a migration, even when
  the migration is the identity.
- Harder: renderers must convert anchor lists to SVG `d` strings.
- Revisit at M3: a rotation and scale origin (pivot), group opacity.
- Revisit at M2: a separate project file, only if the editor needs to
  save data that does not belong in the asset.
- Not yet supported, add with a version bump when an asset needs it:
  corner radius, gradients, opacity, compound paths and holes
  (fill rule), line caps and joins.

## Out of scope

- Schema library, generated JSON Schema, validation and error messages:
  ADR-003, after a spike.
- Where the JSON Schema is hosted (`$schema` URL): M4.
- Animation and state machine data: M3, own ADR.
- Rendering technology (SVG or Skia, SVG or canvas): own ADRs.

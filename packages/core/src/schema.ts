import * as z from 'zod'

// Version 1 of the asset format (ADR-002). Rules for editing this file are
// in ADR-003: strict objects only, no refinements, transforms or defaults,
// and no object spread in the recursive group node.

const Id = z
  .string()
  .regex(/^[A-Za-z][A-Za-z0-9_-]*$/, {
    error:
      'must start with a letter and contain only letters, digits, "-" or "_"',
  })
  .describe(
    'Node name, unique in the file. Shown in the editor and targeted by animations.',
  )

const Color = z.string().regex(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/, {
  error: 'must be a color: #rrggbb or #rrggbbaa',
})

const NonNegative = z.number().min(0)

const CHILDREN =
  'Child nodes. Array order is z-order: the first child is drawn first (bottom).'

export const Transform = z.strictObject({
  x: z.number().optional(),
  y: z.number().optional(),
  rotation: z.number().describe('Degrees, clockwise.').optional(),
  scaleX: z.number().optional(),
  scaleY: z.number().optional(),
})
export type Transform = z.infer<typeof Transform>

export const Stroke = z.strictObject({ color: Color, width: NonNegative })
export type Stroke = z.infer<typeof Stroke>

const Handle = z
  .strictObject({ x: z.number(), y: z.number() })
  .describe(
    'Handle offset relative to the point. Missing means zero (a corner).',
  )

export const PathPoint = z.strictObject({
  x: z.number(),
  y: z.number(),
  in: Handle.optional(),
  out: Handle.optional(),
})
export type PathPoint = z.infer<typeof PathPoint>

const node = { id: Id, transform: Transform.optional() }
const paint = { fill: Color.optional(), stroke: Stroke.optional() }

export const GroupNode = z.strictObject({
  type: z.literal('group'),
  id: Id,
  transform: Transform.optional(),
  get children(): z.ZodArray<typeof AssetNode> {
    return z.array(AssetNode).describe(CHILDREN)
  },
})
export type GroupNode = z.infer<typeof GroupNode>

export const RectNode = z.strictObject({
  type: z.literal('rect'),
  ...node,
  x: z.number(),
  y: z.number(),
  width: NonNegative,
  height: NonNegative,
  ...paint,
})
export type RectNode = z.infer<typeof RectNode>

export const EllipseNode = z.strictObject({
  type: z.literal('ellipse'),
  ...node,
  cx: z.number(),
  cy: z.number(),
  rx: NonNegative,
  ry: NonNegative,
  ...paint,
})
export type EllipseNode = z.infer<typeof EllipseNode>

export const PathNode = z.strictObject({
  type: z.literal('path'),
  ...node,
  closed: z.boolean(),
  points: z.array(PathPoint).min(2),
  ...paint,
})
export type PathNode = z.infer<typeof PathNode>

export const AssetNode = z.discriminatedUnion(
  'type',
  [GroupNode, RectNode, EllipseNode, PathNode],
  {
    // Only the missing or unknown `type`; other issues use parse.ts messages.
    error: (issue) =>
      issue.code === 'invalid_union'
        ? 'must be one of: group, rect, ellipse, path'
        : undefined,
  },
)
export type AssetNode = z.infer<typeof AssetNode>

const artboard = 'Origin is top-left, y points down.'

export const Asset = z
  .strictObject({
    $schema: z.string().optional(),
    version: z.literal(1),
    width: z.number().positive().describe(`Artboard width. ${artboard}`),
    height: z.number().positive().describe(`Artboard height. ${artboard}`),
    children: z.array(AssetNode).describe(CHILDREN),
  })
  .meta({ title: 'Cumulus asset v1' })
export type Asset = z.infer<typeof Asset>

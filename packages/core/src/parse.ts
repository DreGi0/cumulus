import type * as z from 'zod'
import { Asset, type AssetNode } from './schema'

export interface AssetIssue {
  /** JSON Pointer (RFC 6901) to the offending value; "" is the root. */
  path: string
  message: string
}

export class AssetError extends Error {
  override readonly name = 'AssetError'
  readonly issues: readonly AssetIssue[]

  constructor(issues: readonly AssetIssue[]) {
    const count = `${issues.length} issue${issues.length === 1 ? '' : 's'}`
    const lines = issues.map(
      (issue) => `\n  ${issue.path || '/'}: ${issue.message}`,
    )
    super(`Invalid asset (${count}):${lines.join('')}`)
    this.issues = issues
  }
}

/** Validates already-parsed JSON. Returns it typed, or throws AssetError. */
export function parseAsset(input: unknown): Asset {
  if (
    typeof input === 'object' &&
    input !== null &&
    'version' in input &&
    typeof input.version === 'number' &&
    input.version > 1
  ) {
    throw new AssetError([
      {
        path: '/version',
        message: `version ${input.version} is newer than the supported version 1; update @cumulus/core`,
      },
    ])
  }

  const result = Asset.safeParse(input, { error: message })
  if (!result.success) {
    throw new AssetError(
      result.error.issues.map((issue) => ({
        path: pointer(issue.path),
        message: issue.message,
      })),
    )
  }

  const duplicates = duplicateIds(result.data.children, '/children', new Map())
  if (duplicates.length > 0) throw new AssetError(duplicates)
  return result.data
}

/**
 * Messages for issues whose schema sets no `error` of its own. Always returns
 * a string, so neither Zod's locale nor the host app's `z.config` applies.
 */
function message(issue: z.core.$ZodRawIssue): string {
  if (issue.input === undefined) return 'required'
  switch (issue.code) {
    case 'invalid_type':
      return `expected ${issue.expected}, got ${jsonType(issue.input)}`
    case 'unrecognized_keys': {
      const keys = issue.keys.map((key) => `"${key}"`).join(', ')
      return `unknown key${issue.keys.length === 1 ? '' : 's'} ${keys}`
    }
    case 'too_small':
      return issue.origin === 'array'
        ? `must have at least ${issue.minimum} items`
        : `must be ${issue.inclusive ? '>=' : '>'} ${issue.minimum}`
    case 'invalid_value':
      return `must be ${issue.values.join(' or ')}`
    default:
      return 'invalid value'
  }
}

function jsonType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

// Segments are schema keys or array indices, which never contain "~" or "/",
// so no RFC 6901 escaping is needed.
function pointer(path: readonly PropertyKey[]): string {
  return path.map((key) => `/${String(key)}`).join('')
}

/** ADR-002 rule 4: ids are unique in the file, checked in document order. */
function duplicateIds(
  nodes: readonly AssetNode[],
  path: string,
  firstUse: Map<string, string>,
): AssetIssue[] {
  return nodes.flatMap((node, index) => {
    const at = `${path}/${index}`
    const first = firstUse.get(node.id)
    const issues: AssetIssue[] = []
    if (first === undefined) firstUse.set(node.id, `${at}/id`)
    else
      issues.push({
        path: `${at}/id`,
        message: `duplicate id "${node.id}", first used at ${first}`,
      })
    if (node.type === 'group')
      issues.push(...duplicateIds(node.children, `${at}/children`, firstUse))
    return issues
  })
}

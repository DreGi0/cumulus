import { expect, test } from 'vitest'
import faceFixture from '../fixtures/face.cumulus.json'
import shapesFixture from '../fixtures/shapes.cumulus.json'
import { AssetError, parseAsset } from './parse'

const HEAD = '/children/0/children/0'
const MOUTH = '/children/0/children/1'
const COLOR = 'must be a color: #rrggbb or #rrggbbaa'

/** A copy of the face fixture with each JSON Pointer set; undefined removes the key. */
function face(edits: Record<string, unknown> = {}) {
  const asset = JSON.parse(JSON.stringify(faceFixture))
  for (const [path, value] of Object.entries(edits)) {
    const keys = path.slice(1).split('/')
    const last = keys.pop() as string
    let parent = asset
    for (const key of keys) parent = parent[key]
    if (value === undefined) delete parent[last]
    else parent[last] = value
  }
  return asset
}

function thrown(input: unknown): AssetError {
  try {
    parseAsset(input)
  } catch (error) {
    if (error instanceof AssetError) return error
    throw error
  }
  throw new Error('parseAsset did not throw')
}

test.each([
  ['face', faceFixture],
  ['shapes', shapesFixture],
])('%s fixture parses to an equal value', (_, fixture) => {
  expect(parseAsset(fixture)).toStrictEqual(fixture)
})

test.each([
  {
    name: 'short color',
    edits: { [`${HEAD}/fill`]: '#fff' },
    issues: [{ path: `${HEAD}/fill`, message: COLOR }],
  },
  {
    name: 'misspelled stroke key',
    edits: { [`${HEAD}/stroke`]: { colour: '#000000', width: 1 } },
    issues: [
      { path: `${HEAD}/stroke/color`, message: 'required' },
      { path: `${HEAD}/stroke`, message: 'unknown key "colour"' },
    ],
  },
  {
    name: 'missing id',
    edits: { [`${MOUTH}/id`]: undefined },
    issues: [{ path: `${MOUTH}/id`, message: 'required' }],
  },
  {
    name: 'id starting with a digit',
    edits: { [`${HEAD}/id`]: '1head' },
    issues: [
      {
        path: `${HEAD}/id`,
        message:
          'must start with a letter and contain only letters, digits, "-" or "_"',
      },
    ],
  },
  {
    name: 'negative radius',
    edits: { [`${HEAD}/rx`]: -1 },
    issues: [{ path: `${HEAD}/rx`, message: 'must be >= 0' }],
  },
  {
    name: 'zero width',
    edits: { '/width': 0 },
    issues: [{ path: '/width', message: 'must be > 0' }],
  },
  {
    name: 'width as a string',
    edits: { '/width': '128' },
    issues: [{ path: '/width', message: 'expected number, got string' }],
  },
  {
    name: 'path with one point',
    edits: { [`${MOUTH}/points`]: [{ x: -12, y: 10 }] },
    issues: [
      { path: `${MOUTH}/points`, message: 'must have at least 2 items' },
    ],
  },
  {
    name: 'unknown node type',
    edits: { [`${HEAD}/type`]: 'circle' },
    issues: [
      {
        path: `${HEAD}/type`,
        message: 'must be one of: group, rect, ellipse, path',
      },
    ],
  },
  {
    name: 'version as a string',
    edits: { '/version': '1' },
    issues: [{ path: '/version', message: 'must be 1' }],
  },
  {
    name: 'newer version hides other issues',
    edits: { '/version': 2, '/width': -5 },
    issues: [
      {
        path: '/version',
        message:
          'version 2 is newer than the supported version 1; update @cumulus/core',
      },
    ],
  },
  {
    name: 'duplicate id',
    edits: { [`${MOUTH}/id`]: 'head' },
    issues: [
      {
        path: `${MOUTH}/id`,
        message: `duplicate id "head", first used at ${HEAD}/id`,
      },
    ],
  },
])('$name', ({ edits, issues }) => {
  expect(thrown(face(edits)).issues).toEqual(issues)
})

test('null is reported at the root', () => {
  const error = thrown(null)
  expect(error.issues).toEqual([
    { path: '', message: 'expected object, got null' },
  ])
  expect(error.message).toBe(
    'Invalid asset (1 issue):\n  /: expected object, got null',
  )
})

test('every issue is reported, in schema key order', () => {
  const error = thrown(face({ [`${HEAD}/fill`]: '#fff', [`${HEAD}/rx`]: -1 }))
  expect(error.issues.map((issue) => issue.path)).toEqual([
    `${HEAD}/rx`,
    `${HEAD}/fill`,
  ])
  expect(error.message).toMatch(/^Invalid asset \(2 issues\):\n/)
})

test('throws an AssetError', () => {
  expect(() => parseAsset(null)).toThrow(AssetError)
  expect(thrown(null).name).toBe('AssetError')
})

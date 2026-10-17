import { expect, test } from 'vitest'
import * as z from 'zod'
import { Asset } from './schema'

// ADR-003 rule 5. After a schema change, regenerate with `npx vitest run -u`.
test('committed JSON Schema matches the Zod schema', async () => {
  await expect(
    `${JSON.stringify(z.toJSONSchema(Asset), null, 2)}\n`,
  ).toMatchFileSnapshot('../schema/asset.v1.schema.json')
})

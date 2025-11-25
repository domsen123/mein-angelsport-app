import { z } from 'zod'
import { updateWater, UpdateWaterCommandSchema } from '~~/server/actions/water/update-water'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, waterId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    waterId: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data => UpdateWaterCommandSchema.omit({ clubId: true, waterId: true }).parse(data))

  return await updateWater({ clubId, waterId, ...body }, context)
})

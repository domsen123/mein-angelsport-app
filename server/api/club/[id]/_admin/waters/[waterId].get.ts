import { z } from 'zod'
import { getWaterById } from '~~/server/actions/water/get-water-by-id'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, waterId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    waterId: ulidSchema,
  }).parse(params))

  return await getWaterById({ clubId, waterId }, context)
})

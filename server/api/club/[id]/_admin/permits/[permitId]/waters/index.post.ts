import { APIError } from 'better-auth'
import { z } from 'zod'
import { assignWaterToPermit } from '~~/server/actions/permitWater/assign-water-to-permit'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

const bodySchema = z.object({
  waterId: ulidSchema,
})

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, permitId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    permitId: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data => bodySchema.parse(data))

  try {
    return await assignWaterToPermit({ clubId, permitId, waterId: body.waterId }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Zuweisen des Gewässers ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

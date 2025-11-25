import { APIError } from 'better-auth'
import { z } from 'zod'
import { removeWaterFromPermit } from '~~/server/actions/permitWater/remove-water-from-permit'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, permitId, waterId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    permitId: ulidSchema,
    waterId: ulidSchema,
  }).parse(params))

  try {
    return await removeWaterFromPermit({ clubId, permitId, waterId }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Entfernen des Gewässers ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

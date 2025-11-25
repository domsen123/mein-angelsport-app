import { APIError } from 'better-auth'
import { z } from 'zod'
import { getPermitById } from '~~/server/actions/permit/get-permit-by-id'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, permitId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    permitId: ulidSchema,
  }).parse(params))

  try {
    return await getPermitById({ clubId, permitId }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Abrufen des Erlaubnisscheins ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

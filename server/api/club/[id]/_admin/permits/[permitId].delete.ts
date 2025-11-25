import { APIError } from 'better-auth'
import { z } from 'zod'
import { deletePermit } from '~~/server/actions/permit/delete-permit'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, permitId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    permitId: ulidSchema,
  }).parse(params))

  try {
    return await deletePermit({ clubId, permitId }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Löschen des Erlaubnisscheins ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

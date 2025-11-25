import { APIError } from 'better-auth'
import { z } from 'zod'
import { deletePermitOption } from '~~/server/actions/permit/delete-permit-option'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, permitId, optionId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    permitId: ulidSchema,
    optionId: ulidSchema,
  }).parse(params))

  try {
    return await deletePermitOption({ clubId, permitId, optionId }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Löschen der Option ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

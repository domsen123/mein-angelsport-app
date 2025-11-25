import { APIError } from 'better-auth'
import { z } from 'zod'
import { getPermitInstanceById } from '~~/server/actions/permitInstance/get-permit-instance-by-id'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, permitId, optionId, periodId, instanceId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    permitId: ulidSchema,
    optionId: ulidSchema,
    periodId: ulidSchema,
    instanceId: ulidSchema,
  }).parse(params))

  try {
    return await getPermitInstanceById({ clubId, permitId, optionId, periodId, instanceId }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Abrufen der Erlaubniskarte ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

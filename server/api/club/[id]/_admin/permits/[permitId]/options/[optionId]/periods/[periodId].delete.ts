import { APIError } from 'better-auth'
import { z } from 'zod'
import { deletePermitOptionPeriod } from '~~/server/actions/permit/delete-permit-option-period'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, permitId, optionId, periodId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    permitId: ulidSchema,
    optionId: ulidSchema,
    periodId: ulidSchema,
  }).parse(params))

  try {
    return await deletePermitOptionPeriod({ clubId, permitId, optionId, periodId }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Löschen des Zeitraums ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

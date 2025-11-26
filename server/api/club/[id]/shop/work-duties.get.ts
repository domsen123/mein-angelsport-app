import { APIError } from 'better-auth'
import { z } from 'zod'
import { getWorkDutyStatus } from '~~/server/actions/shop/get-work-duty-status'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

const querySchema = z.object({
  memberId: ulidSchema,
})

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
  }).parse(params))

  const { memberId } = await getValidatedQuery(event, q => querySchema.parse(q))

  try {
    return await getWorkDutyStatus({ clubId, memberId }, context)
  }
  catch (error: unknown) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Abrufen des Arbeitsdienst-Status ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

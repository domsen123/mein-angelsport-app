import { APIError } from 'better-auth'
import { z } from 'zod'
import { getPermitInstancesByPeriodId } from '~~/server/actions/permitInstance/get-permit-instances-by-period-id'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, permitId, optionId, periodId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    permitId: ulidSchema,
    optionId: ulidSchema,
    periodId: ulidSchema,
  }).parse(params))

  const pagination = await getValidatedQuery(event, query => paginationSchema.parse(query))

  try {
    return await getPermitInstancesByPeriodId({ clubId, permitId, optionId, periodId, pagination }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Abrufen der Erlaubniskarten ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

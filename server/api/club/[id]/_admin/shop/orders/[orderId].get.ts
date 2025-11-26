import { APIError } from 'better-auth'
import { z } from 'zod'
import { getOrderById } from '~~/server/actions/shop-admin/get-order-by-id'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, orderId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    orderId: ulidSchema,
  }).parse(params))

  try {
    return await getOrderById({ clubId, orderId }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Abrufen der Bestellung ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

import { APIError } from 'better-auth'
import { z } from 'zod'
import { updateOrder, UpdateOrderCommandSchema } from '~~/server/actions/shop-admin/update-order'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, orderId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    orderId: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data =>
    UpdateOrderCommandSchema.omit({ clubId: true, orderId: true }).parse(data))

  try {
    return await updateOrder({ clubId, orderId, ...body }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Aktualisieren der Bestellung ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

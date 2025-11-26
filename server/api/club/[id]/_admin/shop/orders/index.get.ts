import { APIError } from 'better-auth'
import { z } from 'zod'
import { getOrders } from '~~/server/actions/shop-admin/get-orders'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

const querySchema = paginationSchema.extend({
  status: z.enum(['PENDING', 'PAID', 'FULFILLED', 'CANCELLED']).optional(),
  year: z.coerce.number().int().optional(),
})

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
  }).parse(params))

  const query = await getValidatedQuery(event, q => querySchema.parse(q))

  const { status, year, ...pagination } = query

  try {
    return await getOrders({
      clubId,
      pagination,
      status,
      year,
    }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Abrufen der Bestellungen ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

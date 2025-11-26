import { APIError } from 'better-auth'
import { z } from 'zod'
import { getShopItemById } from '~~/server/actions/shop-admin/get-shop-item-by-id'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, itemId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    itemId: ulidSchema,
  }).parse(params))

  try {
    return await getShopItemById({ clubId, itemId }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Abrufen des Shop-Artikels ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

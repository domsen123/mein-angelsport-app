import { APIError } from 'better-auth'
import { z } from 'zod'
import { updateShopItem, UpdateShopItemCommandSchema } from '~~/server/actions/shop-admin/update-shop-item'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, itemId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    itemId: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data =>
    UpdateShopItemCommandSchema.omit({ clubId: true, itemId: true }).parse(data))

  try {
    return await updateShopItem({ clubId, itemId, ...body }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Aktualisieren des Shop-Artikels ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

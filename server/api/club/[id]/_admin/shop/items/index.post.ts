import { APIError } from 'better-auth'
import { z } from 'zod'
import { createShopItem, CreateShopItemCommandSchema } from '~~/server/actions/shop-admin/create-shop-item'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data =>
    CreateShopItemCommandSchema.omit({ clubId: true }).parse(data))

  try {
    return await createShopItem({ clubId, ...body }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Erstellen des Shop-Artikels ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

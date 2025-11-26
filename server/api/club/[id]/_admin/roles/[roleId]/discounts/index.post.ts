import { z } from 'zod'
import { createDiscount, CreateDiscountCommandSchema } from '~~/server/actions/clubRolePermitDiscount/create-discount'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, roleId: clubRoleId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    roleId: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data =>
    CreateDiscountCommandSchema.omit({ clubId: true, clubRoleId: true }).parse(data))

  return await createDiscount({ clubId, clubRoleId, ...body }, context)
})

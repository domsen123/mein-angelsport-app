import { z } from 'zod'
import { updateDiscount, UpdateDiscountCommandSchema } from '~~/server/actions/clubRolePermitDiscount/update-discount'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, discountId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    roleId: ulidSchema,
    discountId: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data =>
    UpdateDiscountCommandSchema.omit({ clubId: true, discountId: true }).parse(data))

  return await updateDiscount({ clubId, discountId, ...body }, context)
})

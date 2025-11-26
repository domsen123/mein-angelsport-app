import { z } from 'zod'
import { deleteDiscount } from '~~/server/actions/clubRolePermitDiscount/delete-discount'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, discountId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    roleId: ulidSchema,
    discountId: ulidSchema,
  }).parse(params))

  return await deleteDiscount({ clubId, discountId }, context)
})

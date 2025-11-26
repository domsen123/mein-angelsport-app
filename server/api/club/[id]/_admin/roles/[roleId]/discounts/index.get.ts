import { z } from 'zod'
import { getDiscountsByRoleId } from '~~/server/actions/clubRolePermitDiscount/get-discounts-by-role-id'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, roleId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    roleId: ulidSchema,
  }).parse(params))

  return await getDiscountsByRoleId({ clubId, roleId }, context)
})

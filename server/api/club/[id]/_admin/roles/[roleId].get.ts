import { z } from 'zod'
import { getClubRoleById } from '~~/server/actions/clubRole/get-club-role-by-id'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, roleId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    roleId: ulidSchema,
  }).parse(params))

  return await getClubRoleById({ clubId, roleId }, context)
})

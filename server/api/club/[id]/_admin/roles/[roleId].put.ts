import { z } from 'zod'
import { updateClubRole, UpdateClubRoleCommandSchema } from '~~/server/actions/clubRole/update-club-role'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, roleId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    roleId: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data => UpdateClubRoleCommandSchema.omit({ clubId: true, roleId: true }).parse(data))

  return await updateClubRole({ clubId, roleId, ...body }, context)
})

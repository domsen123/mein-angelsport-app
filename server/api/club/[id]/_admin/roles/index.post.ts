import { z } from 'zod'
import { createClubRole, CreateClubRoleCommandSchema } from '~~/server/actions/clubRole/create-club-role'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data => CreateClubRoleCommandSchema.omit({ clubId: true }).parse(data))

  return await createClubRole({ clubId, ...body }, context)
})

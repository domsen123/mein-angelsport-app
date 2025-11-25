import { z } from 'zod'
import { updateClub, UpdateClubCommandSchema } from '~~/server/actions/club/update-club-by-id'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data => UpdateClubCommandSchema.omit({ clubId: true }).parse(data))

  return await updateClub({ clubId, ...body }, context)
})

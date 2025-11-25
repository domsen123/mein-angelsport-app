import { z } from 'zod'
import { createClubEvent, CreateClubEventSchema } from '~~/server/actions/clubEvent/create-club-event'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data => CreateClubEventSchema.omit({ clubId: true }).parse(data))

  return await createClubEvent({ clubId, ...body }, context)
})

import { z } from 'zod'
import { updateClubEvent, UpdateClubEventCommandSchema } from '~~/server/actions/clubEvent/update-club-event'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, eventId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    eventId: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data => UpdateClubEventCommandSchema.omit({ clubId: true, eventId: true }).parse(data))

  return await updateClubEvent({ clubId, eventId, ...body }, context)
})

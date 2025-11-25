import { z } from 'zod'
import { getClubEventById } from '~~/server/actions/clubEvent/get-club-event-by-id'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, eventId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    eventId: ulidSchema,
  }).parse(params))

  return await getClubEventById({ clubId, eventId }, context)
})

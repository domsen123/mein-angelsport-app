import { APIError } from 'better-auth'
import { z } from 'zod'
import { getEventsByClubId } from '~~/server/actions/clubEvent/get-events-by-club-id'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
  }).parse(params))

  try {
    return await getEventsByClubId({ clubId }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Abrufen der Vereinsveranstaltungen ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

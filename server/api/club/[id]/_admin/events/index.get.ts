import { APIError } from 'better-auth'
import { z } from 'zod'
import { getClubEventsByClubId } from '~~/server/actions/clubEvent/get-club-events-by-club-id'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
  }).parse(params))

  const pagination = await getValidatedQuery(event, query => paginationSchema.parse(query))

  try {
    return await getClubEventsByClubId({ clubId, pagination }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Abrufen der Veranstaltungen ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

import { APIError } from 'better-auth'
import { z } from 'zod'
import { getClubMemberById } from '~~/server/actions/clubMember/get-club-member-by-id'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, memberId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    memberId: ulidSchema,
  }).parse(params))

  try {
    return await getClubMemberById({ clubId, memberId }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Abrufen des Vereinsmitglieds ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

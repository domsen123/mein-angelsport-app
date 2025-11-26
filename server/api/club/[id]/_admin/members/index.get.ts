import { APIError } from 'better-auth'
import { z } from 'zod'
import { getClubMembersByClubId } from '~~/server/actions/clubMember/get-club-members-by-club-id'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

const querySchema = paginationSchema.extend({
  onlyWithAccount: z.coerce.boolean().optional(),
})

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
  }).parse(params))

  const query = await getValidatedQuery(event, q => querySchema.parse(q))

  try {
    return await getClubMembersByClubId({
      clubId,
      pagination: query,
      onlyWithAccount: query.onlyWithAccount,
    }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Abrufen der Vereinsmitglieder ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

import { APIError } from 'better-auth'
import { z } from 'zod'
import { updateClubMember, UpdateClubMemberCommandSchema } from '~~/server/actions/clubMember/update-club-member'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

const bodySchema = UpdateClubMemberCommandSchema.omit({ clubId: true, memberId: true })

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, memberId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    memberId: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data => bodySchema.parse(data))

  try {
    return await updateClubMember({ clubId, memberId, ...body }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Aktualisieren des Vereinsmitglieds ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

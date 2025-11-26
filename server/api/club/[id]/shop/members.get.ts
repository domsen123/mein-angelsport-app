import { APIError } from 'better-auth'
import { z } from 'zod'
import { getSelectableMembers } from '~~/server/actions/shop/get-selectable-members'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
  }).parse(params))

  try {
    return await getSelectableMembers({ clubId }, context)
  }
  catch (error: unknown) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Abrufen der Mitglieder ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

import { APIError } from 'better-auth'
import { z } from 'zod'
import { isExecutorClubAdmin } from '~~/server/actions/clubRole/checks/is-executor-club-admin'
import { _removeRoleFromMember } from '~~/server/actions/clubRoleMember/remove-role-from-member'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, memberId, roleId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    memberId: ulidSchema,
    roleId: ulidSchema,
  }).parse(params))

  try {
    await isExecutorClubAdmin(clubId, context)
    return await _removeRoleFromMember({ memberId, roleId }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Entfernen der Rolle ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

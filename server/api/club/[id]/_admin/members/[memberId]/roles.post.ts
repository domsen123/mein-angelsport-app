import { APIError } from 'better-auth'
import { z } from 'zod'
import { isExecutorClubAdmin } from '~~/server/actions/clubRole/checks/is-executor-club-admin'
import { _assignRoleToMember } from '~~/server/actions/clubRoleMember/assign-role-to-member'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

const bodySchema = z.object({
  roleId: ulidSchema,
})

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, memberId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    memberId: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data => bodySchema.parse(data))

  try {
    await isExecutorClubAdmin(clubId, context)
    return await _assignRoleToMember({ memberId, roleId: body.roleId }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Zuweisen der Rolle ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})

import type { DatabaseClient } from '~~/server/database/client'
import { doDatabaseOperation } from '~~/server/database/helper'

/**
 * Find a club member by validation token.
 * Only returns the member if the token is not expired.
 */
export const getMemberByToken = async (
  input: {
    clubId: string
    token: string
  },
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const member = await db.query.clubMember.findFirst({
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      userId: true,
      validationToken: true,
      validationTokenExpiresAt: true,
    },
    where: (cm, { eq, and, gt }) => and(
      eq(cm.clubId, input.clubId),
      eq(cm.validationToken, input.token),
      gt(cm.validationTokenExpiresAt, new Date()),
    ),
  })

  return member
}, tx)

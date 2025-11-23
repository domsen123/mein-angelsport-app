import type { DatabaseClient } from '~~/server/database/client'
import { APIError } from 'better-auth'
import { getDatabase } from '~~/server/database/client'

export const getUserbyId = async (
  userId: string,
  tx?: DatabaseClient,
) => {
  const _db = tx || getDatabase()

  const user = await _db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
  })
  if (!user) {
    throw new APIError('NOT_FOUND', {
      message: 'Der Benutzer wurde nicht gefunden.',
    })
  }
  return user
}

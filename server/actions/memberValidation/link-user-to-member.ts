import type { DatabaseClient } from '~~/server/database/client'
import { eq } from 'drizzle-orm'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubMember } from '~~/server/database/schema/club.schema'

/**
 * Link a user to a club member and clear the validation token.
 */
export const linkUserToMember = async (
  input: {
    memberId: string
    userId: string
  },
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const [updated] = await db.update(clubMember)
    .set({
      userId: input.userId,
      validationToken: null,
      validationTokenExpiresAt: null,
    })
    .where(eq(clubMember.id, input.memberId))
    .returning()

  return updated
}, tx)

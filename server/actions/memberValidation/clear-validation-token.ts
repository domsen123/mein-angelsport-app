import type { DatabaseClient } from '~~/server/database/client'
import { eq } from 'drizzle-orm'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubMember } from '~~/server/database/schema/club.schema'

/**
 * Clear the validation token from a club member.
 * Used after successful login/registration.
 */
export const clearValidationToken = async (
  memberId: string,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await db.update(clubMember)
    .set({
      validationToken: null,
      validationTokenExpiresAt: null,
    })
    .where(eq(clubMember.id, memberId))
}, tx)

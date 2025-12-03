import type { DatabaseClient } from '~~/server/database/client'
import { doDatabaseOperation } from '~~/server/database/helper'

/**
 * Find a club member by personal data for validation.
 * NOTE: This does NOT filter by userId - members with existing userId are also found.
 * TODO: Consider if you want to restrict this to only members without userId.
 */
export const findMemberForValidation = async (
  input: {
    clubId: string
    firstName: string
    lastName: string
    birthdate: Date
  },
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  return await db.query.clubMember.findFirst({
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      userId: true,
      validationToken: true,
      validationTokenExpiresAt: true,
    },
    where: (cm, { eq, and, ilike }) => and(
      eq(cm.clubId, input.clubId),
      ilike(cm.firstName, input.firstName),
      ilike(cm.lastName, input.lastName),
      eq(cm.birthdate, input.birthdate),
    ),
  })
}, tx)

import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { doDatabaseOperation } from '~~/server/database/helper'

export const _getClubMemberByNameAndBirthdate = async (
  input: {
    firstName: string
    lastName: string
    birthdate: Date
  },
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  return await db.query.clubMember.findFirst({
    columns: {
      id: true,
    },
    where: (cm, { eq, and }) => and(
      eq(cm.firstName, input.firstName),
      eq(cm.lastName, input.lastName),
      eq(cm.birthdate, input.birthdate),
    ),
  })
}, tx)

import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { APIError } from 'better-auth'
import { doDatabaseOperation } from '~~/server/database/helper'

export const _isExecutorClubMember = async (
  clubId: string,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const clubMemberRecord = await db.query.clubMember.findFirst({
    where: (member, { eq, and }) => and(
      eq(member.clubId, clubId),
      eq(member.userId, context.userId),
    ),
  })
  return clubMemberRecord
}, tx)

export const isExecutorClubMember = async (
  clubId: string,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const clubMemberRecord = await _isExecutorClubMember(clubId, context, db)

  if (!clubMemberRecord) {
    throw new APIError('FORBIDDEN', {
      message: 'Nur Vereinsmitglieder können diese Aktion ausführen.',
    })
  }
  return clubMemberRecord
}, tx)

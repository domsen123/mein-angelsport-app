import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { APIError } from 'better-auth'
import { doDatabaseOperation } from '~~/server/database/helper'
import { _getClubMembership } from '../clubRoleMember/get-club-membership'

export const _getClubById = async (
  clubId: string,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const clubRecord = await db.query.club.findFirst({
    where: (club, { eq }) => eq(club.id, clubId),
  })

  if (!clubRecord) {
    throw new APIError('NOT_FOUND', {
      message: 'Der angeforderte Verein wurde nicht gefunden.',
    })
  }

  const membership = await _getClubMembership(clubId, context.userId, db)

  return {
    ...clubRecord,
    membership,
  }
}, tx)

export const getClubById = async (
  clubId: string,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  return await _getClubById(clubId, context, db)
}, tx)

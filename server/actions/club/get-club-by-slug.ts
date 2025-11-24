import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { APIError } from 'better-auth'
import { doDatabaseOperation } from '~~/server/database/helper'
import { _getClubById } from './get-club-by-id'

export const _getClubBySlug = async (
  slug: string,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const clubRecord = await db.query.club.findFirst({
    columns: { id: true },
    where: (club, { eq }) => eq(club.slug, slug),
  })

  if (!clubRecord) {
    throw new APIError('NOT_FOUND', {
      message: 'Der angeforderte Verein wurde nicht gefunden.',
    })
  }
  // membership is fetched in _getClubById
  return await _getClubById(clubRecord.id, context, db)
}, tx)

export const getClubBySlug = async (
  slug: string,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  return await _getClubBySlug(slug, context, db)
}, tx)

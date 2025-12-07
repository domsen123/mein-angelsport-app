import type { DatabaseClient } from '~~/server/database/client'
import { APIError } from 'better-auth'
import { doDatabaseOperation } from '~~/server/database/helper'
import { findMemberForValidation } from './find-member-for-validation'
import { setValidationToken } from './set-validation-token'

interface VerifyMemberInput {
  clubSlug: string
  firstName: string
  lastName: string
  birthdate: Date
}

export const verifyMemberValidation = async (
  input: VerifyMemberInput,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // Find club by slug
  const club = await db.query.club.findFirst({
    columns: { id: true, slug: true },
    where: (c, { eq }) => eq(c.slug, input.clubSlug),
  })

  if (!club) {
    throw new APIError('NOT_FOUND', {
      message: 'Verein nicht gefunden.',
    })
  }

  // Find member by personal data
  const member = await findMemberForValidation({
    clubId: club.id,
    firstName: input.firstName,
    lastName: input.lastName,
    birthdate: input.birthdate,
  }, db)

  if (!member) {
    throw new APIError('NOT_FOUND', {
      message: 'Kein passendes Mitglied gefunden. Bitte Daten prüfen.',
    })
  }

  // Generate and set validation token
  const { token } = await setValidationToken(member.id, db)

  return {
    success: true,
    token,
    clubSlug: club.slug,
  }
}, tx)

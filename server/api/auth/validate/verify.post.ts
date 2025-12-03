import { APIError } from 'better-auth'
import { z } from 'zod'
import { findMemberForValidation } from '~~/server/actions/memberValidation/find-member-for-validation'
import { setValidationToken } from '~~/server/actions/memberValidation/set-validation-token'
import { doDatabaseOperation } from '~~/server/database/helper'
import { slugSchema } from '~~/server/utils/validation'

const VerifyMemberSchema = z.object({
  clubSlug: slugSchema,
  firstName: z.string().min(1, 'Vorname ist erforderlich').max(100),
  lastName: z.string().min(1, 'Nachname ist erforderlich').max(100),
  birthdate: z.coerce.date(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, data => VerifyMemberSchema.parse(data))

  return await doDatabaseOperation(async (db) => {
    // Find club by slug
    const club = await db.query.club.findFirst({
      columns: { id: true, slug: true },
      where: (c, { eq }) => eq(c.slug, body.clubSlug),
    })

    if (!club) {
      throw new APIError('NOT_FOUND', {
        message: 'Verein nicht gefunden.',
      })
    }

    // Find member by personal data
    // TODO: Consider if you want to restrict this to only members without userId
    const member = await findMemberForValidation({
      clubId: club.id,
      firstName: body.firstName,
      lastName: body.lastName,
      birthdate: body.birthdate,
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
  })
})

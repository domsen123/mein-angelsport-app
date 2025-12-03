import { APIError } from 'better-auth'
import { z } from 'zod'
import { clearValidationToken } from '~~/server/actions/memberValidation/clear-validation-token'
import { getMemberByToken } from '~~/server/actions/memberValidation/get-member-by-token'
import { linkUserToMember } from '~~/server/actions/memberValidation/link-user-to-member'
import { doDatabaseOperation } from '~~/server/database/helper'
import { auth } from '~~/server/utils/auth'
import { slugSchema } from '~~/server/utils/validation'

const CompleteMemberValidationSchema = z.object({
  clubSlug: slugSchema,
  token: z.string().length(64, 'Ungültiger Token'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben'),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, data => CompleteMemberValidationSchema.parse(data))

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

    // Find member by validation token
    const member = await getMemberByToken({
      clubId: club.id,
      token: body.token,
    }, db)

    if (!member) {
      throw new APIError('BAD_REQUEST', {
        message: 'Der Link ist abgelaufen oder ungültig. Bitte erneut versuchen.',
      })
    }

    let userId: string
    let session: any

    // Check if member already has a userId linked
    // TODO: Consider if you want to restrict this flow to only allow login for already-linked members
    if (member.userId) {
      // Member already linked - only login allowed
      try {
        session = await auth.api.signInEmail({
          body: {
            email: body.email,
            password: body.password,
          },
        })
      }
      catch {
        throw new APIError('UNAUTHORIZED', {
          message: 'Falsche E-Mail oder Passwort.',
        })
      }

      // Clear token after successful login
      await clearValidationToken(member.id, db)

      // Set session cookie
      const headers = session.headers
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          setHeader(event, key, value as string)
        }
      }

      return {
        success: true,
        user: session.user,
        clubSlug: club.slug,
      }
    }

    // Member not linked - try to register, fallback to login
    const memberName = [member.firstName, member.lastName].filter(Boolean).join(' ') || 'Mitglied'

    // Try to sign up first
    try {
      session = await auth.api.signUpEmail({
        body: {
          name: memberName,
          email: body.email,
          password: body.password,
        },
      })
      userId = session.user?.id

      if (!userId) {
        throw new Error('No user ID returned')
      }

      // Link user to member
      await linkUserToMember({ memberId: member.id, userId }, db)

      // Set session cookie
      const headers = session.headers
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          setHeader(event, key, value as string)
        }
      }

      return {
        success: true,
        user: session.user,
        clubSlug: club.slug,
        isNewUser: true,
      }
    }
    catch {
      // Sign up failed - try login (email might already exist)
    }

    // Try login
    try {
      session = await auth.api.signInEmail({
        body: {
          email: body.email,
          password: body.password,
        },
      })
      userId = session.user?.id

      if (!userId) {
        throw new Error('No user ID returned')
      }

      // Link user to member
      await linkUserToMember({ memberId: member.id, userId }, db)

      // Set session cookie
      const headers = session.headers
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          setHeader(event, key, value as string)
        }
      }

      return {
        success: true,
        user: session.user,
        clubSlug: club.slug,
        isNewUser: false,
      }
    }
    catch {
      throw new APIError('UNAUTHORIZED', {
        message: 'Falsche E-Mail oder Passwort.',
      })
    }
  })
})

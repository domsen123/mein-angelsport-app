import type { DatabaseClient } from '~~/server/database/client'
import { APIError } from 'better-auth'
import { doDatabaseOperation } from '~~/server/database/helper'
import { auth } from '~~/server/utils/auth'
import { clearValidationToken } from './clear-validation-token'
import { getMemberByToken } from './get-member-by-token'
import { linkUserToMember } from './link-user-to-member'

interface CompleteMemberInput {
  clubSlug: string
  token: string
  email: string
  password: string
}

interface CompleteMemberResult {
  success: true
  user: any
  clubSlug: string
  isNewUser?: boolean
  headers?: Record<string, string>
}

export const completeMemberValidation = async (
  input: CompleteMemberInput,
  tx?: DatabaseClient,
): Promise<CompleteMemberResult> => doDatabaseOperation(async (db) => {
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

  // Find member by validation token
  const member = await getMemberByToken({
    clubId: club.id,
    token: input.token,
  }, db)

  if (!member) {
    throw new APIError('BAD_REQUEST', {
      message: 'Der Link ist abgelaufen oder ungültig. Bitte erneut versuchen.',
    })
  }

  // Helper to extract headers as plain object
  const extractHeaders = (headers: Headers | undefined): Record<string, string> | undefined => {
    if (!headers) return undefined
    const result: Record<string, string> = {}
    headers.forEach((value, key) => {
      result[key] = value
    })
    return result
  }

  // Member already linked - only login allowed
  if (member.userId) {
    let session: any
    try {
      session = await auth.api.signInEmail({
        body: {
          email: input.email,
          password: input.password,
        },
      })
    }
    catch {
      throw new APIError('UNAUTHORIZED', {
        message: 'Falsche E-Mail oder Passwort.',
      })
    }

    await clearValidationToken(member.id, db)

    return {
      success: true,
      user: session.user,
      clubSlug: club.slug,
      headers: extractHeaders(session.headers),
    }
  }

  // Member not linked - try to register, fallback to login
  const memberName = [member.firstName, member.lastName].filter(Boolean).join(' ') || 'Mitglied'

  // Try signup first
  try {
    const session = await auth.api.signUpEmail({
      body: {
        name: memberName,
        email: input.email,
        password: input.password,
      },
    }) as any

    const userId = session.user?.id
    if (!userId) {
      throw new Error('No user ID returned')
    }

    await linkUserToMember({ memberId: member.id, userId }, db)

    return {
      success: true,
      user: session.user,
      clubSlug: club.slug,
      isNewUser: true,
      headers: extractHeaders(session.headers),
    }
  }
  catch {
    // Signup failed - try login
  }

  // Try login
  try {
    const session = await auth.api.signInEmail({
      body: {
        email: input.email,
        password: input.password,
      },
    }) as any

    const userId = session.user?.id
    if (!userId) {
      throw new Error('No user ID returned')
    }

    await linkUserToMember({ memberId: member.id, userId }, db)

    return {
      success: true,
      user: session.user,
      clubSlug: club.slug,
      isNewUser: false,
      headers: extractHeaders(session.headers),
    }
  }
  catch {
    throw new APIError('UNAUTHORIZED', {
      message: 'Falsche E-Mail oder Passwort.',
    })
  }
}, tx)

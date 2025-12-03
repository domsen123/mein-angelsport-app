import type { DatabaseClient } from '~~/server/database/client'
import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubMember } from '~~/server/database/schema/club.schema'

const TOKEN_VALIDITY_DAYS = 7

/**
 * Generate and set a validation token for a club member.
 * Token is valid for 7 days.
 */
export const setValidationToken = async (
  memberId: string,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + TOKEN_VALIDITY_DAYS * 24 * 60 * 60 * 1000)

  await db.update(clubMember)
    .set({
      validationToken: token,
      validationTokenExpiresAt: expiresAt,
    })
    .where(eq(clubMember.id, memberId))

  return { token, expiresAt }
}, tx)

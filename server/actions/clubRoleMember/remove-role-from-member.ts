import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubMemberRole } from '~~/server/database/schema'

export const RemoveRoleFromMemberCommandSchema = z.object({
  memberId: ulidSchema,
  roleId: ulidSchema,
})

export type RemoveRoleFromMemberCommand = z.infer<typeof RemoveRoleFromMemberCommandSchema>

export const _removeRoleFromMember = async (
  input: RemoveRoleFromMemberCommand,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = RemoveRoleFromMemberCommandSchema.parse(input)

  const deleted = await db
    .delete(clubMemberRole)
    .where(and(
      eq(clubMemberRole.memberId, data.memberId),
      eq(clubMemberRole.roleId, data.roleId),
    ))
    .returning()

  if (!deleted.length) {
    throw createError({
      statusCode: 404,
      message: 'Role assignment not found',
    })
  }

  return deleted[0]
}, tx)

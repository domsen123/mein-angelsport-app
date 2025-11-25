import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permit } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const DeletePermitCommandSchema = z.object({
  clubId: ulidSchema,
  permitId: ulidSchema,
})

export type DeletePermitCommand = z.infer<typeof DeletePermitCommandSchema>

export const _deletePermit = async (
  input: DeletePermitCommand,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = DeletePermitCommandSchema.parse(input)

  const [deletedPermit] = await db
    .delete(permit)
    .where(and(eq(permit.id, data.permitId), eq(permit.clubId, data.clubId)))
    .returning()

  if (!deletedPermit) {
    throw new Error('Permit not found')
  }

  return deletedPermit
}, tx)

export const deletePermit = async (
  input: DeletePermitCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _deletePermit(input, context, db)
}, tx)

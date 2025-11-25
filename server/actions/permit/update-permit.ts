import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permit } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const UpdatePermitCommandSchema = z.object({
  clubId: ulidSchema,
  permitId: ulidSchema,
  name: z.string().min(1).max(100),
})

export type UpdatePermitCommand = z.infer<typeof UpdatePermitCommandSchema>

export const _updatePermit = async (
  input: UpdatePermitCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = UpdatePermitCommandSchema.parse(input)

  const [updatedPermit] = await db
    .update(permit)
    .set({
      name: data.name,
      updatedBy: context.userId,
    })
    .where(and(eq(permit.id, data.permitId), eq(permit.clubId, data.clubId)))
    .returning()

  if (!updatedPermit) {
    throw new Error('Permit not found')
  }

  return updatedPermit
}, tx)

export const updatePermit = async (
  input: UpdatePermitCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _updatePermit(input, context, db)
}, tx)

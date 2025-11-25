import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permit, permitWater } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const RemoveWaterFromPermitCommandSchema = z.object({
  clubId: ulidSchema,
  permitId: ulidSchema,
  waterId: ulidSchema,
})

export type RemoveWaterFromPermitCommand = z.infer<typeof RemoveWaterFromPermitCommandSchema>

export const _removeWaterFromPermit = async (
  input: RemoveWaterFromPermitCommand,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = RemoveWaterFromPermitCommandSchema.parse(input)

  const [removed] = await db
    .delete(permitWater)
    .where(and(
      eq(permitWater.permitId, data.permitId),
      eq(permitWater.waterId, data.waterId),
    ))
    .returning()

  if (!removed) {
    throw new Error('Water assignment not found')
  }

  return removed
}, tx)

export const removeWaterFromPermit = async (
  input: RemoveWaterFromPermitCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // Verify permit belongs to club
  const permitRecord = await db.query.permit.findFirst({
    where: eq(permit.id, input.permitId),
    columns: { clubId: true },
  })

  if (!permitRecord || permitRecord.clubId !== input.clubId) {
    throw new Error('Permit not found')
  }

  await isExecutorClubAdmin(input.clubId, context, db)
  return _removeWaterFromPermit(input, context, db)
}, tx)

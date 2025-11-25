import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permit, permitWater } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const AssignWaterToPermitCommandSchema = z.object({
  clubId: ulidSchema,
  permitId: ulidSchema,
  waterId: ulidSchema,
})

export type AssignWaterToPermitCommand = z.infer<typeof AssignWaterToPermitCommandSchema>

export const _assignWaterToPermit = async (
  input: AssignWaterToPermitCommand,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = AssignWaterToPermitCommandSchema.parse(input)

  const [assigned] = await db
    .insert(permitWater)
    .values({
      permitId: data.permitId,
      waterId: data.waterId,
    })
    .onConflictDoNothing()
    .returning()

  return assigned ?? { permitId: data.permitId, waterId: data.waterId }
}, tx)

export const assignWaterToPermit = async (
  input: AssignWaterToPermitCommand,
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
  return _assignWaterToPermit(input, context, db)
}, tx)

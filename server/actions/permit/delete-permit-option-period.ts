import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permit, permitOption, permitOptionPeriod } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const DeletePermitOptionPeriodCommandSchema = z.object({
  clubId: ulidSchema,
  permitId: ulidSchema,
  optionId: ulidSchema,
  periodId: ulidSchema,
})

export type DeletePermitOptionPeriodCommand = z.infer<typeof DeletePermitOptionPeriodCommandSchema>

export const _deletePermitOptionPeriod = async (
  input: DeletePermitOptionPeriodCommand,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = DeletePermitOptionPeriodCommandSchema.parse(input)

  const [deletedPeriod] = await db
    .delete(permitOptionPeriod)
    .where(eq(permitOptionPeriod.id, data.periodId))
    .returning()

  if (!deletedPeriod) {
    throw new Error('Permit option period not found')
  }

  return deletedPeriod
}, tx)

export const deletePermitOptionPeriod = async (
  input: DeletePermitOptionPeriodCommand,
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

  // Verify option belongs to permit
  const optionRecord = await db.query.permitOption.findFirst({
    where: eq(permitOption.id, input.optionId),
    columns: { permitId: true },
  })

  if (!optionRecord || optionRecord.permitId !== input.permitId) {
    throw new Error('Permit option not found')
  }

  await isExecutorClubAdmin(input.clubId, context, db)
  return _deletePermitOptionPeriod(input, context, db)
}, tx)

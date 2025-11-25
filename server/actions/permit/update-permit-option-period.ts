import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permit, permitOption, permitOptionPeriod } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const UpdatePermitOptionPeriodCommandSchema = z.object({
  clubId: ulidSchema,
  permitId: ulidSchema,
  optionId: ulidSchema,
  periodId: ulidSchema,
  validFrom: z.iso.date().optional(),
  validTo: z.iso.date().optional(),
  priceCents: z.string().min(1).optional(),
  permitNumberStart: z.number().int().min(1).optional(),
  permitNumberEnd: z.number().int().min(1).optional(),
})

export type UpdatePermitOptionPeriodCommand = z.infer<typeof UpdatePermitOptionPeriodCommandSchema>

export const _updatePermitOptionPeriod = async (
  input: UpdatePermitOptionPeriodCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = UpdatePermitOptionPeriodCommandSchema.parse(input)

  const updateData: Record<string, any> = {
    updatedBy: context.userId,
  }

  if (data.validFrom !== undefined) updateData.validFrom = new Date(data.validFrom)
  if (data.validTo !== undefined) updateData.validTo = new Date(data.validTo)
  if (data.priceCents !== undefined) updateData.priceCents = data.priceCents
  if (data.permitNumberStart !== undefined) updateData.permitNumberStart = data.permitNumberStart
  if (data.permitNumberEnd !== undefined) updateData.permitNumberEnd = data.permitNumberEnd

  const [updatedPeriod] = await db
    .update(permitOptionPeriod)
    .set(updateData)
    .where(eq(permitOptionPeriod.id, data.periodId))
    .returning()

  if (!updatedPeriod) {
    throw new Error('Permit option period not found')
  }

  return updatedPeriod
}, tx)

export const updatePermitOptionPeriod = async (
  input: UpdatePermitOptionPeriodCommand,
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
  return _updatePermitOptionPeriod(input, context, db)
}, tx)

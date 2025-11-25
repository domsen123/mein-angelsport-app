import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permit, permitInstance, permitOption, permitOptionPeriod } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const UpdatePermitInstanceCommandSchema = z.object({
  clubId: ulidSchema,
  permitId: ulidSchema,
  optionId: ulidSchema,
  periodId: ulidSchema,
  instanceId: ulidSchema,

  // Updatable fields
  status: z.enum(['available', 'reserved', 'sold', 'cancelled']).optional(),
  ownerMemberId: z.string().nullable().optional(),
  ownerName: z.string().nullable().optional(),
  ownerEmail: z.string().email().nullable().optional(),
  ownerPhone: z.string().nullable().optional(),
  paymentReference: z.string().nullable().optional(),
  paidCents: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type UpdatePermitInstanceCommand = z.infer<typeof UpdatePermitInstanceCommandSchema>

const _updatePermitInstance = async (
  input: UpdatePermitInstanceCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = UpdatePermitInstanceCommandSchema.parse(input)
  const now = new Date()

  // Build update object
  const updateData: Record<string, any> = {
    updatedBy: context.userId,
  }

  // Handle each optional field
  if (data.status !== undefined) {
    updateData.status = data.status

    // Auto-set timestamps based on status change
    if (data.status === 'reserved') {
      updateData.reservedAt = now
    }
    else if (data.status === 'sold') {
      updateData.soldAt = now
    }
    else if (data.status === 'cancelled') {
      updateData.cancelledAt = now
    }
  }

  if (data.ownerMemberId !== undefined) updateData.ownerMemberId = data.ownerMemberId
  if (data.ownerName !== undefined) updateData.ownerName = data.ownerName
  if (data.ownerEmail !== undefined) updateData.ownerEmail = data.ownerEmail
  if (data.ownerPhone !== undefined) updateData.ownerPhone = data.ownerPhone
  if (data.paymentReference !== undefined) updateData.paymentReference = data.paymentReference
  if (data.paidCents !== undefined) updateData.paidCents = data.paidCents
  if (data.notes !== undefined) updateData.notes = data.notes

  const [updatedInstance] = await db
    .update(permitInstance)
    .set(updateData)
    .where(eq(permitInstance.id, data.instanceId))
    .returning()

  if (!updatedInstance) {
    throw new Error('Permit instance not found')
  }

  return updatedInstance
}, tx)

export const updatePermitInstance = async (
  input: UpdatePermitInstanceCommand,
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

  // Verify period belongs to option
  const periodRecord = await db.query.permitOptionPeriod.findFirst({
    where: eq(permitOptionPeriod.id, input.periodId),
    columns: { permitOptionId: true },
  })

  if (!periodRecord || periodRecord.permitOptionId !== input.optionId) {
    throw new Error('Permit option period not found')
  }

  // Verify instance belongs to period
  const instanceRecord = await db.query.permitInstance.findFirst({
    where: eq(permitInstance.id, input.instanceId),
    columns: { permitOptionPeriodId: true },
  })

  if (!instanceRecord || instanceRecord.permitOptionPeriodId !== input.periodId) {
    throw new Error('Permit instance not found')
  }

  await isExecutorClubAdmin(input.clubId, context, db)
  return _updatePermitInstance(input, context, db)
}, tx)

// Export response types
export type UpdatePermitInstanceResponse = Awaited<ReturnType<typeof _updatePermitInstance>>

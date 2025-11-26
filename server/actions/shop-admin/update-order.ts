import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubOrder } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const UpdateOrderCommandSchema = z.object({
  clubId: ulidSchema,
  orderId: ulidSchema,
  status: z.enum(['PENDING', 'PAID', 'FULFILLED', 'CANCELLED']).optional(),
  externalRef: z.string().max(255).nullish().transform(v => v || null),
  notes: z.string().max(2000).nullish().transform(v => v || null),
})

export type UpdateOrderCommand = z.infer<typeof UpdateOrderCommandSchema>

export const _updateOrder = async (
  input: UpdateOrderCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = UpdateOrderCommandSchema.parse(input)

  // Verify order exists and belongs to club
  const existing = await db.query.clubOrder.findFirst({
    where: and(
      eq(clubOrder.clubId, data.clubId),
      eq(clubOrder.id, data.orderId),
    ),
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Bestellung nicht gefunden',
    })
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: context.userId,
  }

  if (data.status !== undefined) {
    updateData.status = data.status
  }

  if (data.externalRef !== undefined) {
    updateData.externalRef = data.externalRef
  }

  if (data.notes !== undefined) {
    updateData.notes = data.notes
  }

  const [updatedOrder] = await db
    .update(clubOrder)
    .set(updateData)
    .where(eq(clubOrder.id, data.orderId))
    .returning()

  return updatedOrder
}, tx)

export const updateOrder = async (
  input: UpdateOrderCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _updateOrder(input, context, db)
}, tx)

export type UpdateOrderResponse = Awaited<ReturnType<typeof _updateOrder>>

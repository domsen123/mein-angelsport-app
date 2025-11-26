import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubRolePermitDiscount } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const UpdateDiscountCommandSchema = z.object({
  clubId: ulidSchema,
  discountId: ulidSchema,
  discountPercent: z
    .number()
    .int()
    .min(0, 'Rabatt muss mindestens 0% sein')
    .max(100, 'Rabatt darf maximal 100% sein'),
})

export type UpdateDiscountCommand = z.infer<typeof UpdateDiscountCommandSchema>

export const _updateDiscount = async (
  input: UpdateDiscountCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = UpdateDiscountCommandSchema.parse(input)

  const [updated] = await db
    .update(clubRolePermitDiscount)
    .set({
      discountPercent: data.discountPercent,
      updatedBy: context.userId,
      updatedAt: new Date(),
    })
    .where(eq(clubRolePermitDiscount.id, data.discountId))
    .returning()

  if (!updated) {
    throw createError({
      statusCode: 404,
      message: 'Rabatt nicht gefunden',
    })
  }

  return updated
}, tx)

export const updateDiscount = async (
  input: UpdateDiscountCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _updateDiscount(input, context, db)
}, tx)

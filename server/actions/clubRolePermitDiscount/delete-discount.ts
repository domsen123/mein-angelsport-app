import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubRolePermitDiscount } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const DeleteDiscountCommandSchema = z.object({
  clubId: ulidSchema,
  discountId: ulidSchema,
})

export type DeleteDiscountCommand = z.infer<typeof DeleteDiscountCommandSchema>

export const _deleteDiscount = async (
  input: DeleteDiscountCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = DeleteDiscountCommandSchema.parse(input)

  const [deleted] = await db
    .delete(clubRolePermitDiscount)
    .where(eq(clubRolePermitDiscount.id, data.discountId))
    .returning()

  if (!deleted) {
    throw createError({
      statusCode: 404,
      message: 'Rabatt nicht gefunden',
    })
  }

  return deleted
}, tx)

export const deleteDiscount = async (
  input: DeleteDiscountCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _deleteDiscount(input, context, db)
}, tx)

import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { ulid } from 'ulid'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubRolePermitDiscount } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const CreateDiscountCommandSchema = z.object({
  clubId: ulidSchema,
  clubRoleId: ulidSchema,
  permitOptionId: ulidSchema,
  discountPercent: z
    .number()
    .int()
    .min(0, 'Rabatt muss mindestens 0% sein')
    .max(100, 'Rabatt darf maximal 100% sein'),
})

export type CreateDiscountCommand = z.infer<typeof CreateDiscountCommandSchema>

export const _createDiscount = async (
  input: CreateDiscountCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = CreateDiscountCommandSchema.parse(input)

  const discountId = ulid()
  const now = new Date()

  const [created] = await db
    .insert(clubRolePermitDiscount)
    .values({
      id: discountId,
      clubRoleId: data.clubRoleId,
      permitOptionId: data.permitOptionId,
      discountPercent: data.discountPercent,
      createdBy: context.userId,
      updatedBy: context.userId,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return created
}, tx)

export const createDiscount = async (
  input: CreateDiscountCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _createDiscount(input, context, db)
}, tx)

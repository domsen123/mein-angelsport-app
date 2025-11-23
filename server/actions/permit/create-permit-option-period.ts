import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { ulid } from 'ulid'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permitOptionPeriod } from '~~/server/database/schema'

export const CreatePermitOptionPeriodCommandSchema = z.object({
  permitOptionId: ulidSchema,

  validFrom: z.iso.date(),
  validTo: z.iso.date(),

  priceCents: z.string().min(1),
  permitNumberStart: z.number().int().min(1),
  permitNumberEnd: z.number().int().min(1),
})
export type CreatePermitOptionPeriodCommand = z.infer<typeof CreatePermitOptionPeriodCommandSchema>

export const _createPermitOptionPeriod = async (
  input: CreatePermitOptionPeriodCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // validation
  const data = CreatePermitOptionPeriodCommandSchema.parse(input)

  // preperation
  const now = new Date()
  const id = ulid()

  // execution
  const [createdPermitOptionPeriod] = await db
    .insert(permitOptionPeriod)
    .values({
      id,
      permitOptionId: data.permitOptionId,

      validFrom: new Date(data.validFrom),
      validTo: new Date(data.validTo),

      priceCents: data.priceCents,
      permitNumberStart: data.permitNumberStart,
      permitNumberEnd: data.permitNumberEnd,

      createdAt: now,
      updatedAt: now,
      createdBy: context.userId,
      updatedBy: context.userId,
    })
    .returning()

  return createdPermitOptionPeriod
}, tx)

export const createPermitOptionPeriod = async (
  input: CreatePermitOptionPeriodCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  return _createPermitOptionPeriod(input, context, db)
}, tx)

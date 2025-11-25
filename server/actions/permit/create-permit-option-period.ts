import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import { ulid } from 'ulid'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permit, permitOption, permitOptionPeriod } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'
import { _generatePermitInstances } from '../permitInstance/generate-permit-instances'

export const CreatePermitOptionPeriodCommandSchema = z.object({
  clubId: ulidSchema,
  permitId: ulidSchema,
  optionId: ulidSchema,

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
      permitOptionId: data.optionId,

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

  // Generate permit instances for the number range
  await _generatePermitInstances(
    {
      periodId: id,
      numberStart: data.permitNumberStart,
      numberEnd: data.permitNumberEnd,
    },
    context,
    db,
  )

  return createdPermitOptionPeriod
}, tx)

export const createPermitOptionPeriod = async (
  input: CreatePermitOptionPeriodCommand,
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
  return _createPermitOptionPeriod(input, context, db)
}, tx)

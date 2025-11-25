import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permit, permitInstance, permitOption, permitOptionPeriod } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetPermitInstanceByIdCommandSchema = z.object({
  clubId: ulidSchema,
  permitId: ulidSchema,
  optionId: ulidSchema,
  periodId: ulidSchema,
  instanceId: ulidSchema,
})

export type GetPermitInstanceByIdCommand = z.infer<typeof GetPermitInstanceByIdCommandSchema>

const _getPermitInstanceById = async (
  input: GetPermitInstanceByIdCommand,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetPermitInstanceByIdCommandSchema.parse(input)

  const instance = await db.query.permitInstance.findFirst({
    where: eq(permitInstance.id, data.instanceId),
    with: {
      ownerMember: true,
      buyer: true,
      optionPeriod: {
        with: {
          option: {
            with: {
              permit: true,
            },
          },
        },
      },
    },
  })

  if (!instance) {
    throw new Error('Permit instance not found')
  }

  return instance
}, tx)

export const getPermitInstanceById = async (
  input: GetPermitInstanceByIdCommand,
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
  return _getPermitInstanceById(input, context, db)
}, tx)

// Export response types
export type GetPermitInstanceByIdResponse = Awaited<ReturnType<typeof _getPermitInstanceById>>

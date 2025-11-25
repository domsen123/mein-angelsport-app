import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permit, permitOption } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const UpdatePermitOptionCommandSchema = z.object({
  clubId: ulidSchema,
  permitId: ulidSchema,
  optionId: ulidSchema,
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
})

export type UpdatePermitOptionCommand = z.infer<typeof UpdatePermitOptionCommandSchema>

export const _updatePermitOption = async (
  input: UpdatePermitOptionCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = UpdatePermitOptionCommandSchema.parse(input)

  const [updatedOption] = await db
    .update(permitOption)
    .set({
      name: data.name ?? null,
      description: data.description ?? null,
      updatedBy: context.userId,
    })
    .where(eq(permitOption.id, data.optionId))
    .returning()

  if (!updatedOption) {
    throw new Error('Permit option not found')
  }

  return updatedOption
}, tx)

export const updatePermitOption = async (
  input: UpdatePermitOptionCommand,
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

  await isExecutorClubAdmin(input.clubId, context, db)
  return _updatePermitOption(input, context, db)
}, tx)

import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permit, permitOption } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const DeletePermitOptionCommandSchema = z.object({
  clubId: ulidSchema,
  permitId: ulidSchema,
  optionId: ulidSchema,
})

export type DeletePermitOptionCommand = z.infer<typeof DeletePermitOptionCommandSchema>

export const _deletePermitOption = async (
  input: DeletePermitOptionCommand,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = DeletePermitOptionCommandSchema.parse(input)

  const [deletedOption] = await db
    .delete(permitOption)
    .where(eq(permitOption.id, data.optionId))
    .returning()

  if (!deletedOption) {
    throw new Error('Permit option not found')
  }

  return deletedOption
}, tx)

export const deletePermitOption = async (
  input: DeletePermitOptionCommand,
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
  return _deletePermitOption(input, context, db)
}, tx)

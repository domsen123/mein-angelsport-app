import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permitWater } from '~~/server/database/schema'

export const AssignPermitToWaterCommandSchema = z.object({
  permitId: ulidSchema,
  waterId: ulidSchema,
})
export type AssignPermitToWaterCommand = z.infer<typeof AssignPermitToWaterCommandSchema>

export const _assignPermitToWater = async (
  input: AssignPermitToWaterCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // validation
  const data = AssignPermitToWaterCommandSchema.parse(input)

  // execution
  await db
    .insert(permitWater)
    .values({
      permitId: data.permitId,
      waterId: data.waterId,
    })
}, tx)

export const assignPermitToWater = async (
  input: AssignPermitToWaterCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // TODO: Validation? Permissions?
  return await _assignPermitToWater(input, context, db)
}, tx)

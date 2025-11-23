import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { club_water } from '~~/server/database/schema'

export const AssignWaterToClubCommandSchema = z.object({
  clubId: ulidSchema,
  waterId: ulidSchema,
})

export type AssignWaterToClubCommand = z.infer<typeof AssignWaterToClubCommandSchema>

export const _assignWaterToClub = async (
  input: AssignWaterToClubCommand,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // validation
  const data = AssignWaterToClubCommandSchema.parse(input)

  // execution
  const [createdAssignment] = await db
    .insert(club_water)
    .values({
      clubId: data.clubId,
      waterId: data.waterId,
    })
    .returning()

  return createdAssignment
}, tx)

export const assignWaterToClub = async (
  input: AssignWaterToClubCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // Todo: some validation?
  return _assignWaterToClub(input, db)
}, tx)

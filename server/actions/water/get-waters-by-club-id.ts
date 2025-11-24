import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'

export const GetWatersByClubIdCommandSchema = z.object({
  clubId: ulidSchema,
})

export type GetWatersByClubIdCommand = z.infer<typeof GetWatersByClubIdCommandSchema>

export const _getWatersByClubId = async (
  input: GetWatersByClubIdCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // validation
  const data = GetWatersByClubIdCommandSchema.parse(input)

  // query
  const waters = await db.query.water.findMany({
    with: {
      clubs: {
        where: (clubWater, { eq }) => eq(clubWater.clubId, data.clubId),
      },
    },
  })

  return waters
}, tx)

export const getWatersByClubId = async (
  input: GetWatersByClubIdCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  return _getWatersByClubId(input, context, db)
}, tx)

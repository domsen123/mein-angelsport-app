import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { club_water } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetWatersByClubIdCommandSchema = z.object({
  clubId: ulidSchema,
})

export type GetWatersByClubIdCommand = z.infer<typeof GetWatersByClubIdCommandSchema>

export const _getWatersByClubId = async (
  input: GetWatersByClubIdCommand,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // validation
  const data = GetWatersByClubIdCommandSchema.parse(input)

  // Query club waters with their water details
  const clubWaters = await db.query.club_water.findMany({
    where: eq(club_water.clubId, data.clubId),
    with: {
      water: true,
    },
  })

  // Return just the water objects
  return clubWaters.map(cw => cw.water)
}, tx)

export const getWatersByClubId = async (
  input: GetWatersByClubIdCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getWatersByClubId(input, context, db)
}, tx)

// Response types for frontend usage
export type GetWatersByClubIdResponse = Awaited<ReturnType<typeof _getWatersByClubId>>
export type WaterItem = GetWatersByClubIdResponse[number]

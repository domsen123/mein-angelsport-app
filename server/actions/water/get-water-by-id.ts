import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { club_water } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetWaterByIdCommandSchema = z.object({
  clubId: ulidSchema,
  waterId: ulidSchema,
})

export type GetWaterByIdCommandInput = z.infer<typeof GetWaterByIdCommandSchema>

export const _getWaterById = async (
  input: GetWaterByIdCommandInput,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetWaterByIdCommandSchema.parse(input)
  const { clubId, waterId } = data

  const clubWater = await db.query.club_water.findFirst({
    where: and(
      eq(club_water.clubId, clubId),
      eq(club_water.waterId, waterId),
    ),
    with: {
      water: true,
    },
  })

  if (!clubWater) {
    throw createError({
      statusCode: 404,
      message: 'Gewässer nicht gefunden',
    })
  }

  return clubWater.water
}, tx)

export const getWaterById = async (
  input: GetWaterByIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getWaterById(input, context, db)
}, tx)

export type GetWaterByIdResponse = Awaited<ReturnType<typeof _getWaterById>>

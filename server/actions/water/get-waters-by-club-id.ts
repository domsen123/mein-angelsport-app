import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import type { PaginationParams } from '~~/server/utils/validation'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { paginateQuery } from '~~/server/database/pagination'
import { club_water, water } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

// Schema for paginated admin query
export const GetWatersByClubIdCommandSchema = z.object({
  clubId: ulidSchema,
  pagination: paginationSchema,
})

export type GetWatersByClubIdCommand = z.infer<typeof GetWatersByClubIdCommandSchema>

// Schema for simple non-paginated query
export const GetWatersByClubIdSimpleCommandSchema = z.object({
  clubId: ulidSchema,
})

export type GetWatersByClubIdSimpleCommand = z.infer<typeof GetWatersByClubIdSimpleCommandSchema>

// Paginated query for admin pages
export const _getWatersByClubId = async (
  input: GetWatersByClubIdCommand,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetWatersByClubIdCommandSchema.parse(input)
  const { clubId, pagination } = data

  const result = await paginateQuery(db, club_water, 'club_water', pagination, {
    searchableColumns: [water.name, water.postCode],
    sortableColumns: {
      name: water.name,
      type: water.type,
      postCode: water.postCode,
      createdAt: water.createdAt,
    },
    baseFilter: eq(club_water.clubId, clubId),
    with: {
      water: true,
    },
  })

  // Transform: return water objects with assignedAt from junction table
  const items = result.items.map(cw => ({
    ...cw.water,
    assignedAt: cw.validatedAt,
  }))

  return { ...result, items }
}, tx)

// Admin paginated endpoint
export const getWatersByClubId = async (
  input: GetWatersByClubIdCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getWatersByClubId(input, context, db)
}, tx)

// Simple non-paginated query for public pages
export const _getWatersByClubIdSimple = async (
  input: GetWatersByClubIdSimpleCommand,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetWatersByClubIdSimpleCommandSchema.parse(input)

  const clubWaters = await db.query.club_water.findMany({
    where: eq(club_water.clubId, data.clubId),
    with: {
      water: true,
    },
  })

  // Return just the water objects
  return clubWaters.map(cw => cw.water)
}, tx)

// Public non-paginated endpoint (requires authentication but not admin)
export const getWatersByClubIdSimple = async (
  input: GetWatersByClubIdSimpleCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  return _getWatersByClubIdSimple(input, context, db)
}, tx)

// Response types for frontend usage
export type GetWatersByClubIdResponse = Awaited<ReturnType<typeof _getWatersByClubId>>
export type WaterItem = GetWatersByClubIdResponse['items'][number]

export type GetWatersByClubIdSimpleResponse = Awaited<ReturnType<typeof _getWatersByClubIdSimple>>
export type WaterItemSimple = GetWatersByClubIdSimpleResponse[number]

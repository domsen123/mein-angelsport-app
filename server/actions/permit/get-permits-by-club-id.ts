import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { paginateQuery } from '~~/server/database/pagination'
import { permit, permitOption, permitWater } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetPermitsByClubIdCommandSchema = z.object({
  clubId: ulidSchema,
  pagination: paginationSchema,
})

export type GetPermitsByClubIdCommandInput = z.infer<typeof GetPermitsByClubIdCommandSchema>

export const _getPermitsByClubId = async (
  input: GetPermitsByClubIdCommandInput,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetPermitsByClubIdCommandSchema.parse(input)
  const { clubId, pagination } = data

  const result = await paginateQuery(db, permit, 'permit', pagination, {
    searchableColumns: [permit.name],
    sortableColumns: {
      name: permit.name,
      createdAt: permit.createdAt,
    },
    baseFilter: eq(permit.clubId, clubId),
    defaultSort: { column: permit.createdAt, direction: 'desc' },
  })

  // Get counts for waters and options for each permit
  const permitIds = result.items.map(p => p.id)

  if (permitIds.length === 0) {
    return {
      ...result,
      items: [],
    }
  }

  // Get water counts
  const waterCounts = await db
    .select({
      permitId: permitWater.permitId,
      count: sql<number>`count(*)::int`.as('count'),
    })
    .from(permitWater)
    .where(sql`${permitWater.permitId} IN ${permitIds}`)
    .groupBy(permitWater.permitId)

  // Get option counts
  const optionCounts = await db
    .select({
      permitId: permitOption.permitId,
      count: sql<number>`count(*)::int`.as('count'),
    })
    .from(permitOption)
    .where(sql`${permitOption.permitId} IN ${permitIds}`)
    .groupBy(permitOption.permitId)

  // Create lookup maps
  const waterCountMap = new Map(waterCounts.map(wc => [wc.permitId, wc.count]))
  const optionCountMap = new Map(optionCounts.map(oc => [oc.permitId, oc.count]))

  // Enrich items with counts
  const enrichedItems = result.items.map(p => ({
    ...p,
    watersCount: waterCountMap.get(p.id) ?? 0,
    optionsCount: optionCountMap.get(p.id) ?? 0,
  }))

  return {
    ...result,
    items: enrichedItems,
  }
}, tx)

export const getPermitsByClubId = async (
  input: GetPermitsByClubIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getPermitsByClubId(input, context, db)
}, tx)

// Response types for frontend usage
export type GetPermitsByClubIdResponse = Awaited<ReturnType<typeof _getPermitsByClubId>>
export type PermitItem = GetPermitsByClubIdResponse['items'][number]
